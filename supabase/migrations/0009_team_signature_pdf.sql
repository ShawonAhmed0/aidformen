-- =============================================================================
-- 0009 — signature image and downloadable profile PDF for team members
--
-- Both are optional and hold absolute public URLs into the `media` bucket, the
-- same convention photo_url already uses. Storage needs no change: the bucket
-- has no MIME allow-list, so a PDF lands under media/documents/… and inherits
-- the existing public-read / admin-write policies.
--
-- Safe to re-run.
-- =============================================================================

begin;

alter table public.team_members
  add column if not exists signature_url   text,
  add column if not exists profile_pdf_url text;

comment on column public.team_members.signature_url is
  'Signature image shown in the member profile dialog. Transparent PNG works best.';
comment on column public.team_members.profile_pdf_url is
  'Downloadable profile PDF offered from the member profile dialog.';

commit;
