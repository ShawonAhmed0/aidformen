-- =============================================================================
-- Aid For Men Foundation — retire the forum; Media Center / Research split
-- =============================================================================
-- The forum and member sign-up are removed from the site. This permanently
-- deletes every forum post, comment, reaction and attachment record. There is
-- no undo: export the forum_* tables first if any of it should be kept.
--
-- It also realigns archive_entries.section with the new public structure,
-- where the content type alone decides the section:
--   press_media  = Media Center            (event, mens_rights_news,
--                                            press_release, media_coverage)
--   news_archive = Research & Case Studies (case_study, report)
-- The site already reads entries this way, so this only tidies stored rows.
--
-- Safe to re-run. Not handled here:
--   * The `forum` storage bucket and its files. Supabase refuses SQL deletes
--     on storage.objects; empty and delete the bucket under Storage instead.
--   * Former members' logins stay in auth.users / profiles. Remove them under
--     Authentication if they should no longer be able to sign in.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Archive sections follow content type
-- -----------------------------------------------------------------------------

update public.archive_entries
set section = 'press_media'
where content_type in ('event', 'mens_rights_news', 'press_release', 'media_coverage')
  and section <> 'press_media';

update public.archive_entries
set section = 'news_archive'
where content_type in ('case_study', 'report')
  and section <> 'news_archive';

-- -----------------------------------------------------------------------------
-- 2. Profiles: replace the forum's read policy before dropping it
-- -----------------------------------------------------------------------------
-- 0003's profiles_member_read was what let a signed-in user read their own
-- row (the proxy and requireAdmin both do). Keep that, plus admin read for the
-- dashboard, without the "any approved member reads everyone" part.

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_member_read on public.profiles;

-- -----------------------------------------------------------------------------
-- 3. Forum tables and the public author view
-- -----------------------------------------------------------------------------
-- Children first. No CASCADE on purpose: if anything unexpected still depends
-- on these, the transaction stops and rolls back instead of silently taking it
-- with them.

drop view if exists public.forum_authors;

drop table if exists public.forum_reactions;
drop table if exists public.forum_comments;
drop table if exists public.forum_post_media;
drop table if exists public.forum_posts;

-- -----------------------------------------------------------------------------
-- 4. Storage policies for the forum bucket
-- -----------------------------------------------------------------------------

drop policy if exists forum_media_public_read on storage.objects;
drop policy if exists forum_media_member_insert on storage.objects;
drop policy if exists forum_media_owner_delete on storage.objects;

-- -----------------------------------------------------------------------------
-- 5. Membership helper
-- -----------------------------------------------------------------------------
-- Only forum and storage policies called this, and they are gone above.

drop function if exists public.is_approved_member();

commit;
