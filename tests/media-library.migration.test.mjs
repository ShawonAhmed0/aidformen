import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/0015_media_library.sql", import.meta.url),
  "utf8",
);

test("media library stores portable storage metadata instead of stale public URLs", () => {
  assert.match(migration, /create table if not exists public\.media_assets/i);

  for (const column of [
    "object_id",
    "bucket_id",
    "object_path",
    "mime_type",
    "kind",
    "folder",
  ]) {
    assert.match(migration, new RegExp(`\\b${column}\\s+`, "i"), column);
  }

  assert.match(migration, /kind in \('image', 'video'\)/i);
  assert.match(migration, /unique \(bucket_id, object_path\)/i);
  assert.doesNotMatch(migration, /public_url\s+text/i);
});

test("storage insert, update and delete events synchronize the index idempotently", () => {
  assert.match(
    migration,
    /create trigger storage_objects_sync_media_asset[\s\S]*?after insert or update or delete on storage\.objects/i,
  );
  assert.match(migration, /if tg_op = 'DELETE'[\s\S]*?delete from public\.media_assets/i);
  assert.match(migration, /if tg_op = 'UPDATE'[\s\S]*?object_id = old\.id/i);
  assert.match(migration, /on conflict \(object_id\) do update set/i);
  assert.match(migration, /security definer[\s\S]*?set search_path = ''/i);
});

test("only editorial media and legacy carousel image/video objects qualify", () => {
  assert.match(migration, /p_bucket_id not in \('media', 'carousel'\) then null/i);
  assert.match(
    migration,
    /p_bucket_id = 'media'[\s\S]*?split_part\(p_object_path, '\/', 1\)[\s\S]*?'signatures'[\s\S]*?'documents'[\s\S]*?'audio'[\s\S]*?then null/i,
  );
  assert.match(migration, /like 'image\/%'[\s\S]*?then 'image'/i);
  assert.match(migration, /like 'video\/%'[\s\S]*?then 'video'/i);
  assert.doesNotMatch(
    migration,
    /p_bucket_id\s+in\s+\([^)]*'(?:forum|avatar)'/i,
  );
});

test("existing qualifying objects are backfilled and stale rows are removed", () => {
  assert.match(
    migration,
    /insert into public\.media_assets[\s\S]*?from storage\.objects as object[\s\S]*?where classified\.kind is not null/i,
  );
  assert.match(
    migration,
    /delete from public\.media_assets as asset[\s\S]*?not exists[\s\S]*?from storage\.objects as object/i,
  );
});

test("the media index is public-read and administrator-managed through RLS", () => {
  assert.match(migration, /alter table public\.media_assets enable row level security/i);
  assert.match(
    migration,
    /media_assets_public_read[\s\S]*?for select to anon, authenticated[\s\S]*?using \(true\)/i,
  );
  assert.match(
    migration,
    /media_assets_admin_manage[\s\S]*?for all to authenticated[\s\S]*?using \(public\.is_admin\(\)\)[\s\S]*?with check \(public\.is_admin\(\)\)/i,
  );
  assert.doesNotMatch(migration, /disable row level security/i);
});
