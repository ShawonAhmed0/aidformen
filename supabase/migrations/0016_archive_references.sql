-- =============================================================================
-- Aid For Men Foundation — archive reference attachments
-- =============================================================================
-- Adds ordered, bilingual reference/download links to an archive entry. Files
-- themselves stay in Supabase Storage (or an external HTTPS service); this
-- table stores only safe URLs and display metadata.
-- =============================================================================

begin;

-- A type belongs to exactly one of the two public newsroom sections. Keeping
-- this rule in PostgreSQL mirrors the admin selector and prevents an entry
-- from becoming invisible to every valid section/type filter through a direct
-- API write.
alter table public.archive_entries
  drop constraint if exists archive_entries_section_content_type_check;

alter table public.archive_entries
  add constraint archive_entries_section_content_type_check check (
    (section = 'press_media' and content_type in ('event', 'press_release'))
    or
    (section = 'news_archive' and content_type in (
      'media_coverage',
      'mens_rights_news',
      'case_study',
      'report'
    ))
  );

create table if not exists public.archive_attachments (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references public.archive_entries (id) on delete cascade,
  kind        text not null default 'document'
              check (kind in ('document', 'external_link')),
  label       text,
  label_en    text,
  file_url    text not null,
  mime_type   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  constraint archive_attachments_https_url
    check (file_url ~ '^https://')
);

create index if not exists archive_attachments_entry_idx
  on public.archive_attachments (entry_id, sort_order);

alter table public.archive_attachments enable row level security;

drop policy if exists archive_attachments_public_read
  on public.archive_attachments;
create policy archive_attachments_public_read
  on public.archive_attachments
  for select using (
    exists (
      select 1
      from public.archive_entries entry
      where entry.id = archive_attachments.entry_id
        and (entry.is_published or public.is_admin())
    )
  );

drop policy if exists archive_attachments_admin_write
  on public.archive_attachments;
create policy archive_attachments_admin_write
  on public.archive_attachments
  for all using (public.is_admin()) with check (public.is_admin());

commit;

-- =============================================================================
-- Verify:
--   select entry_id, kind, label, file_url
--   from public.archive_attachments order by entry_id, sort_order;
-- =============================================================================
