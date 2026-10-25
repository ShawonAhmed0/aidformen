-- =============================================================================
-- Aid For Men Foundation — homepage About audio
-- =============================================================================
-- Adds the optional recording used by the homepage's About section. The hero
-- row is already publicly readable and admin-writable under migration 0001, so
-- the new column inherits the same RLS boundary.
-- Safe to re-run.
-- =============================================================================

begin;

alter table public.hero_content
  add column if not exists about_audio_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hero_content_about_audio_url_https'
  ) then
    alter table public.hero_content
      add constraint hero_content_about_audio_url_https
      check (about_audio_url is null or about_audio_url ~ '^https://');
  end if;
end $$;

commit;
