-- =============================================================================
-- Aid For Men Foundation — Press & Media Center / News Archive
-- =============================================================================
-- Extends the existing archive rather than creating a second CMS. Every entry
-- gets a stable public slug, belongs to one of the two newsroom sections, and
-- can carry lightweight external media-kit links. Large raw files remain in
-- Drive/cloud storage; only the links are stored here.
-- =============================================================================

begin;

alter table public.archive_entries
  add column if not exists slug                    text,
  add column if not exists section                 text not null default 'press_media',
  add column if not exists content_type            text not null default 'event',
  add column if not exists event_status            text,
  add column if not exists notice_body             text,
  add column if not exists notice_body_en          text,
  add column if not exists post_event_body         text,
  add column if not exists post_event_body_en      text,
  add column if not exists press_release_body      text,
  add column if not exists press_release_body_en   text,
  add column if not exists press_release_url       text,
  add column if not exists hd_photos_url           text,
  add column if not exists raw_video_url           text,
  add column if not exists audio_url               text,
  add column if not exists source_name             text,
  add column if not exists source_name_en          text,
  add column if not exists source_url              text;

-- Stable, non-sensitive URLs for entries created before slugs existed.
update public.archive_entries
set slug = 'archive-' || left(id::text, 8)
where slug is null or btrim(slug) = '';

alter table public.archive_entries alter column slug set not null;

create unique index if not exists archive_entries_slug_unique_idx
  on public.archive_entries (lower(slug));

create index if not exists archive_entries_section_date_idx
  on public.archive_entries (section, event_date desc nulls last)
  where is_published;

alter table public.archive_entries
  drop constraint if exists archive_entries_kind_check,
  drop constraint if exists archive_entries_section_check,
  drop constraint if exists archive_entries_content_type_check,
  drop constraint if exists archive_entries_event_status_check,
  drop constraint if exists archive_entries_slug_format_check;

alter table public.archive_entries
  add constraint archive_entries_kind_check
    check (kind in ('article', 'photo', 'video', 'audio')),
  add constraint archive_entries_section_check
    check (section in ('press_media', 'news_archive')),
  add constraint archive_entries_content_type_check
    check (content_type in (
      'event',
      'press_release',
      'media_coverage',
      'mens_rights_news',
      'case_study',
      'report'
    )),
  add constraint archive_entries_event_status_check
    check (event_status is null or event_status in ('upcoming', 'completed')),
  add constraint archive_entries_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- New records are article-first. Editors can still choose a photo, video or
-- audio presentation when the primary item is media.
alter table public.archive_entries alter column kind set default 'article';
alter table public.archive_entries alter column is_published set default false;

-- Migration 0010 included clearly-marked Picsum/sample rows for UI preview.
-- They must never be presented as factual newsroom material after launch. This
-- targets only those unmistakable placeholders and leaves real editorial rows
-- untouched for an administrator to classify.
update public.archive_entries
set is_published = false
where cover_image_url like 'https://picsum.photos/%'
   or video_url = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'
   or exists (
     select 1
     from public.archive_media media
     where media.entry_id = archive_entries.id
       and media.image_url like 'https://picsum.photos/%'
   )
   or (
     heading in (
       '২০২৩ সালের বার্ষিক রিপোর্ট প্রকাশ',
       'নারায়ণগঞ্জ জেলা মতবিনিময় সভা',
       'জাতীয় প্রেস ক্লাবে সংবাদ সম্মেলন',
       'অক্টোবর ২০২৪ মাসিক নিউজলেটার'
     )
     and body is null
     and cover_image_url is null
     and event_date is null
   );

commit;

-- =============================================================================
-- Verify:
--   select slug, section, content_type, kind from public.archive_entries;
-- =============================================================================
