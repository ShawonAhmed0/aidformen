-- =============================================================================
-- Aid For Men Foundation — open the forum up for reading
-- =============================================================================
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is guarded or idempotent.
--
-- 0003 made the forum members-only: every SELECT policy demanded an approved
-- member, so a visitor — and a member still awaiting approval — saw nothing at
-- all. Anyone may now read the forum.
--
-- Writing is deliberately untouched. Posting, commenting and reacting still
-- require an approved member, enforced by the insert/update/delete policies
-- from 0003, which this migration leaves exactly as they are.
--
-- What it does
--   1. Lets the `anon` role run the two policy helper functions.
--   2. Adds a forum_authors view, so a byline can be shown without opening up
--      the phone numbers stored alongside it in profiles.
--   3. Rewrites the four SELECT policies to include anonymous visitors.
--   4. Keeps who-reacted private: anonymous visitors get the tally only.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Helper functions must be callable by anonymous visitors
-- -----------------------------------------------------------------------------
-- The policies below are now evaluated for the `anon` role as well, and
-- Postgres refuses to execute a function the current role has no rights on.
-- Granting is safe: with no session auth.uid() is null, so both return false.

grant execute on function public.is_admin() to anon;
grant execute on function public.is_approved_member() to anon;

-- -----------------------------------------------------------------------------
-- 2. Bylines without the rest of the profile
-- -----------------------------------------------------------------------------
-- profiles holds phone numbers and dates of birth, so it stays shut to
-- visitors and to members awaiting approval. This view exposes only the two
-- fields a byline renders.
--
-- security_invoker is off on purpose: the view runs as its owner and so reads
-- past the row level security on profiles. That is the whole point — it can
-- only ever reveal the columns it selects, and it gives every reader one code
-- path, whether they are a visitor, a pending member or an admin.

create or replace view public.forum_authors
with (security_invoker = false) as
  select id, full_name, avatar_url
  from public.profiles;

grant select on public.forum_authors to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Public read
-- -----------------------------------------------------------------------------

-- Posts. A removed post stays hidden from everyone except an admin; the feed
-- filters on the same flag, so this only closes the direct API route to it.
drop policy if exists forum_posts_read on public.forum_posts;
create policy forum_posts_read on public.forum_posts
  for select to anon, authenticated
  using (not is_removed or public.is_admin());

-- Attachments. The `forum` storage bucket has been public since 0003, so the
-- files themselves were already reachable; these rows say where they belong.
drop policy if exists forum_media_read on public.forum_post_media;
create policy forum_media_read on public.forum_post_media
  for select to anon, authenticated
  using (true);

-- Comments. Unlike a post, a removed comment is rendered as a tombstone in the
-- thread rather than dropped, so the row itself has to stay readable.
drop policy if exists forum_comments_read on public.forum_comments;
create policy forum_comments_read on public.forum_comments
  for select to anon, authenticated
  using (true);

-- Reactions.
drop policy if exists forum_reactions_read on public.forum_reactions;
create policy forum_reactions_read on public.forum_reactions
  for select to anon, authenticated
  using (true);

-- The tally is public; who reacted is not. Row level security cannot restrict
-- a column, so this does it with grants: an anonymous visitor may read only
-- the two fields the count is built from. A signed-in member still reads
-- user_id, which is how the picker knows which reaction is theirs.
revoke select on public.forum_reactions from anon;
grant select (post_id, kind) on public.forum_reactions to anon;

commit;

-- =============================================================================
-- Verify (optional):
--
--   -- As an anonymous visitor (SQL editor):
--   set role anon;
--   select count(*) from public.forum_posts;      -- the published posts
--   select count(*) from public.forum_authors;    -- one row per profile
--   select post_id, kind from public.forum_reactions;  -- allowed
--   select user_id from public.forum_reactions;   -- ERROR: permission denied
--   select phone from public.profiles;            -- no rows
--   reset role;
-- =============================================================================
