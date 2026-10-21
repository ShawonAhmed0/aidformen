import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ArchiveEntry, ArchivePhoto } from "@/lib/types/archive";

/**
 * Read side of the archive.
 *
 * Same contract as lib/content/queries.ts: errors are logged and swallowed so a
 * missing table or a wrong policy renders the empty state instead of a 500, and
 * each fetcher is wrapped in React `cache()` so the page and its metadata share
 * one query.
 *
 * Entries and photos are fetched separately and stitched here rather than with
 * an embedded select. The nested form returns the child rows unordered per
 * parent, which shuffled galleries between renders.
 */

function warn(scope: string, error: { message: string } | null) {
  if (error) console.warn(`[archive] ${scope}: ${error.message}`);
}

type EntryRow = Omit<ArchiveEntry, "photos">;

/**
 * New application code can be deployed a few minutes before migration 0012 is
 * applied. PostgREST simply omits columns that do not yet exist from `select
 * *`, so normalize those legacy rows here instead of letting the public cards
 * or the admin editor read `undefined` values.
 */
function normalizeEntryRow(row: EntryRow): EntryRow {
  return {
    ...row,
    slug: row.slug || `archive-${row.id.slice(0, 8)}`,
    section: row.section || "press_media",
    content_type: row.content_type || "event",
    event_status: row.event_status ?? null,
    notice_body: row.notice_body ?? null,
    notice_body_en: row.notice_body_en ?? null,
    post_event_body: row.post_event_body ?? null,
    post_event_body_en: row.post_event_body_en ?? null,
    press_release_body: row.press_release_body ?? null,
    press_release_body_en: row.press_release_body_en ?? null,
    press_release_url: row.press_release_url ?? null,
    hd_photos_url: row.hd_photos_url ?? null,
    raw_video_url: row.raw_video_url ?? null,
    audio_url: row.audio_url ?? null,
    source_name: row.source_name ?? null,
    source_name_en: row.source_name_en ?? null,
    source_url: row.source_url ?? null,
  };
}

async function withPhotos(rows: EntryRow[]): Promise<ArchiveEntry[]> {
  if (rows.length === 0) return [];

  const normalizedRows = rows.map(normalizeEntryRow);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("archive_media")
    .select("*")
    .in(
      "entry_id",
      normalizedRows.map((r) => r.id)
    )
    .order("sort_order", { ascending: true });

  warn("archive_media", error);

  const byEntry = new Map<string, ArchivePhoto[]>();
  for (const photo of (data as ArchivePhoto[] | null) ?? []) {
    const list = byEntry.get(photo.entry_id);
    if (list) list.push(photo);
    else byEntry.set(photo.entry_id, [photo]);
  }

  return normalizedRows.map((row) => ({
    ...row,
    photos: byEntry.get(row.id) ?? [],
  }));
}

export const getArchiveEntries = cache(async (): Promise<ArchiveEntry[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("archive_entries")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  warn("archive_entries", error);
  return withPhotos((data as EntryRow[] | null) ?? []);
});

/**
 * A small, server-only set for the detail-page suggestions rail.
 *
 * Fetching a bounded candidate set keeps the article response light. Entries
 * from the same editorial section and content type are preferred, while the
 * database's newest-first order remains the tie-breaker.
 */
export async function getRelatedArchiveEntries(
  current: ArchiveEntry,
  limit = 4
): Promise<ArchiveEntry[]> {
  const supabase = await createClient();
  const candidateLimit = Math.max(limit * 3, 12);

  const { data, error } = await supabase
    .from("archive_entries")
    .select("*")
    .eq("is_published", true)
    .neq("id", current.id)
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(candidateLimit);

  warn("related_archive_entries", error);
  const candidates = await withPhotos((data as EntryRow[] | null) ?? []);

  return candidates
    .map((entry, index) => ({
      entry,
      index,
      score:
        (entry.section === current.section ? 4 : 0) +
        (entry.content_type === current.content_type ? 2 : 0) +
        (entry.category && entry.category === current.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

/**
 * Admin read — includes unpublished entries. RLS still enforces the admin check;
 * this differs only in not filtering by is_published.
 */
export const getAllArchiveEntries = cache(async (): Promise<ArchiveEntry[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("archive_entries")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  warn("admin:archive_entries", error);
  return withPhotos((data as EntryRow[] | null) ?? []);
});

/** One published entry for the server-rendered, shareable detail route. */
export const getArchiveEntryBySlug = cache(
  async (slug: string): Promise<ArchiveEntry | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("archive_entries")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    warn("archive_entry_by_slug", error);
    if (error) {
      // Keep existing archive links usable during a rolling deployment where
      // the application can reach production before migration 0012 has added
      // the slug column. Legacy entries already have a deterministic public
      // slug in resolveArchiveEntry; searching the published read model lets
      // those links resolve until the migration backfills the stored value.
      const legacyEntries = await getArchiveEntries();
      return (
        legacyEntries.find(
          (entry) =>
            entry.slug === slug ||
            (!entry.slug && `archive-${entry.id.slice(0, 8)}` === slug)
        ) ?? null
      );
    }

    if (!data) return null;

    const [entry] = await withPhotos([data as EntryRow]);
    return entry ?? null;
  }
);
