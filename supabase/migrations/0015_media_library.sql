-- =============================================================================
-- 0015 — central image and video library
-- =============================================================================
-- Every editorial image/video stored in the public `media` bucket (plus the
-- legacy `carousel` bucket) is indexed automatically. The index deliberately
-- excludes signatures, documents and audio as well as every member-owned
-- bucket such as `forum` and `avatar`.
--
-- The application derives public URLs with the Storage SDK instead of storing
-- them here. A bucket/path pair remains portable if the Supabase project URL
-- changes, and no stale URL survives an object rename.
-- =============================================================================

begin;

create table if not exists public.media_assets (
  object_id   uuid primary key,
  bucket_id   text not null,
  object_path text not null,
  mime_type   text not null,
  kind        text not null check (kind in ('image', 'video')),
  folder      text not null,
  byte_size   bigint check (byte_size is null or byte_size >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  indexed_at  timestamptz not null default now(),
  constraint media_assets_bucket_path_unique unique (bucket_id, object_path)
);

create index if not exists media_assets_kind_created_idx
  on public.media_assets (kind, created_at desc);

create index if not exists media_assets_folder_idx
  on public.media_assets (bucket_id, folder);

-- Storage normally supplies metadata.mimetype. The extension fallback keeps
-- older carousel objects indexable when their metadata predates that field.
create or replace function public.media_asset_mime_type(
  p_object_path text,
  p_metadata jsonb
)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(lower(p_metadata ->> 'mimetype'), ''),
    nullif(lower(p_metadata ->> 'content-type'), ''),
    nullif(lower(p_metadata ->> 'contentType'), ''),
    case lower(regexp_replace(p_object_path, '^.*\.', ''))
      when 'jpg'  then 'image/jpeg'
      when 'jpeg' then 'image/jpeg'
      when 'png'  then 'image/png'
      when 'webp' then 'image/webp'
      when 'avif' then 'image/avif'
      when 'gif'  then 'image/gif'
      when 'bmp'  then 'image/bmp'
      when 'tif'  then 'image/tiff'
      when 'tiff' then 'image/tiff'
      when 'heic' then 'image/heic'
      when 'mp4'  then 'video/mp4'
      when 'webm' then 'video/webm'
      when 'mov'  then 'video/quicktime'
      when 'm4v'  then 'video/x-m4v'
      when 'ogv'  then 'video/ogg'
      else null
    end
  );
$$;

-- A null result means "not part of the public editorial library". Keeping the
-- complete eligibility rule in one function guarantees the trigger and the
-- one-time/rerunnable backfill classify objects identically.
create or replace function public.media_asset_kind(
  p_bucket_id text,
  p_object_path text,
  p_metadata jsonb
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    -- Allow-listing these two buckets explicitly excludes forum/avatar and any
    -- future member-owned storage unless a later migration deliberately opts in.
    when p_bucket_id not in ('media', 'carousel') then null
    -- These `media/<folder>/*` objects are private/supporting material rather
    -- than gallery content, even if a file is accidentally given an image MIME.
    when p_bucket_id = 'media'
      and lower(split_part(p_object_path, '/', 1)) in (
        'signatures',
        'documents',
        'audio'
      ) then null
    when public.media_asset_mime_type(p_object_path, p_metadata) like 'image/%'
      then 'image'
    when public.media_asset_mime_type(p_object_path, p_metadata) like 'video/%'
      then 'video'
    else null
  end;
$$;

revoke all on function public.media_asset_mime_type(text, jsonb) from public;
revoke all on function public.media_asset_kind(text, text, jsonb) from public;

create or replace function public.sync_media_asset_from_storage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
  v_mime_type text;
  v_folder text;
  v_byte_size bigint;
begin
  if tg_op = 'DELETE' then
    delete from public.media_assets where object_id = old.id;
    return old;
  end if;

  -- A storage UPDATE can move an object out of scope or, unusually, replace
  -- its id. Removing the old identity first makes every replay idempotent.
  if tg_op = 'UPDATE' then
    delete from public.media_assets where object_id = old.id;
  end if;

  v_kind := public.media_asset_kind(new.bucket_id, new.name, new.metadata);
  if v_kind is null then
    delete from public.media_assets where object_id = new.id;
    return new;
  end if;

  v_mime_type := public.media_asset_mime_type(new.name, new.metadata);
  v_folder := case
    when position('/' in new.name) > 0 then split_part(new.name, '/', 1)
    else 'root'
  end;
  v_byte_size := case
    when coalesce(new.metadata ->> 'size', '') ~ '^[0-9]+$'
      then (new.metadata ->> 'size')::bigint
    else null
  end;

  insert into public.media_assets (
    object_id,
    bucket_id,
    object_path,
    mime_type,
    kind,
    folder,
    byte_size,
    created_at,
    updated_at,
    indexed_at
  ) values (
    new.id,
    new.bucket_id,
    new.name,
    v_mime_type,
    v_kind,
    v_folder,
    v_byte_size,
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, new.created_at, now()),
    now()
  )
  on conflict (object_id) do update set
    bucket_id = excluded.bucket_id,
    object_path = excluded.object_path,
    mime_type = excluded.mime_type,
    kind = excluded.kind,
    folder = excluded.folder,
    byte_size = excluded.byte_size,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at,
    indexed_at = now();

  return new;
end;
$$;

revoke all on function public.sync_media_asset_from_storage() from public;

drop trigger if exists storage_objects_sync_media_asset on storage.objects;
create trigger storage_objects_sync_media_asset
  after insert or update or delete on storage.objects
  for each row execute function public.sync_media_asset_from_storage();

-- Backfill existing editorial images/videos. This is also safe on a rerun:
-- changed metadata is refreshed, while the unique object id prevents copies.
insert into public.media_assets (
  object_id,
  bucket_id,
  object_path,
  mime_type,
  kind,
  folder,
  byte_size,
  created_at,
  updated_at,
  indexed_at
)
select
  object.id,
  object.bucket_id,
  object.name,
  classified.mime_type,
  classified.kind,
  case
    when position('/' in object.name) > 0 then split_part(object.name, '/', 1)
    else 'root'
  end,
  case
    when coalesce(object.metadata ->> 'size', '') ~ '^[0-9]+$'
      then (object.metadata ->> 'size')::bigint
    else null
  end,
  coalesce(object.created_at, now()),
  coalesce(object.updated_at, object.created_at, now()),
  now()
from storage.objects as object
cross join lateral (
  select
    public.media_asset_mime_type(object.name, object.metadata) as mime_type,
    public.media_asset_kind(object.bucket_id, object.name, object.metadata) as kind
) as classified
where classified.kind is not null
on conflict (object_id) do update set
  bucket_id = excluded.bucket_id,
  object_path = excluded.object_path,
  mime_type = excluded.mime_type,
  kind = excluded.kind,
  folder = excluded.folder,
  byte_size = excluded.byte_size,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  indexed_at = now();

-- If this migration is rerun after its eligibility rules change, remove any
-- stale index row whose storage object is gone or no longer qualifies.
delete from public.media_assets as asset
where not exists (
  select 1
  from storage.objects as object
  where object.id = asset.object_id
    and public.media_asset_kind(
      object.bucket_id,
      object.name,
      object.metadata
    ) is not null
);

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------

alter table public.media_assets enable row level security;

grant select on table public.media_assets to anon, authenticated;
grant insert, update, delete on table public.media_assets to authenticated;

drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read on public.media_assets
  for select to anon, authenticated
  using (true);

drop policy if exists media_assets_admin_manage on public.media_assets;
create policy media_assets_admin_manage on public.media_assets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;

-- =============================================================================
-- Verify (optional):
--
--   select bucket_id, folder, kind, count(*)
--   from public.media_assets
--   group by bucket_id, folder, kind
--   order by bucket_id, folder, kind;
-- =============================================================================
