-- =============================================================================
-- Aid For Men Foundation — section/content-type check follows the Media Center
-- =============================================================================
-- 0016's check still paired media_coverage and mens_rights_news with
-- news_archive, but the app (sectionForContentType) files them under
-- press_media. Every new Media Coverage post therefore failed with
-- archive_entries_section_content_type_check. It also made 0017's realignment
-- of stored rows impossible, so this redoes that step before re-adding the
-- check.
--
-- Safe to re-run.
-- =============================================================================

begin;

alter table public.archive_entries
  drop constraint if exists archive_entries_section_content_type_check;

update public.archive_entries
set section = 'press_media'
where content_type in ('event', 'mens_rights_news', 'press_release', 'media_coverage')
  and section <> 'press_media';

update public.archive_entries
set section = 'news_archive'
where content_type in ('case_study', 'report')
  and section <> 'news_archive';

alter table public.archive_entries
  add constraint archive_entries_section_content_type_check check (
    (section = 'press_media' and content_type in (
      'event', 'mens_rights_news', 'press_release', 'media_coverage'
    ))
    or
    (section = 'news_archive' and content_type in ('case_study', 'report'))
  );

commit;
