import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeUrl = new URL(
  "../app/(public)/[lang]/news/[slug]/page.tsx",
  import.meta.url,
);
const route = await readFile(routeUrl, "utf8");
const publicLayout = await readFile(
  new URL("../app/(public)/[lang]/layout.tsx", import.meta.url),
  "utf8",
);
const listingRoute = await readFile(
  new URL("../app/(public)/[lang]/news/page.tsx", import.meta.url),
  "utf8",
);
const archiveExplorer = await readFile(
  new URL("../components/archive/ArchiveExplorer.tsx", import.meta.url),
  "utf8",
);
const archiveCard = await readFile(
  new URL("../components/archive/ArchiveCard.tsx", import.meta.url),
  "utf8",
);
const globalCss = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const shareActions = await readFile(
  new URL("../components/ShareActions.tsx", import.meta.url),
  "utf8",
);
const newsLoading = await readFile(
  new URL("../app/(public)/[lang]/news/loading.tsx", import.meta.url),
  "utf8",
);
const archiveManager = await readFile(
  new URL("../components/admin/ArchiveManager.tsx", import.meta.url),
  "utf8",
);
const editorialField = await readFile(
  new URL("../components/admin/EditorialTextField.tsx", import.meta.url),
  "utf8",
);
const editorialContent = await readFile(
  new URL("../components/content/EditorialContent.tsx", import.meta.url),
  "utf8",
);

test("news detail is a server-rendered dynamic route with a safe not-found boundary", () => {
  assert.doesNotMatch(route, /^["']use client["'];/m);
  assert.match(route, /export default async function/i);
  assert.match(
    route,
    /if \(!isLocale\(lang\) \|\| !isArchiveSlug\(slug\)\) notFound\(\)/,
  );
  assert.match(route, /getArchiveEntryBySlug\(slug\)/);
  assert.match(route, /if \(!entry\) notFound\(\)/);
  assert.match(route, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
});

test("news detail emits share-ready canonical and Open Graph metadata", () => {
  assert.match(route, /export async function generateMetadata/i);
  assert.match(route, /alternates\s*:\s*\{[\s\S]*?canonical/i);
  assert.match(route, /openGraph\s*:/i);
  assert.match(route, /\/news\//i);
  assert.match(
    publicLayout,
    /metadataBase:\s*new URL\(["']https:\/\/aidformen\.com["']\)/i,
  );
  assert.match(publicLayout, /title:\s*\{\s*default:[\s\S]*?template:/i);
});

test("news detail opts into print treatment and the reusable share controls", () => {
  assert.match(route, /<ShareActions\b/);
  assert.match(route, /data-print-document/);
});

test("news pages use a focused reading width, stream suggestions, and prioritise audio", () => {
  assert.match(
    listingRoute,
    /<Section\s+space=["']md["']\s+containerWidth=["']prose["']/,
  );
  assert.match(route, /<Suspense\b[\s\S]*?<RelatedNewsAside\b/);
  assert.match(route, /getRelatedArchiveEntries\(current\)/);
  assert.ok(
    route.indexOf("<AudioRecording") < route.indexOf("item.body &&"),
    "audio should appear before the main article body",
  );
  assert.match(newsLoading, /aria-busy=["']true["']/);
  assert.match(newsLoading, /role=["']status["']/);
});

test("news detail uses a publication-style hierarchy with wide media and narrow prose", () => {
  assert.doesNotMatch(route, /<header[^>]*\btext-center\b/);
  assert.match(route, /<header[^>]*\bmax-w-5xl\b/);
  assert.match(route, /<figure[^>]*\bmax-w-5xl\b/);
  assert.match(route, /data-news-layout/);
  assert.match(route, /lg:grid-cols-\[minmax\(0,42rem\)_/);
  assert.match(
    route,
    /<EditorialContent[\s\S]*?content=\{item\.body\}[\s\S]*?variant=["']article["'][\s\S]*?locale=\{lang\}/,
  );
  assert.match(route, /<section\s+aria-label=\{t\.archive\.overview\}>/);
  assert.doesNotMatch(route, /<h2[^>]*overview-heading[^>]*>/);
});

test("article typography and the related-news rail stay editorial instead of card-heavy", () => {
  assert.match(
    editorialContent,
    /variant\?:\s*["']default["']\s*\|\s*["']article["']/,
  );
  assert.match(editorialContent, /data-article-prose/);
  assert.match(editorialContent, /font-display/);
  assert.match(route, /<aside[^>]*related-news-heading[^>]*data-print-hide/);
  assert.match(route, /lg:sticky\s+lg:top-24/);
  assert.match(route, /border-t-4\s+border-brand-800/);
  assert.doesNotMatch(
    route,
    /href=\{`\/\$\{lang\}\/news\/\$\{related\.slug\}`\}[\s\S]{0,300}\bshadow-(?:xs|sm|md|lg|xl|2xl)\b/,
  );
});

test("archive long-form editing supports safe formatting and centred inline images", () => {
  assert.match(archiveManager, /<EditorialTextField\b/);
  assert.match(editorialField, /uploadToMedia\(file,\s*["']archive["']\)/);
  assert.match(editorialField, /className=["']ql-bold["']/);
  assert.match(editorialField, /className=["']ql-table-better["']/);
  assert.match(editorialField, /getSemanticHTML\(\)/);
  assert.match(editorialContent, /safeMediaUrl\(/);
  assert.match(editorialContent, /safeEditorialLink\(/);
  assert.match(editorialContent, /["'][^"']*mx-auto\s+w-full[^"']*["']/);
  assert.match(
    editorialContent,
    /article\s*\?\s*["']max-w-full text-left["']\s*:\s*["']max-w-2xl text-center["']/,
  );
  assert.match(editorialContent, /const safeHtml = sanitizeEditorialHtml\(content\)/);
  assert.match(
    editorialContent,
    /dangerouslySetInnerHTML=\{\{ __html: safeHtml \}\}/,
  );
  assert.match(route, /<EditorialContent\s+content=\{item\.body\}/);
});

test("news listing exposes both editorial sections, dated timeline filters, thumbnails, and stable URLs", () => {
  assert.match(listingRoute, /canonical:\s*`\/\$\{lang\}\/news`/);
  assert.match(listingRoute, /formatYear\(lang, year\)/);
  assert.match(archiveExplorer, /"press_media" as const/);
  assert.match(archiveExplorer, /"news_archive" as const/);
  assert.match(archiveExplorer, /activeCategories/);
  assert.match(archiveExplorer, /activeYears/);
  assert.match(
    archiveExplorer,
    /groups\.map\(\(\[groupYear, groupItems\], groupIndex\)/,
  );
  assert.match(archiveExplorer, /archive-year-\$\{groupYear\}/);
  assert.match(
    archiveCard,
    /href=\{`\/\$\{locale\}\/news\/\$\{item\.slug\}`\}/,
  );
  assert.match(archiveCard, /<Image\b/);
  assert.match(archiveCard, /item\.kind === ["']audio["']/);
});

test("global print CSS keeps content readable and adds the required provenance watermark", () => {
  assert.match(
    globalCss,
    /@page\s*\{[\s\S]*?size:\s*A4 portrait;[\s\S]*?margin:/i,
  );
  assert.match(globalCss, /@media print\s*\{/i);
  assert.match(
    globalCss,
    /body::after\s*\{[\s\S]*?content:\s*["']Downloaded from aidformen\.com["']/i,
  );
  assert.match(
    globalCss,
    /\[data-site-chrome\],[\s\S]*?\[data-print-hide\][\s\S]*?display:\s*none\s*!important/i,
  );
  assert.match(globalCss, /break-inside:\s*avoid/i);
  assert.doesNotMatch(
    globalCss,
    /\[data-print-keep\],\s*\n\s*article|\barticle,\s*\n\s*figure/i,
  );
  assert.match(globalCss, /\borphans:\s*3/i);
  assert.match(globalCss, /\bwidows:\s*3/i);
  assert.match(globalCss, /print-color-adjust:\s*exact/i);
  assert.match(
    globalCss,
    /\[data-news-layout\]\s*\{[\s\S]*?display:\s*block\s*!important/i,
  );
  assert.match(
    globalCss,
    /\[data-article-prose\]\s*\{[\s\S]*?max-width:\s*none\s*!important/i,
  );
});

test("share controls support native share, social destinations, copy fallback, and printing", () => {
  assert.match(shareActions, /navigator\.share/);
  assert.match(shareActions, /navigator\.clipboard\.writeText/);
  assert.match(shareActions, /document\.execCommand\(["']copy["']\)/);
  assert.match(shareActions, /facebook\.com\/sharer\/sharer\.php/i);
  assert.match(shareActions, /wa\.me\/\?text=/i);
  assert.match(shareActions, /linkedin\.com\/sharing\/share-offsite/i);
  assert.match(shareActions, /noopener,noreferrer/i);
  assert.match(shareActions, /window\.print\(\)/);
  assert.match(shareActions, /data-print-hide/);
});
