import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicRoute = await readFile(
  new URL("../app/(public)/[lang]/media-archive/page.tsx", import.meta.url),
  "utf8",
);
const adminRoute = await readFile(
  new URL("../app/(admin)/admin/media/page.tsx", import.meta.url),
  "utf8",
);
const gallery = await readFile(
  new URL("../components/media-library/MediaLibraryGallery.tsx", import.meta.url),
  "utf8",
);
const inventory = await readFile(
  new URL("../components/media-library/MediaLibraryInventory.tsx", import.meta.url),
  "utf8",
);
const labels = await readFile(
  new URL("../components/media-library/labels.ts", import.meta.url),
  "utf8",
);
const query = await readFile(
  new URL("../lib/content/media-library.ts", import.meta.url),
  "utf8",
);

test("public media archive validates the async locale and emits bilingual metadata", () => {
  assert.match(publicRoute, /params:\s*Promise<\{ lang: string \}>/);
  assert.match(publicRoute, /const \{ lang \} = await params/);
  assert.match(publicRoute, /if \(!isLocale\(lang\)\) notFound\(\)/);
  assert.match(publicRoute, /export async function generateMetadata/);
  assert.match(publicRoute, /canonical: `\/\$\{lang\}\/media-archive`/);
  assert.match(publicRoute, /bn: "\/bn\/media-archive"/);
  assert.match(publicRoute, /en: "\/en\/media-archive"/);
  assert.match(labels, /bn:\s*\{/);
  assert.match(labels, /en:\s*\{/);
});

test("public gallery has keyboard-operable image and video tabs", () => {
  assert.match(gallery, /role="tablist"/);
  assert.match(gallery, /role="tab"/);
  assert.match(gallery, /aria-selected=\{selected\}/);
  assert.match(gallery, /aria-controls=/);
  assert.match(gallery, /role="tabpanel"/);
  assert.match(gallery, /event\.key === "ArrowRight"/);
  assert.match(gallery, /event\.key === "ArrowLeft"/);
  assert.match(gallery, /sm:grid-cols-2/);
  assert.match(gallery, /lg:grid-cols-3/);
});

test("videos use native, non-autoplay playback with a download fallback", () => {
  assert.match(gallery, /<video[\s\S]*?controls[\s\S]*?playsInline[\s\S]*?preload="none"/);
  assert.match(gallery, /isBrowserPlayableVideo\(asset\.mime_type\)/);
  assert.match(gallery, /download=\{fileName\}/);
  assert.match(gallery, /rel="noopener noreferrer"/);
  assert.doesNotMatch(gallery, /\bautoPlay\b/);
  assert.doesNotMatch(gallery, /dangerouslySetInnerHTML|<iframe/i);
});

test("server query derives public URLs and degrades missing migration errors to empty", () => {
  assert.match(query, /from\("media_assets"\)/);
  assert.match(query, /storage\.from\(row\.bucket_id\)\.getPublicUrl\(row\.object_path\)/);
  assert.match(query, /if \(error\)[\s\S]*?return \[\]/);
  assert.match(query, /catch \(error\)[\s\S]*?return \[\]/);
  assert.doesNotMatch(
    query,
    /\.select\([\s\S]{0,240}?["'][^"']*public_url[^"']*["']/,
  );
});

test("admin page presents centralized metadata as a read-only inventory", () => {
  assert.match(adminRoute, /getAllMediaAssets\(\)/);
  assert.match(adminRoute, /<MediaLibraryInventory assets=\{assets\}/);
  assert.match(inventory, /<table/);
  assert.match(inventory, /asset\.bucket_id/);
  assert.match(inventory, /asset\.folder/);
  assert.match(inventory, /asset\.object_path/);
  assert.match(inventory, /asset\.mime_type/);
  assert.doesNotMatch(adminRoute, /use server|create|update|delete/i);
  assert.doesNotMatch(inventory, /<form|<input|<button/i);
});
