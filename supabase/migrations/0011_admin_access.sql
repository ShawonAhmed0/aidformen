-- =============================================================================
-- 0011 — delegated administrator access
-- =============================================================================
-- Only an existing access manager may promote a registered account. The email
-- lookup stays inside Postgres so auth.users (and its private fields) are never
-- exposed to the browser. Newly promoted administrators can use the CMS, but
-- cannot grant further administrator access unless that capability is assigned
-- separately by a trusted database operator.

begin;

-- Existing administrators are grandfathered exactly once. Keeping the update
-- inside the column-existence branch is important: rerunning this migration
-- must never upgrade administrators promoted by the application into access
-- managers.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'can_manage_admins'
  ) then
    alter table public.profiles
      add column can_manage_admins boolean not null default false;

    update public.profiles
    set can_manage_admins = true
    where role = 'admin';
  end if;
end $$;

create or replace function public.can_manage_admins()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and can_manage_admins = true
  );
$$;

revoke all on function public.can_manage_admins() from public;
revoke all on function public.can_manage_admins() from anon;
grant execute on function public.can_manage_admins() to authenticated;

-- Append-only provenance for grants. Email addresses deliberately stay out of
-- this table: the auth user id is enough for an audit without duplicating PII.
create table if not exists public.admin_access_audit (
  id             bigint generated always as identity primary key,
  -- Deliberately stored as immutable UUID snapshots rather than foreign keys:
  -- deleting an Auth account must neither block deletion nor erase who granted
  -- or received administrator access from the audit trail.
  actor_id       uuid not null,
  target_user_id uuid not null,
  action         text not null check (action in ('granted')),
  created_at     timestamptz not null default now()
);

alter table public.admin_access_audit enable row level security;

revoke all on table public.admin_access_audit from public;
revoke all on table public.admin_access_audit from anon;
revoke insert, update, delete on table public.admin_access_audit from authenticated;
grant select on table public.admin_access_audit to authenticated;

drop policy if exists admin_access_audit_manager_read on public.admin_access_audit;
create policy admin_access_audit_manager_read on public.admin_access_audit
  for select to authenticated
  using (public.can_manage_admins());

-- Guard every path to privileged profile fields, including direct REST calls.
-- `auth.role() is null` represents a direct trusted database session (such as
-- the SQL editor); browser requests carry anon/authenticated JWT roles.
create or replace function public.enforce_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_role text := auth.role();
  trusted_backend boolean := jwt_role = 'service_role' or jwt_role is null;
  actor_is_admin boolean := public.is_admin();
  audited_admin_grant boolean :=
    current_setting('app.admin_access_grant', true) = 'true';
begin
  if tg_op = 'INSERT' then
    -- A normal signup can never choose its role or approval state. Ordinary
    -- administrators may still approve members later through the existing UI.
    if not trusted_backend then
      new.role := 'member';
      new.can_manage_admins := false;
    end if;

    if not trusted_backend and not actor_is_admin then
      new.status := 'pending';
      new.approved_at := null;
      new.approved_by := null;
    end if;

    return new;
  end if;

  if new.role is distinct from old.role
     and not trusted_backend
     and not audited_admin_grant then
    raise exception 'Administrator role changes must use the audited grant operation.'
      using errcode = '42501';
  end if;

  if new.can_manage_admins is distinct from old.can_manage_admins
     and not trusted_backend then
    raise exception 'Access-manager permission can only be changed by a trusted database operator.'
      using errcode = '42501';
  end if;

  if (
    new.status is distinct from old.status
    or new.approved_at is distinct from old.approved_at
    or new.approved_by is distinct from old.approved_by
  ) and not trusted_backend and not actor_is_admin then
    raise exception 'Membership approval changes require administrator permission.'
      using errcode = '42501';
  end if;

  -- Do not let an access manager accidentally lock out their own account with
  -- a direct API call. No demotion UI is exposed by the application.
  if new.id = auth.uid()
     and old.can_manage_admins = true
     and (new.role is distinct from 'admin' or new.can_manage_admins = false)
     and not trusted_backend then
    raise exception 'An access manager cannot remove their own access.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_privileges() from public;

drop trigger if exists profiles_enforce_privileges on public.profiles;
create trigger profiles_enforce_privileges
  before insert or update on public.profiles
  for each row execute function public.enforce_profile_privileges();

-- Resolve one candidate for a deliberate review step before the grant. The
-- result contains only the minimum identity fields an access manager needs to
-- avoid granting privileges to the wrong registered account.
create or replace function public.lookup_admin_candidate(target_email text)
returns table (
  outcome text,
  user_id uuid,
  full_name text,
  avatar_url text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(btrim(coalesce(target_email, '')));
begin
  if auth.uid() is null or not public.can_manage_admins() then
    raise exception 'Administrator access cannot be managed by this account.'
      using errcode = '42501';
  end if;

  if char_length(normalized_email) = 0
     or char_length(normalized_email) > 254
     or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return query select 'invalid'::text, null::uuid, null::text, null::text;
    return;
  end if;

  return query
  select
    case when p.role = 'admin' then 'already_admin' else 'found' end::text,
    p.id,
    p.full_name,
    p.avatar_url
  from auth.users as u
  join public.profiles as p on p.id = u.id
  where lower(u.email) = normalized_email
    and u.email_confirmed_at is not null
    and u.deleted_at is null
    and (u.banned_until is null or u.banned_until <= now())
  limit 1;

  if not found then
    return query select 'not_found'::text, null::uuid, null::text, null::text;
  end if;
end;
$$;

revoke all on function public.lookup_admin_candidate(text) from public;
revoke all on function public.lookup_admin_candidate(text) from anon;
grant execute on function public.lookup_admin_candidate(text) to authenticated;

-- Current-admin identity list for the access screen. Keeping this behind the
-- same manager check avoids copying auth emails into profiles, whose existing
-- forum policy intentionally exposes names and avatars to approved members.
create or replace function public.list_admin_accounts()
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  can_manage_admins boolean,
  created_at timestamptz
)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.can_manage_admins() then
    raise exception 'Administrator accounts cannot be listed by this account.'
      using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.full_name,
    p.avatar_url,
    p.can_manage_admins,
    p.created_at
  from public.profiles as p
  join auth.users as u on u.id = p.id
  where p.role = 'admin'
    and u.email_confirmed_at is not null
    and u.deleted_at is null
  order by p.can_manage_admins desc, p.created_at asc;
end;
$$;

revoke all on function public.list_admin_accounts() from public;
revoke all on function public.list_admin_accounts() from anon;
grant execute on function public.list_admin_accounts() to authenticated;

-- Narrow RPC used by the application. It accepts the exact UUID-and-email pair
-- returned by the review step, then verifies that pair atomically before using
-- fixed privilege values. No role, status, or manager capability is caller-set.
-- Remove the earlier email-only draft if it was ever installed so there is no
-- weaker overload left available through PostgREST.
drop function if exists public.promote_admin_by_email(text);

create or replace function public.promote_admin_by_email(
  target_user_id uuid,
  target_email text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(btrim(coalesce(target_email, '')));
  matched_user_id uuid;
  target_role text;
begin
  if auth.uid() is null or not public.can_manage_admins() then
    raise exception 'Administrator access cannot be managed by this account.'
      using errcode = '42501';
  end if;

  if char_length(normalized_email) = 0
     or char_length(normalized_email) > 254
     or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return 'invalid';
  end if;

  select p.id, p.role
  into matched_user_id, target_role
  from auth.users as u
  join public.profiles as p on p.id = u.id
  where u.id = target_user_id
    and lower(u.email) = normalized_email
    and u.email_confirmed_at is not null
    and u.deleted_at is null
    and (u.banned_until is null or u.banned_until <= now())
  limit 1
  for update of p;

  if matched_user_id is null then
    return 'not_found';
  end if;

  if target_role = 'admin' then
    return 'already_admin';
  end if;

  -- Transaction-local marker consumed by the profile trigger. Direct REST
  -- updates cannot set this through any exposed application function, which
  -- makes this audited RPC the only browser-accessible role-grant path.
  perform pg_catalog.set_config('app.admin_access_grant', 'true', true);

  update public.profiles
  set role = 'admin',
      can_manage_admins = false,
      status = 'approved',
      approved_at = now(),
      approved_by = auth.uid()
  where id = matched_user_id;

  -- Close the trigger exception before doing any other work in this
  -- transaction. The marker is local to this transaction and is needed only
  -- for the single fixed-value UPDATE above.
  perform pg_catalog.set_config('app.admin_access_grant', 'false', true);

  insert into public.admin_access_audit (actor_id, target_user_id, action)
  values (auth.uid(), matched_user_id, 'granted');

  return 'promoted';
end;
$$;

revoke all on function public.promote_admin_by_email(uuid, text) from public;
revoke all on function public.promote_admin_by_email(uuid, text) from anon;
grant execute on function public.promote_admin_by_email(uuid, text) to authenticated;

commit;
