import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import ts from "typescript";

const archiveTypesSource = await readFile(
  new URL("../lib/types/archive.ts", import.meta.url),
  "utf8",
);
const sharedActionsSource = await readFile(
  new URL("../lib/actions/shared.ts", import.meta.url),
  "utf8",
);
const archiveActionsSource = await readFile(
  new URL("../lib/actions/archive.ts", import.meta.url),
  "utf8",
);
const archiveManagerSource = await readFile(
  new URL("../components/admin/ArchiveManager.tsx", import.meta.url),
  "utf8",
);

/**
 * Execute a TypeScript module in a deliberately tiny CommonJS sandbox.
 *
 * These modules import application services that their pure validators do not
 * use. Stubbing those imports lets this test exercise the production helpers
 * without starting Next.js or connecting to Supabase.
 */
function loadTypeScriptModule(source, stubs = {}) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const cjsModule = { exports: {} };
  const sandbox = {
    URL,
    FormData,
    console,
    module: cjsModule,
    exports: cjsModule.exports,
    require(specifier) {
      if (Object.hasOwn(stubs, specifier)) return stubs[specifier];
      throw new Error(`Unexpected import while loading validator: ${specifier}`);
    },
  };

  vm.runInNewContext(outputText, sandbox, {
    filename: "validator-under-test.cjs",
  });
  return cjsModule.exports;
}

const archiveTypes = loadTypeScriptModule(archiveTypesSource, {
  "@/lib/embed": { toEmbedUrl: () => null },
  "@/lib/i18n/config": {
    formatDate: () => null,
    pick: () => "",
  },
});

const sharedActions = loadTypeScriptModule(sharedActionsSource, {
  "@/lib/supabase/server": { createClient: async () => ({}) },
});

test("archive slugs accept stable URL segments", () => {
  for (const value of [
    "press-release-2026",
    "international-mens-day",
    "case-study-01",
    "a",
    "a".repeat(120),
  ]) {
    assert.equal(archiveTypes.isArchiveSlug(value), true, value);
  }
});

test("archive slugs reject malformed, traversal, and injection-shaped input", () => {
  for (const value of [
    "",
    "Press-Release",
    "-leading-hyphen",
    "trailing-hyphen-",
    "two--hyphens",
    "has spaces",
    "has_underscore",
    "../admin",
    "news/another-segment",
    "<script>alert(1)</script>",
    "%3Csvg%20onload%3Dalert(1)%3E",
    "x';drop-table-archive_entries;--",
    "a".repeat(121),
  ]) {
    assert.equal(archiveTypes.isArchiveSlug(value), false, value);
  }
});

test("archive slugs are generated from English or Bengali titles", () => {
  assert.equal(
    archiveTypes.archiveSlugFromTitle("International Men's Day 2026"),
    "international-mens-day-2026",
  );
  assert.equal(
    archiveTypes.archiveSlugFromTitle("Crème & Café"),
    "creme-and-cafe",
  );

  const bengaliSlug = archiveTypes.archiveSlugFromTitle("পুরুষ অধিকার সংবাদ ২০২৬");
  assert.equal(archiveTypes.isArchiveSlug(bengaliSlug), true);
  assert.match(bengaliSlug, /2026$/);
  assert.notEqual(bengaliSlug, "news-item");

  assert.equal(archiveTypes.archiveSlugFromTitle("!!!"), "news-item");

  const longSlug = archiveTypes.archiveSlugFromTitle("Long archive title ".repeat(20));
  assert.equal(archiveTypes.isArchiveSlug(longSlug), true);
  assert.ok(longSlug.length <= 100);
});

test("duplicate archive titles receive stable numeric slug suffixes", () => {
  assert.equal(archiveTypes.archiveSlugWithSequence("same-title", 1), "same-title");
  assert.equal(archiveTypes.archiveSlugWithSequence("same-title", 2), "same-title-2");
  assert.equal(archiveTypes.archiveSlugWithSequence("same-title", 3), "same-title-3");

  const suffixed = archiveTypes.archiveSlugWithSequence("a".repeat(120), 100);
  assert.equal(suffixed.length, 120);
  assert.equal(archiveTypes.isArchiveSlug(suffixed), true);
  assert.match(suffixed, /-100$/);
});

test("archive display links remain HTTPS-only", () => {
  assert.equal(
    archiveTypes.safeHttpsUrl("https://drive.google.com/folder/abc"),
    "https://drive.google.com/folder/abc",
  );
  assert.equal(
    archiveTypes.safeHttpsUrl("  https://example.org/press.pdf  "),
    "https://example.org/press.pdf",
  );

  for (const value of [
    "http://example.org/file.mp3",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "//example.org/file.pdf",
    "/local/file.pdf",
    "not a URL",
    null,
    undefined,
  ]) {
    assert.equal(archiveTypes.safeHttpsUrl(value), null, String(value));
  }
});

test("public images allow app-local paths and HTTPS without mixed content", () => {
  assert.equal(archiveTypes.safeMediaUrl("/images/press/photo.jpg"), "/images/press/photo.jpg");
  assert.equal(
    archiveTypes.safeMediaUrl("https://cdn.example.org/photo.webp"),
    "https://cdn.example.org/photo.webp",
  );

  for (const value of [
    "http://cdn.example.org/photo.jpg",
    "//cdn.example.org/photo.jpg",
    "javascript:alert(1)",
    "data:image/svg+xml,<svg onload=alert(1)>",
  ]) {
    assert.equal(archiveTypes.safeMediaUrl(value), null, value);
  }
});

test("public archive timelines put dated media newest-first and keep ties stable", () => {
  const items = [
    { id: "older-video", dateIso: "2025-11-12" },
    { id: "undated-audio", dateIso: null },
    { id: "new-photo", dateIso: "2026-08-27" },
    { id: "same-day-report", dateIso: "2026-08-27" },
    { id: "undated-article", dateIso: null },
  ];

  assert.deepEqual(
    archiveTypes.sortArchiveItemsNewestFirst(items).map((item) => item.id),
    [
      "new-photo",
      "same-day-report",
      "older-video",
      "undated-audio",
      "undated-article",
    ],
  );
  assert.deepEqual(items.map((item) => item.id), [
    "older-video",
    "undated-audio",
    "new-photo",
    "same-day-report",
    "undated-article",
  ]);
});

test("interactive archive listings omit full galleries and private detail payload", () => {
  const listing = archiveTypes.toArchiveListingItem({
    id: "one",
    slug: "one",
    kind: "photo",
    section: "press_media",
    heading: "Heading",
    body: "Summary",
    category: "Event",
    location: "Dhaka",
    date: "21 October 2026",
    dateIso: "2026-10-21",
    year: "2026",
    cover: "https://cdn.example.org/cover.jpg",
    photoCount: 24,
    photos: Array.from({ length: 24 }, (_, index) => ({ id: String(index) })),
    pressReleaseBody: "A very large press release",
    rawVideoUrl: "https://cdn.example.org/raw.mp4",
  });

  assert.equal(listing.photoCount, 24);
  assert.equal(Object.hasOwn(listing, "photos"), false);
  assert.equal(Object.hasOwn(listing, "pressReleaseBody"), false);
  assert.equal(Object.hasOwn(listing, "rawVideoUrl"), false);
});

test("server action link validation accepts HTTPS and rejects mixed-content or active URLs", () => {
  const valid = new FormData();
  valid.set("resource", " https://cdn.example.org/raw/audio.mp3 ");
  assert.equal(
    sharedActions.httpsUrlField(valid, "resource", "Resource"),
    "https://cdn.example.org/raw/audio.mp3",
  );

  const empty = new FormData();
  assert.equal(sharedActions.httpsUrlField(empty, "resource", "Resource"), null);

  for (const value of [
    "http://cdn.example.org/raw/video.mp4",
    "javascript:alert(1)",
    "data:text/html,<svg onload=alert(1)>",
    "/uploads/press.pdf",
    "not a URL",
  ]) {
    const form = new FormData();
    form.set("resource", value);
    assert.throws(
      () => sharedActions.httpsUrlField(form, "resource", "Resource"),
      /https:\/\//i,
      value,
    );
  }
});

test("archive writes generate collision-safe slugs server-side and preserve existing URLs", () => {
  assert.match(archiveActionsSource, /slug:\s*slugField\(headingEn \|\| heading\)/);
  assert.match(
    archiveActionsSource,
    /slug:\s*archiveSlugWithSequence\(fields\.slug, sequence\)/,
  );
  assert.match(archiveActionsSource, /error\.code !== ["']23505["']/);
  assert.match(archiveActionsSource, /const next = \{ \.\.\.submitted, slug: existing\.slug/);
  assert.doesNotMatch(
    archiveActionsSource,
    /requiredText\(formData,\s*["']slug["']/,
    "the server must not trust a manually supplied client slug",
  );
});

test("editorial links stay HTTPS-only when provided, while source details are optional", () => {
  for (const field of [
    "video_url",
    "video_file_url",
    "press_release_url",
    "hd_photos_url",
    "raw_video_url",
    "audio_url",
    "source_url",
  ]) {
    assert.match(
      archiveActionsSource,
      new RegExp(`httpsUrlField\\(\\s*formData,\\s*["']${field}["']`),
      `${field} must pass through the HTTPS-only action validator`,
    );
  }

  assert.doesNotMatch(archiveActionsSource, /needsSource/);
  assert.doesNotMatch(archiveManagerSource, /needsSource/);
  assert.match(archiveManagerSource, /মূল সংবাদ \/ তথ্যসূত্র \(ঐচ্ছিক\)/);
  assert.match(archiveManagerSource, /publish করার জন্য এগুলো বাধ্যতামূলক নয়/);
});
