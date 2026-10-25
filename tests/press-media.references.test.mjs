import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manager = await readFile(
  new URL("../components/admin/ArchiveManager.tsx", import.meta.url),
  "utf8",
);
const galleryEditor = await readFile(
  new URL("../components/admin/ArchiveGalleryEditor.tsx", import.meta.url),
  "utf8",
);
const listingRoute = await readFile(
  new URL("../app/(public)/[lang]/news/page.tsx", import.meta.url),
  "utf8",
);
const explorer = await readFile(
  new URL("../components/archive/ArchiveExplorer.tsx", import.meta.url),
  "utf8",
);
const detailRoute = await readFile(
  new URL("../app/(public)/[lang]/news/[slug]/page.tsx", import.meta.url),
  "utf8",
);
const dictionary = await readFile(
  new URL("../lib/i18n/dictionary.ts", import.meta.url),
  "utf8",
);
const action = await readFile(
  new URL("../lib/actions/archive.ts", import.meta.url),
  "utf8",
);
const migration = await readFile(
  new URL("../supabase/migrations/0016_archive_references.sql", import.meta.url),
  "utf8",
);

test("archive admin submits ordered supporting images and reference attachments", () => {
  assert.match(manager, /attachments:\s*AttachmentDraft\[\]/);
  assert.match(manager, /entry\.attachments\.map/);
  assert.match(manager, /body\.append\(["']attachment_kind["']/);
  assert.match(manager, /body\.append\(["']attachment_url["']/);
  assert.match(manager, /<ArchiveAttachmentsEditor\b/);
  assert.match(manager, /MAX_ARCHIVE_ATTACHMENTS/);
});

test("photo archives keep the full gallery while other content caps evidence at five", () => {
  assert.match(
    manager,
    /draft\.kind === ["']photo["'][\s\S]*?MAX_ARCHIVE_PHOTOS[\s\S]*?MAX_ARCHIVE_REFERENCE_PHOTOS/,
  );
  assert.match(manager, /mode=\{draft\.kind === ["']photo["']/);
  assert.match(galleryEditor, /mode\?:\s*["']gallery["']\s*\|\s*["']references["']/);
  assert.match(galleryEditor, /বাকিগুলো শুধু বিস্তারিত পাতায় থাকবে/);
});

test("content-type query filters are validated against their selected section", () => {
  assert.match(listingRoute, /archiveContentTypes\.includes/);
  assert.match(
    listingRoute,
    /contentTypesBySection\[initialSection\]\.includes/,
  );
  assert.match(listingRoute, /initialContentType=\{initialContentType\}/);
  assert.match(explorer, /item\.contentType !== initialContentType/);
  assert.match(
    explorer,
    /news\?section=\$\{section\}&type=\$\{contentType\}/,
  );
  assert.match(
    explorer,
    /href=\{`\/\$\{locale\}\/news\?section=\$\{option\.value\}`\}/,
    "changing the main section must intentionally discard the previous type",
  );
  assert.match(action, /sectionMatchesType/);
  assert.match(action, /নির্বাচিত সেকশনের সঙ্গে কনটেন্ট টাইপটি মেলে না/);
  assert.match(migration, /archive_entries_section_content_type_check/);
  assert.match(
    migration,
    /section = 'press_media'[\s\S]*?content_type in \('event', 'press_release'\)/,
  );
});

test("listings receive only compact data while detail pages expose evidence", () => {
  assert.doesNotMatch(explorer, /item\.attachments|item\.photos\.map/);
  assert.match(detailRoute, /item\.photos\.map/);
  assert.match(detailRoute, /item\.attachments\.map/);
  assert.match(detailRoute, /attachment\.kind === ["']document["']/);
  assert.match(detailRoute, /download=\{attachment\.kind === ["']document["']\}/);
  assert.match(detailRoute, /t\.archive\.referencesTitle/);
});

test("new filters and reference sections have Bengali and English labels", () => {
  assert.equal((dictionary.match(/filterContentType:/g) ?? []).length, 2);
  assert.equal((dictionary.match(/allContentTypes:/g) ?? []).length, 2);
  assert.equal((dictionary.match(/supportingImages:/g) ?? []).length, 2);
  assert.equal((dictionary.match(/referencesTitle:/g) ?? []).length, 2);
  assert.equal((dictionary.match(/referencesBody:/g) ?? []).length, 2);
  assert.equal((dictionary.match(/openReference:/g) ?? []).length, 2);
});
