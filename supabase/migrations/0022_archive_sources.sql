-- =============================================================================
-- Aid For Men Foundation — several original sources per post
-- =============================================================================
-- A media-coverage post can be carried by more than one outlet. `sources` is
-- an ordered list of { name, name_en, url }. The old single-source columns
-- (source_name, source_name_en, source_url) stay and are written from the
-- first source, so code deployed before this migration keeps working.
--
-- Safe to re-run.
-- =============================================================================

begin;

alter table public.archive_entries
  add column if not exists sources jsonb not null default '[]'::jsonb;

alter table public.archive_entries
  drop constraint if exists archive_entries_sources_list;

alter table public.archive_entries
  add constraint archive_entries_sources_list
  check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) <= 20);

-- Carry each post's existing single source into the list, once.
update public.archive_entries
set sources = jsonb_build_array(
  jsonb_strip_nulls(
    jsonb_build_object('name', source_name, 'name_en', source_name_en, 'url', source_url)
  )
)
where sources = '[]'::jsonb
  and (source_name is not null or source_url is not null);

commit;

notify pgrst, 'reload schema';
