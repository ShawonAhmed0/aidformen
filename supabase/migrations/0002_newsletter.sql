-- =============================================================================
-- Aid For Men Foundation — newsletter subscribers
-- =============================================================================
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. Safe to re-run: every statement is guarded.
--
-- Why this exists separately from 0001: lib/actions/newsletter.ts already
-- inserts into `newsletter_subscribers`, but the table was never created, so
-- the homepage signup form fails on submit.
-- =============================================================================

begin;

-- Case-insensitive email so Foo@x.com and foo@x.com cannot both be stored.
-- The action lowercases before inserting; this makes the guarantee hold even
-- for rows added by hand in the dashboard.
create extension if not exists citext with schema extensions;

create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      extensions.citext not null unique,
  -- Where the signup came from, so a future form can be told apart without a
  -- schema change. Not collected today.
  source     text,
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_shape
    check (char_length(email) between 3 and 254 and email like '%_@_%.__%')
);

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------
-- Anyone may subscribe; nobody but an admin may read the list back. Without a
-- SELECT policy the table is unreadable to anon/authenticated, which is the
-- point — an email address is personal data and one visitor must not be able
-- to enumerate another's.

alter table public.newsletter_subscribers enable row level security;

drop policy if exists newsletter_public_insert on public.newsletter_subscribers;
create policy newsletter_public_insert on public.newsletter_subscribers
  for insert to anon, authenticated
  with check (true);

drop policy if exists newsletter_admin_read on public.newsletter_subscribers;
create policy newsletter_admin_read on public.newsletter_subscribers
  for select using (public.is_admin());

drop policy if exists newsletter_admin_delete on public.newsletter_subscribers;
create policy newsletter_admin_delete on public.newsletter_subscribers
  for delete using (public.is_admin());

-- No UPDATE policy: an address is either subscribed or removed. Editing one in
-- place would silently reassign somebody else's signup.

commit;

-- =============================================================================
-- Verify (optional):
--
--   select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' and tablename = 'newsletter_subscribers';
--
--   -- Should succeed:
--   insert into public.newsletter_subscribers (email) values ('test@example.com');
--   -- Should return 0 rows when run as anon, all rows when run as an admin.
--   select count(*) from public.newsletter_subscribers;
-- =============================================================================
