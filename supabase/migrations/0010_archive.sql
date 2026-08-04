-- =============================================================================
-- Aid For Men Foundation — archive
-- =============================================================================
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is guarded and every seed is conditional.
--
-- What it does
--   1. Creates archive_entries — one row per archive item, either a photo
--      archive (a gallery) or a video archive. Both carry a heading and a
--      paragraph, bilingual, plus a category and date the public filters use.
--   2. Creates archive_media — the photos belonging to a photo archive.
--   3. Row level security: the public reads published entries, admins write.
--   4. Moves the existing `activities` rows with placement='archive' into the
--      new table and retires that placement, so there is exactly one archive.
--   5. Seeds three demo entries (two photo galleries, one video).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. archive_entries
-- -----------------------------------------------------------------------------
-- `kind` is a CHECK rather than a pg enum, matching activities.placement — a
-- third kind can then be added without an ALTER TYPE migration.
--
-- A video entry may carry either an external link (video_url, embedded only if
-- it is YouTube or Facebook) or an uploaded file (video_file_url). Neither is
-- required at the database level: an admin saves a draft before the footage is
-- ready, and a NOT NULL here would block that.

create table if not exists public.archive_entries (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'photo'
                 check (kind in ('photo', 'video')),
  heading        text not null,
  heading_en     text,
  body           text,
  body_en        text,
  category       text,
  category_en    text,
  location       text,
  location_en    text,
  event_date     date,
  cover_image_url text,
  -- Video only. video_url is an external watch page; video_file_url points at
  -- our own storage bucket.
  video_url      text,
  video_file_url text,
  sort_order     integer not null default 0,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists archive_entries_order_idx
  on public.archive_entries (is_published, sort_order);

-- The year filter reads event_date, and the newest-first preview orders by it.
create index if not exists archive_entries_date_idx
  on public.archive_entries (event_date desc nulls last);

drop trigger if exists archive_entries_set_updated_at on public.archive_entries;
create trigger archive_entries_set_updated_at
  before update on public.archive_entries
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. archive_media — the gallery of a photo archive
-- -----------------------------------------------------------------------------
-- ON DELETE CASCADE so removing an entry cannot leave orphaned rows behind.
-- The storage objects are cleaned up by the delete action, which reads the
-- URLs before the row disappears.

create table if not exists public.archive_media (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references public.archive_entries (id) on delete cascade,
  image_url  text not null,
  caption    text,
  caption_en text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists archive_media_entry_idx
  on public.archive_media (entry_id, sort_order);

-- -----------------------------------------------------------------------------
-- 3. Row level security
-- -----------------------------------------------------------------------------

alter table public.archive_entries enable row level security;
alter table public.archive_media   enable row level security;

drop policy if exists archive_entries_public_read on public.archive_entries;
create policy archive_entries_public_read on public.archive_entries
  for select using (is_published or public.is_admin());

drop policy if exists archive_entries_admin_write on public.archive_entries;
create policy archive_entries_admin_write on public.archive_entries
  for all using (public.is_admin()) with check (public.is_admin());

-- A photo is only as public as the entry it belongs to, so the visibility test
-- follows the parent rather than being restated here.
drop policy if exists archive_media_public_read on public.archive_media;
create policy archive_media_public_read on public.archive_media
  for select using (
    exists (
      select 1 from public.archive_entries e
      where e.id = archive_media.entry_id
        and (e.is_published or public.is_admin())
    )
  );

drop policy if exists archive_media_admin_write on public.archive_media;
create policy archive_media_admin_write on public.archive_media
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Seed — three demo entries
-- -----------------------------------------------------------------------------
-- Only ever runs into an empty table, so a re-run never duplicates them and
-- never overwrites real content. Cover and gallery images are placeholders from
-- picsum.photos (already allowed in next.config.ts) — replace them from the
-- admin panel as the real photographs arrive.

insert into public.archive_entries (
  kind, heading, heading_en, body, body_en,
  category, category_en, location, location_en,
  event_date, cover_image_url, video_url, sort_order
)
select * from (values
  ('photo',
   'আন্তর্জাতিক পুরুষ দিবস ২০২৪ — আলোকচিত্র সংকলন',
   'International Men''s Day 2024 — photo collection',
   'জাতীয় প্রেস ক্লাবে আয়োজিত দিনব্যাপী আলোচনা সভা, র‍্যালি ও আইনি সহায়তা বুথের আলোকচিত্র। আইনজীবী, শিক্ষক, সাংবাদিক ও স্বেচ্ছাসেবক মিলিয়ে প্রায় দুইশত অতিথি সারাদিনের আয়োজনে অংশ নেন। সন্ধ্যার অধিবেশনে পরিবার আদালতের মামলা ব্যবস্থাপনা নিয়ে একটি খসড়া সুপারিশমালা উপস্থাপন করা হয়।',
   'Photographs from the day-long discussion, rally and legal aid desk at the National Press Club. Close to two hundred guests — lawyers, teachers, journalists and volunteers — took part across the day, and the evening session presented a draft set of recommendations on family court case management.',
   'আয়োজন', 'Events', 'জাতীয় প্রেস ক্লাব, ঢাকা', 'National Press Club, Dhaka',
   date '2024-11-19',
   'https://picsum.photos/seed/afm-archive-mensday/1600/1067', null, 10),

  ('photo',
   'নারায়ণগঞ্জ জেলা মতবিনিময় সভা',
   'Narayanganj district consultation',
   'জেলা পর্যায়ে আমাদের প্রথম মতবিনিময় সভা, যেখানে স্থানীয় আইনজীবী ও ভুক্তভোগী পরিবারের সদস্যরা সরাসরি নিজেদের অভিজ্ঞতা তুলে ধরেন। সভা থেকে দুটি সিদ্ধান্ত আসে — জেলায় একটি স্থায়ী আইনি সহায়তা ডেস্ক এবং মাসে একবার বিনামূল্যে পরামর্শ সভা।',
   'Our first district-level consultation, where local lawyers and affected families spoke about their own experience. Two decisions came out of it: a permanent legal aid desk in the district, and a free monthly advice session.',
   'সচেতনতা', 'Awareness', 'নারায়ণগঞ্জ', 'Narayanganj',
   date '2025-03-08',
   'https://picsum.photos/seed/afm-archive-narayanganj/1600/1067', null, 20),

  ('video',
   'মিথ্যা মামলার শিকার পরিবারগুলোর কথা — প্রামাণ্যচিত্র',
   'Families facing false cases — a documentary',
   'তিনটি পরিবারের এক বছরের পথচলা নিয়ে তৈরি আমাদের প্রথম প্রামাণ্যচিত্র। মামলার নথি, আদালতের বাইরের অপেক্ষা এবং সন্তানদের সঙ্গে সম্পর্ক নষ্ট হয়ে যাওয়ার অভিজ্ঞতা তাঁরা নিজের কথায় বলেছেন। ফাউন্ডেশনের আইনি প্যানেল প্রতিটি ঘটনার নথি যাচাই করেছে।',
   'Our first documentary, following three families over a year. In their own words they describe the case files, the waiting outside courtrooms, and the contact with their children that fell away. Every account was checked against the paperwork by the foundation''s legal panel.',
   'প্রামাণ্যচিত্র', 'Documentary', null, null,
   date '2025-07-12',
   'https://picsum.photos/seed/afm-archive-doc/1600/1067',
   'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 30)
) as seed
where not exists (select 1 from public.archive_entries);

-- Gallery photos for the two seeded photo entries. Matched by heading rather
-- than a hardcoded id, since the ids are generated above.
insert into public.archive_media (entry_id, image_url, caption, caption_en, sort_order)
select e.id, m.image_url, m.caption, m.caption_en, m.sort_order
from public.archive_entries e
join (values
  ('আন্তর্জাতিক পুরুষ দিবস ২০২৪ — আলোকচিত্র সংকলন',
   'https://picsum.photos/seed/afm-mensday-1/1600/1067',
   'সকালের উদ্বোধনী অধিবেশন', 'The opening session', 10),
  ('আন্তর্জাতিক পুরুষ দিবস ২০২৪ — আলোকচিত্র সংকলন',
   'https://picsum.photos/seed/afm-mensday-2/1600/1067',
   'প্রেস ক্লাবের সামনে র‍্যালি', 'The rally outside the Press Club', 20),
  ('আন্তর্জাতিক পুরুষ দিবস ২০২৪ — আলোকচিত্র সংকলন',
   'https://picsum.photos/seed/afm-mensday-3/1600/1067',
   'বিনামূল্যে আইনি পরামর্শ বুথ', 'The free legal advice desk', 30),
  ('আন্তর্জাতিক পুরুষ দিবস ২০২৪ — আলোকচিত্র সংকলন',
   'https://picsum.photos/seed/afm-mensday-4/1600/1067',
   'সন্ধ্যার সুপারিশমালা উপস্থাপন', 'Presenting the recommendations', 40),
  ('নারায়ণগঞ্জ জেলা মতবিনিময় সভা',
   'https://picsum.photos/seed/afm-narayanganj-1/1600/1067',
   'স্থানীয় আইনজীবীদের সঙ্গে আলোচনা', 'In discussion with local lawyers', 10),
  ('নারায়ণগঞ্জ জেলা মতবিনিময় সভা',
   'https://picsum.photos/seed/afm-narayanganj-2/1600/1067',
   'ভুক্তভোগী পরিবারের বক্তব্য', 'A family shares their experience', 20),
  ('নারায়ণগঞ্জ জেলা মতবিনিময় সভা',
   'https://picsum.photos/seed/afm-narayanganj-3/1600/1067',
   'সভা শেষে অংশগ্রহণকারীরা', 'Participants after the session', 30)
) as m (heading, image_url, caption, caption_en, sort_order)
  on m.heading = e.heading
where not exists (select 1 from public.archive_media);

-- -----------------------------------------------------------------------------
-- 5. Retire the 'archive' activity placement
-- -----------------------------------------------------------------------------
-- Two things were called "the archive": these rows and the archive page. The
-- rows move across as photo entries — image_url becomes the cover, excerpt
-- becomes the paragraph — and the placement is dropped so an editor cannot file
-- new content in the retired half.
--
-- Re-runnable because the source rows are deleted in the same transaction: a
-- second run finds nothing to move.

insert into public.archive_entries (
  kind, heading, heading_en, body, body_en,
  category, category_en, location, location_en,
  event_date, cover_image_url, sort_order, is_published
)
select
  'photo', a.title, a.title_en, a.excerpt, a.excerpt_en,
  a.category, a.category_en, a.location, a.location_en,
  a.event_date, a.image_url,
  -- Land after anything already in the table so the demo entries stay on top.
  1000 + a.sort_order, a.is_published
from public.activities a
where a.placement = 'archive';

delete from public.activities where placement = 'archive';

alter table public.activities drop constraint if exists activities_placement_check;
alter table public.activities
  add constraint activities_placement_check
  check (placement in ('feature', 'advisory', 'secondary'));

-- The old default was 'archive', which no longer passes the CHECK.
alter table public.activities alter column placement set default 'secondary';

commit;

-- =============================================================================
-- Verify (optional):
--
--   select kind, count(*) from public.archive_entries group by kind;
--   select e.heading, count(m.id) as photos
--   from public.archive_entries e
--   left join public.archive_media m on m.entry_id = e.id
--   group by e.heading order by e.heading;
--
--   -- should return no rows
--   select * from public.activities where placement = 'archive';
-- =============================================================================
