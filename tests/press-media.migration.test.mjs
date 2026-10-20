import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseMigration = await readFile(
  new URL("../supabase/migrations/0010_archive.sql", import.meta.url),
  "utf8",
);
const migration = await readFile(
  new URL("../supabase/migrations/0012_press_media_center.sql", import.meta.url),
  "utf8",
);

test("press and media extension stores editorial metadata without storing raw media blobs", () => {
  for (const column of [
    "slug",
    "section",
    "content_type",
    "event_status",
    "notice_body",
    "post_event_body",
    "press_release_body",
    "press_release_url",
    "hd_photos_url",
    "raw_video_url",
    "audio_url",
    "source_name",
    "source_url",
  ]) {
    assert.match(
      migration,
      new RegExp(`add column if not exists ${column}\\s+text`, "i"),
      `missing ${column}`,
    );
  }

  assert.doesNotMatch(migration, /\b(?:bytea|large object|lo_import)\b/i);
});

test("public slugs are stable, unique case-insensitively, and database constrained", () => {
  assert.match(migration, /alter column slug set not null/i);
  assert.match(
    migration,
    /create unique index if not exists archive_entries_slug_unique_idx\s+on public\.archive_entries \(lower\(slug\)\)/i,
  );
  assert.match(
    migration,
    /archive_entries_slug_format_check[\s\S]*?check \(slug ~ '\^\[a-z0-9\]\+\(-\[a-z0-9\]\+\)\*\$'\)/i,
  );
});

test("the two newsroom sections and supported editorial/media types are constrained", () => {
  assert.match(
    migration,
    /archive_entries_section_check[\s\S]*?section in \('press_media', 'news_archive'\)/i,
  );
  for (const contentType of [
    "event",
    "press_release",
    "media_coverage",
    "mens_rights_news",
    "case_study",
    "report",
  ]) {
    assert.match(migration, new RegExp(`'${contentType}'`, "i"));
  }
  assert.match(
    migration,
    /archive_entries_kind_check[\s\S]*?kind in \('article', 'photo', 'video', 'audio'\)/i,
  );
  assert.match(
    migration,
    /archive_entries_event_status_check[\s\S]*?event_status is null or event_status in \('upcoming', 'completed'\)/i,
  );
});

test("the extension retains published-only public reads and admin-only writes", () => {
  assert.match(
    baseMigration,
    /alter table public\.archive_entries enable row level security/i,
  );
  assert.match(
    baseMigration,
    /archive_entries_public_read[\s\S]*?for select using \(is_published or public\.is_admin\(\)\)/i,
  );
  assert.match(
    baseMigration,
    /archive_entries_admin_write[\s\S]*?for all using \(public\.is_admin\(\)\) with check \(public\.is_admin\(\)\)/i,
  );
  assert.doesNotMatch(migration, /disable row level security/i);
  assert.doesNotMatch(migration, /create policy[\s\S]*?for (?:insert|update|delete)[\s\S]*?\btrue\b/i);
});

test("the public newsroom query has an index for section and dated timeline browsing", () => {
  assert.match(
    migration,
    /create index if not exists archive_entries_section_date_idx[\s\S]*?\(section, event_date desc nulls last\)[\s\S]*?where is_published/i,
  );
});

test("legacy demo records are unpublished instead of presented as real reporting", () => {
  assert.match(migration, /set is_published = false/i);
  assert.match(migration, /cover_image_url like 'https:\/\/picsum\.photos\/%'/i);
  assert.match(
    migration,
    /archive_media[\s\S]*?media\.image_url like 'https:\/\/picsum\.photos\/%'/i,
  );
  assert.match(migration, /২০২৩ সালের বার্ষিক রিপোর্ট প্রকাশ/);
  assert.match(migration, /অক্টোবর ২০২৪ মাসিক নিউজলেটার/);
  assert.match(migration, /and body is null[\s\S]*?and event_date is null/i);
});
