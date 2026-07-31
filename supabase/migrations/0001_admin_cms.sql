-- =============================================================================
-- Aid For Men Foundation — admin CMS schema
-- =============================================================================
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. It is written to be safe to re-run: every statement is guarded, so a
-- second execution is a no-op rather than an error.
--
-- What it does
--   1. Repairs hero_content, whose column names never matched the application
--      (the app reads `title`; the table had `heading`, so the saved heading
--      has never rendered on the site).
--   2. Gives carousel_images ordering, publishing and alt text.
--   3. Creates team_members, site_settings, activities and videos.
--   4. Adds an is_admin() helper and row level security on everything:
--      the public may read published rows, only admins may write.
--   5. Creates the `media` storage bucket with the same access rules.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Shared helpers
-- -----------------------------------------------------------------------------

-- Keeps updated_at honest without the application having to remember.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- SECURITY DEFINER so the lookup bypasses row level security on profiles.
-- Without this, an admin policy that itself queries profiles recurses.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- 1. hero_content — repair
-- -----------------------------------------------------------------------------

-- The application has always selected `title`. Rename rather than add, so the
-- heading already stored in the row is preserved instead of orphaned.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hero_content' and column_name = 'heading'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hero_content' and column_name = 'title'
  ) then
    alter table public.hero_content rename column heading to title;
  end if;
end $$;

alter table public.hero_content
  add column if not exists eyebrow                text,
  add column if not exists primary_cta_label      text,
  add column if not exists primary_cta_href       text,
  add column if not exists secondary_cta_label    text,
  add column if not exists secondary_cta_href     text,
  add column if not exists created_at             timestamptz not null default now(),
  add column if not exists updated_at             timestamptz not null default now(),
  -- English variants. Bengali is the source language; when an *_en value is
  -- null the application falls back to the Bengali one, so a partly translated
  -- site never renders a blank heading.
  add column if not exists title_en               text,
  add column if not exists description_en         text,
  add column if not exists eyebrow_en             text,
  add column if not exists primary_cta_label_en   text,
  add column if not exists secondary_cta_label_en text;

-- Sensible defaults for the buttons that used to be hardcoded in Hero.tsx.
update public.hero_content
set primary_cta_label   = coalesce(primary_cta_label,   'আমাদের সম্পর্কে জানুন'),
    primary_cta_href    = coalesce(primary_cta_href,    '/about'),
    secondary_cta_label = coalesce(secondary_cta_label, 'স্বেচ্ছাসেবী হিসেবে যোগ দিন'),
    secondary_cta_href  = coalesce(secondary_cta_href,  '/register');

drop trigger if exists hero_content_set_updated_at on public.hero_content;
create trigger hero_content_set_updated_at
  before update on public.hero_content
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. carousel_images — ordering, publishing, alt text
-- -----------------------------------------------------------------------------

alter table public.carousel_images
  add column if not exists alt_text     text,
  add column if not exists sort_order   integer not null default 0,
  add column if not exists is_published boolean not null default true,
  add column if not exists updated_at   timestamptz not null default now(),
  add column if not exists title_en     text,
  add column if not exists subtitle_en  text,
  add column if not exists alt_text_en  text;

-- Give the existing rows a deterministic order based on when they were added.
with ordered as (
  select id, (row_number() over (order by created_at)) * 10 as new_order
  from public.carousel_images
)
update public.carousel_images c
set sort_order = ordered.new_order
from ordered
where c.id = ordered.id
  and c.sort_order = 0;

create index if not exists carousel_images_order_idx
  on public.carousel_images (is_published, sort_order);

drop trigger if exists carousel_images_set_updated_at on public.carousel_images;
create trigger carousel_images_set_updated_at
  before update on public.carousel_images
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. team_members
-- -----------------------------------------------------------------------------

create table if not exists public.team_members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  role         text not null,
  quote        text,
  statement    text,
  bio          text,
  photo_url    text,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  name_en      text,
  role_en      text,
  quote_en     text,
  statement_en text,
  bio_en       text
);

-- Present for databases created before the bilingual columns were added.
alter table public.team_members
  add column if not exists name_en      text,
  add column if not exists role_en      text,
  add column if not exists quote_en     text,
  add column if not exists statement_en text,
  add column if not exists bio_en       text;

create index if not exists team_members_order_idx
  on public.team_members (is_published, sort_order);

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

-- Seed the six committee roles currently hardcoded in app/(site)/team, so the
-- page keeps its content the moment it starts reading from the database.
insert into public.team_members (name, role, quote, statement, bio, sort_order)
select * from (values
  ('নাম শীঘ্রই যোগ করা হবে', 'সভাপতি',
   'মানুষের মর্যাদা, ন্যায়বিচার ও সহমর্মিতার পক্ষে আমরা একসঙ্গে কাজ করি।',
   'ফাউন্ডেশনের প্রতিটি উদ্যোগে মানুষের কণ্ঠস্বরকে গুরুত্ব দেওয়া এবং প্রয়োজনের সময়ে নির্ভরযোগ্য সহায়তা পৌঁছে দেওয়াই আমাদের অঙ্গীকার।',
   'এই সদস্যের পূর্ণাঙ্গ পরিচিতি ও কর্মজীবনের তথ্য শীঘ্রই যুক্ত করা হবে।', 10),
  ('নাম শীঘ্রই যোগ করা হবে', 'সহ-সভাপতি',
   'একটি সহানুভূতিশীল সমাজ গড়তে সবার অংশগ্রহণ প্রয়োজন।',
   'আমরা এমন একটি পরিসর তৈরি করতে চাই যেখানে মানুষ নিরাপদে নিজের কথা বলতে পারে এবং প্রয়োজনীয় দিকনির্দেশনা পায়।',
   'এই সদস্যের পূর্ণাঙ্গ পরিচিতি ও কর্মজীবনের তথ্য শীঘ্রই যুক্ত করা হবে।', 20),
  ('নাম শীঘ্রই যোগ করা হবে', 'সাধারণ সম্পাদক',
   'সঠিক তথ্য ও দায়িত্বশীল উদ্যোগ পরিবর্তনের পথ তৈরি করে।',
   'আমাদের কাজের কেন্দ্রবিন্দু হলো সচেতনতা, সহযোগিতা এবং বাস্তবসম্মত সহায়তার মাধ্যমে মানুষের পাশে দাঁড়ানো।',
   'এই সদস্যের পূর্ণাঙ্গ পরিচিতি ও কর্মজীবনের তথ্য শীঘ্রই যুক্ত করা হবে।', 30),
  ('নাম শীঘ্রই যোগ করা হবে', 'যুগ্ম সাধারণ সম্পাদক',
   'শুনতে পারা এবং পাশে থাকা—এই দুই থেকেই আস্থা তৈরি হয়।',
   'প্রতিটি মানুষের অভিজ্ঞতা গুরুত্বপূর্ণ। আমরা সম্মানজনক সংলাপ এবং সহযোগিতার সংস্কৃতি প্রতিষ্ঠায় কাজ করি।',
   'এই সদস্যের পূর্ণাঙ্গ পরিচিতি ও কর্মজীবনের তথ্য শীঘ্রই যুক্ত করা হবে।', 40),
  ('নাম শীঘ্রই যোগ করা হবে', 'সাংগঠনিক সম্পাদক',
   'ঐক্যবদ্ধ উদ্যোগই সমাজে দীর্ঘস্থায়ী ইতিবাচক পরিবর্তন আনে।',
   'স্বেচ্ছাসেবক, সদস্য ও শুভাকাঙ্ক্ষীদের সম্পৃক্ত করে ফাউন্ডেশনের কার্যক্রম আরও মানুষের কাছে পৌঁছে দেওয়াই আমাদের লক্ষ্য।',
   'এই সদস্যের পূর্ণাঙ্গ পরিচিতি ও কর্মজীবনের তথ্য শীঘ্রই যুক্ত করা হবে।', 50),
  ('নাম শীঘ্রই যোগ করা হবে', 'প্রধান উপদেষ্টা',
   'ন্যায়, মানবিকতা ও দায়িত্ববোধ আমাদের পথচলার শক্তি।',
   'তথ্যভিত্তিক কাজ, সঠিক পরামর্শ এবং মানবিক দৃষ্টিভঙ্গির মাধ্যমে আমরা একটি সহায়ক কমিউনিটি গড়ে তুলতে চাই।',
   'এই সদস্যের পূর্ণাঙ্গ পরিচিতি ও কর্মজীবনের তথ্য শীঘ্রই যুক্ত করা হবে।', 60)
) as seed
where not exists (select 1 from public.team_members);

-- -----------------------------------------------------------------------------
-- 4. site_settings — singleton
-- -----------------------------------------------------------------------------

create table if not exists public.site_settings (
  id                       boolean primary key default true,
  organisation_name        text not null default 'এইড ফর মেন',
  tagline                  text,
  emergency_phone          text,
  contact_phone            text,
  contact_email            text,
  address                  text,
  office_hours             text,
  facebook_url             text,
  youtube_url              text,
  website_url              text,
  announcement_enabled     boolean not null default true,
  announcement_badge       text,
  announcement_title       text,
  announcement_body        text,
  announcement_cta_label   text,
  announcement_cta_href    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  organisation_name_en     text,
  tagline_en               text,
  address_en               text,
  office_hours_en          text,
  announcement_badge_en    text,
  announcement_title_en    text,
  announcement_body_en     text,
  announcement_cta_label_en text,
  -- Enforces exactly one row: the primary key can only ever hold true.
  constraint site_settings_singleton check (id)
);

alter table public.site_settings
  add column if not exists organisation_name_en      text,
  add column if not exists tagline_en                text,
  add column if not exists address_en                text,
  add column if not exists office_hours_en           text,
  add column if not exists announcement_badge_en     text,
  add column if not exists announcement_title_en     text,
  add column if not exists announcement_body_en      text,
  add column if not exists announcement_cta_label_en text;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (
  id, tagline, emergency_phone, contact_phone, contact_email, address, office_hours,
  announcement_badge, announcement_title, announcement_body,
  announcement_cta_label, announcement_cta_href
) values (
  true,
  'পুরুষ অধিকার ও বৈষম্যহীন সমাজ গঠনে একটি অরাজনৈতিক ও অলাভজনক প্রতিষ্ঠান।',
  '01404555999',
  '01404555999',
  'info@aidformen.com',
  '১৯৩, মতিঝিল, ঢাকা-১০০০',
  'শনিবার – বৃহস্পতিবার, সকাল ৯:০০ – সন্ধ্যা ৬:০০',
  'জরুরি আপডেট',
  'আন্তর্জাতিক পুরুষ দিবস ২০২৫-এর প্রস্তুতি সভা',
  'আগামী ১৯শে নভেম্বর উপলক্ষে আয়োজিত বিশেষ সেমিনারে অংশগ্রহণের জন্য নিবন্ধন চলছে। দ্রুত আসন নিশ্চিত করুন।',
  'নিবন্ধন করুন',
  '/register'
)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 5. activities — homepage cards and archive entries
-- -----------------------------------------------------------------------------
-- `placement` decides where an entry surfaces. A CHECK constraint rather than a
-- pg enum, so new placements can be added without an ALTER TYPE migration.

create table if not exists public.activities (
  id            uuid primary key default gen_random_uuid(),
  placement     text not null default 'archive'
                check (placement in ('feature', 'advisory', 'secondary', 'archive')),
  category      text,
  title         text not null,
  excerpt       text,
  image_url     text,
  event_date    date,
  location      text,
  href          text,
  action_label  text,
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  title_en        text,
  excerpt_en      text,
  category_en     text,
  location_en     text,
  action_label_en text
);

alter table public.activities
  add column if not exists title_en        text,
  add column if not exists excerpt_en      text,
  add column if not exists category_en     text,
  add column if not exists location_en     text,
  add column if not exists action_label_en text;

create index if not exists activities_placement_idx
  on public.activities (placement, is_published, sort_order);

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

insert into public.activities
  (placement, category, title, excerpt, image_url, event_date, location, href, action_label, sort_order)
select * from (values
  ('feature', 'আইনি সহায়তা',
   'মিথ্যা মামলা প্রতিরোধ ও পুরুষ অধিকার রক্ষায় মানববন্ধন',
   null, '/Rakib_Tamima_AFM.jpg', date '2026-06-08', 'প্রেস ক্লাব, ঢাকা', '/archive', null, 10),
  ('advisory', 'বিশেষ সচেতনতা',
   'যৌতুক ও নারী নির্যাতন মামলার অপব্যবহার প্রতিরোধে নতুন নির্দেশিকা',
   'সম্প্রতি সুপ্রিম কোর্টের নতুন নির্দেশনার আলোকে আমাদের আইনি প্যানেল একটি বিস্তারিত রিপোর্ট তৈরি করেছে।',
   null, null, null, '/archive', 'বিস্তারিত পড়ুন', 10),
  ('secondary', 'সচেতনতা',
   'নারী সংস্কার কমিশন বাতিলের দাবি এইড ফর মেন ফাউন্ডেশনের',
   null, '/women-commission-cance.webp', date '2025-05-02', null, '/archive', null, 10),
  ('secondary', 'মানববন্ধন',
   'ডিভোর্স জালিয়াতি বন্ধে এইড ফর মেন ফাউন্ডেশনের মানববন্ধন',
   null, '/nasir-tamima-2.jpg', date '2026-06-08', null, '/archive', null, 20),
  ('archive', 'প্রকাশনা',
   '২০২৩ সালের বার্ষিক রিপোর্ট প্রকাশ',
   null, null, null, null, '/archive', 'পিডিএফ ডাউনলোড', 10),
  ('archive', 'সচেতনতা মূলক সভা',
   'নারায়ণগঞ্জ জেলা মতবিনিময় সভা',
   null, null, null, null, '/archive', 'গ্যালারি দেখুন', 20),
  ('archive', 'মিডিয়া কভারেজ',
   'জাতীয় প্রেস ক্লাবে সংবাদ সম্মেলন',
   null, null, null, null, '/archive', 'ভিডিও দেখুন', 30),
  ('archive', 'প্রকাশনা',
   'অক্টোবর ২০২৪ মাসিক নিউজলেটার',
   null, null, null, null, '/archive', 'অনলাইনে পড়ুন', 40)
) as seed
where not exists (select 1 from public.activities);

-- -----------------------------------------------------------------------------
-- 6. videos
-- -----------------------------------------------------------------------------

create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  thumbnail_url text,
  video_url     text,
  duration      text,
  year          text,
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  title_en      text
);

alter table public.videos
  add column if not exists title_en text;

create index if not exists videos_order_idx
  on public.videos (is_published, sort_order);

drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

insert into public.videos (title, duration, year, sort_order)
select * from (values
  ('পুরুষ অধিকার: একটি বাস্তবধর্মী পর্যালোচনা', '১২:৪৫', '২০২৩', 10),
  ('যৌতুকের মিথ্যা মামলা ও পারিবারিক সংকট',   '০৮:২০', '২০২৪', 20),
  ('আন্তর্জাতিক পুরুষ দিবস ২০২২ — বিশেষ প্রতিবেদন', '২০:১৫', '২০২২', 30)
) as seed
where not exists (select 1 from public.videos);

-- -----------------------------------------------------------------------------
-- 7. Row level security
-- -----------------------------------------------------------------------------
-- Pattern for every content table:
--   anon + authenticated  ->  SELECT published rows only
--   admins                ->  full read/write
-- Policies are dropped first so re-running the file cannot fail on duplicates.

alter table public.hero_content    enable row level security;
alter table public.carousel_images enable row level security;
alter table public.team_members    enable row level security;
alter table public.site_settings   enable row level security;
alter table public.activities      enable row level security;
alter table public.videos          enable row level security;

-- hero_content and site_settings are singletons with nothing to hide.
drop policy if exists hero_content_public_read on public.hero_content;
create policy hero_content_public_read on public.hero_content
  for select using (true);

drop policy if exists hero_content_admin_write on public.hero_content;
create policy hero_content_admin_write on public.hero_content
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings
  for select using (true);

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Collections expose published rows publicly; admins see and edit everything.
drop policy if exists carousel_images_public_read on public.carousel_images;
create policy carousel_images_public_read on public.carousel_images
  for select using (is_published or public.is_admin());

drop policy if exists carousel_images_admin_write on public.carousel_images;
create policy carousel_images_admin_write on public.carousel_images
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists team_members_public_read on public.team_members;
create policy team_members_public_read on public.team_members
  for select using (is_published or public.is_admin());

drop policy if exists team_members_admin_write on public.team_members;
create policy team_members_admin_write on public.team_members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists activities_public_read on public.activities;
create policy activities_public_read on public.activities
  for select using (is_published or public.is_admin());

drop policy if exists activities_admin_write on public.activities;
create policy activities_admin_write on public.activities
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists videos_public_read on public.videos;
create policy videos_public_read on public.videos
  for select using (is_published or public.is_admin());

drop policy if exists videos_admin_write on public.videos;
create policy videos_admin_write on public.videos
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. Storage
-- -----------------------------------------------------------------------------
-- One public bucket for editorial images. Existing carousel URLs keep working
-- because they are stored as absolute URLs against the old bucket.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Make sure the pre-existing carousel bucket is readable too.
update storage.buckets set public = true where id = 'carousel';

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select using (bucket_id in ('media', 'carousel', 'avatar'));

drop policy if exists media_admin_insert on storage.objects;
create policy media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('media', 'carousel') and public.is_admin());

drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id in ('media', 'carousel') and public.is_admin())
  with check (bucket_id in ('media', 'carousel') and public.is_admin());

drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('media', 'carousel') and public.is_admin());

commit;

-- =============================================================================
-- Verify (optional): every table should report rowsecurity = true.
--
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--     and tablename in ('hero_content','carousel_images','team_members',
--                       'site_settings','activities','videos');
-- =============================================================================
