-- =============================================================================
-- Aid For Men Foundation — retire the homepage "Activities" section
-- =============================================================================
-- The "Our recent work" section (feature card, advisory card, secondary list)
-- and its /admin/activities editor are removed from the site. The homepage now
-- shows the press & archive preview in its place, fed by archive_entries.
--
-- This PERMANENTLY deletes every row in public.activities. There is no undo:
-- export the table first if any of it should be kept (or moved into the
-- archive under /admin/archive).
--
-- Dropping the table also drops its index, its updated_at trigger and its
-- public-read / admin-write policies. Images uploaded for activities stay in
-- the `media` storage bucket (folder `activities/`) and keep appearing in the
-- image and video archive; delete them under Storage if they should go too.
--
-- Safe to re-run.
-- =============================================================================

drop table if exists public.activities;
