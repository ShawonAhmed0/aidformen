-- =============================================================================
-- Aid For Men Foundation — image focal points
-- =============================================================================
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- Photos are cropped to fit their container: team cards to a 4:3 box, hero
-- slides to the full section. Which part survives the crop was fixed in CSS,
-- so a face near an edge got cut off and the only remedy was re-shooting the
-- photo.
--
-- These columns store the point that must stay visible, as percentages, and the
-- site renders them as object-position. Nothing is done to the uploaded file,
-- so the framing can be changed as often as you like and applies retroactively
-- to photos already uploaded.
-- =============================================================================

begin;

alter table public.team_members
  add column if not exists focal_x smallint not null default 50,
  add column if not exists focal_y smallint not null default 50;

alter table public.carousel_images
  add column if not exists focal_x smallint not null default 50,
  add column if not exists focal_y smallint not null default 50;

-- Added separately so a re-run cannot fail on a duplicate constraint.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'team_members_focal_range') then
    alter table public.team_members add constraint team_members_focal_range
      check (focal_x between 0 and 100 and focal_y between 0 and 100);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'carousel_images_focal_range') then
    alter table public.carousel_images add constraint carousel_images_focal_range
      check (focal_x between 0 and 100 and focal_y between 0 and 100);
  end if;
end $$;

-- Team photos are portraits cropped to a landscape card, so the useful part is
-- almost always the upper half. Start existing rows there rather than at the
-- centre, matching the object-top the cards used before this change.
update public.team_members set focal_y = 25 where focal_y = 50;

commit;

-- =============================================================================
-- Verify (optional):
--   select name, focal_x, focal_y from public.team_members order by sort_order;
-- =============================================================================
