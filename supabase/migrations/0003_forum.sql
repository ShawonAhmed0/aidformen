-- =============================================================================
-- Aid For Men Foundation — community forum
-- =============================================================================
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is guarded.
--
-- What it does
--   1. Adds profiles.status, so an admin must approve a member before they can
--      use the forum. Accounts that already exist are grandfathered in as
--      approved, so nobody who can log in today loses access.
--   2. Creates forum_posts, forum_post_media, forum_comments, forum_reactions.
--   3. Locks everything behind is_approved_member(): only approved members may
--      read or write the forum. Admins may moderate anything.
--   4. Creates a `forum` storage bucket for member-uploaded images and video.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Membership approval
-- -----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists status text not null default 'pending',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users (id) on delete set null,
  -- The approval queue is ordered by signup time; guarantee the column exists
  -- rather than assume it, since profiles predates these migrations.
  add column if not exists created_at timestamptz not null default now();

-- Added separately from the column so re-running cannot fail on a duplicate.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- Grandfather every account that exists at the moment this migration runs.
-- Without this, adding a NOT NULL default of 'pending' would silently lock out
-- every current member — including admins.
update public.profiles
set status = 'approved',
    approved_at = coalesce(approved_at, now())
where status = 'pending';

-- Admins are always approved, whenever they were created.
update public.profiles
set status = 'approved'
where role = 'admin' and status <> 'approved';

create index if not exists profiles_status_idx on public.profiles (status);

-- SECURITY DEFINER for the same reason as is_admin(): a forum policy that
-- queries profiles would otherwise recurse through profiles' own RLS.
create or replace function public.is_approved_member()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (status = 'approved' or role = 'admin')
  );
$$;

revoke all on function public.is_approved_member() from public;
grant execute on function public.is_approved_member() to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Posts
-- -----------------------------------------------------------------------------

-- author_id references profiles rather than auth.users so PostgREST can embed
-- the author (name, avatar) in one query. profiles.id is itself the auth user
-- id, so this is the same key either way.
create table if not exists public.forum_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text,
  -- Soft delete: moderation should not silently destroy a thread that other
  -- members have already replied to.
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_posts_title_len check (char_length(title) between 1 and 300)
);

create index if not exists forum_posts_recent_idx
  on public.forum_posts (is_removed, created_at desc);

drop trigger if exists forum_posts_set_updated_at on public.forum_posts;
create trigger forum_posts_set_updated_at
  before update on public.forum_posts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Attachments
-- -----------------------------------------------------------------------------
-- `kind` distinguishes an uploaded file from a pasted link, because the two
-- render differently: uploads go in <img>/<video>, embeds in an iframe.

create table if not exists public.forum_post_media (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.forum_posts (id) on delete cascade,
  url        text not null,
  kind       text not null check (kind in ('image', 'video', 'embed')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists forum_post_media_post_idx
  on public.forum_post_media (post_id, sort_order);

-- -----------------------------------------------------------------------------
-- 4. Comments
-- -----------------------------------------------------------------------------
-- parent_id gives one level of replies. Deleting a parent cascades to its
-- replies, which is why removal by a moderator is a flag rather than a DELETE.

create table if not exists public.forum_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.forum_posts (id) on delete cascade,
  parent_id  uuid references public.forum_comments (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_comments_body_len check (char_length(body) between 1 and 5000)
);

create index if not exists forum_comments_post_idx
  on public.forum_comments (post_id, created_at);

drop trigger if exists forum_comments_set_updated_at on public.forum_comments;
create trigger forum_comments_set_updated_at
  before update on public.forum_comments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Reactions
-- -----------------------------------------------------------------------------
-- The primary key is (post_id, user_id), so a member holds at most one
-- reaction per post. Switching from haha to angry is an upsert, not a second
-- row, and un-reacting is a delete.

create table if not exists public.forum_reactions (
  post_id    uuid not null references public.forum_posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('like', 'love', 'haha', 'angry', 'shoe')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists forum_reactions_post_idx
  on public.forum_reactions (post_id, kind);

-- -----------------------------------------------------------------------------
-- 6. Row level security
-- -----------------------------------------------------------------------------
-- Approved members (and admins) may read the forum and write their own rows.
-- Everyone else — anonymous visitors and members still awaiting approval —
-- sees nothing at all.

alter table public.forum_posts      enable row level security;
alter table public.forum_post_media enable row level security;
alter table public.forum_comments   enable row level security;
alter table public.forum_reactions  enable row level security;

-- Posts
drop policy if exists forum_posts_read on public.forum_posts;
create policy forum_posts_read on public.forum_posts
  for select to authenticated
  using (public.is_approved_member());

drop policy if exists forum_posts_insert on public.forum_posts;
create policy forum_posts_insert on public.forum_posts
  for insert to authenticated
  with check (public.is_approved_member() and author_id = auth.uid());

drop policy if exists forum_posts_update_own on public.forum_posts;
create policy forum_posts_update_own on public.forum_posts
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists forum_posts_delete_own on public.forum_posts;
create policy forum_posts_delete_own on public.forum_posts
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- Attachments follow their post: you may attach to a post you own.
drop policy if exists forum_media_read on public.forum_post_media;
create policy forum_media_read on public.forum_post_media
  for select to authenticated
  using (public.is_approved_member());

drop policy if exists forum_media_write on public.forum_post_media;
create policy forum_media_write on public.forum_post_media
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.forum_posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.forum_posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );

-- Comments
drop policy if exists forum_comments_read on public.forum_comments;
create policy forum_comments_read on public.forum_comments
  for select to authenticated
  using (public.is_approved_member());

drop policy if exists forum_comments_insert on public.forum_comments;
create policy forum_comments_insert on public.forum_comments
  for insert to authenticated
  with check (public.is_approved_member() and author_id = auth.uid());

drop policy if exists forum_comments_update_own on public.forum_comments;
create policy forum_comments_update_own on public.forum_comments
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists forum_comments_delete_own on public.forum_comments;
create policy forum_comments_delete_own on public.forum_comments
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- Reactions — everyone approved sees the tally; you only control your own row.
drop policy if exists forum_reactions_read on public.forum_reactions;
create policy forum_reactions_read on public.forum_reactions
  for select to authenticated
  using (public.is_approved_member());

drop policy if exists forum_reactions_write on public.forum_reactions;
create policy forum_reactions_write on public.forum_reactions
  for all to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (
    (public.is_approved_member() and user_id = auth.uid())
    or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 7. Profile visibility
-- -----------------------------------------------------------------------------
-- The forum shows each author's name and avatar, so approved members need to
-- read other members' profiles. Added only if profiles has RLS enabled.

do $$
begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'profiles' and rowsecurity
  ) then
    drop policy if exists profiles_member_read on public.profiles;
    create policy profiles_member_read on public.profiles
      for select to authenticated
      using (id = auth.uid() or public.is_approved_member());

    drop policy if exists profiles_admin_manage on public.profiles;
    create policy profiles_admin_manage on public.profiles
      for update to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 8. Storage
-- -----------------------------------------------------------------------------
-- Separate bucket from `media`: that one is admin-only editorial imagery, this
-- one accepts uploads from any approved member and needs its own rules.

insert into storage.buckets (id, name, public)
values ('forum', 'forum', true)
on conflict (id) do update set public = true;

drop policy if exists forum_media_public_read on storage.objects;
create policy forum_media_public_read on storage.objects
  for select using (bucket_id = 'forum');

drop policy if exists forum_media_member_insert on storage.objects;
create policy forum_media_member_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'forum' and public.is_approved_member());

-- Members may clear up their own uploads; admins may remove anything.
drop policy if exists forum_media_owner_delete on storage.objects;
create policy forum_media_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'forum' and (owner = auth.uid() or public.is_admin()));

commit;

-- =============================================================================
-- Verify (optional):
--
--   -- Nobody should be left pending except genuinely new signups:
--   select status, count(*) from public.profiles group by status;
--
--   -- Should be true for all four:
--   select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' and tablename like 'forum%';
-- =============================================================================
