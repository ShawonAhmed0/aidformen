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

async function withPhotos(rows: EntryRow[]): Promise<ArchiveEntry[]> {
  if (rows.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("archive_media")
    .select("*")
    .in(
      "entry_id",
      rows.map((r) => r.id)
    )
    .order("sort_order", { ascending: true });

  warn("archive_media", error);

  const byEntry = new Map<string, ArchivePhoto[]>();
  for (const photo of (data as ArchivePhoto[] | null) ?? []) {
    const list = byEntry.get(photo.entry_id);
    if (list) list.push(photo);
    else byEntry.set(photo.entry_id, [photo]);
  }

  return rows.map((row) => ({ ...row, photos: byEntry.get(row.id) ?? [] }));
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
