import { toEmbedUrl } from "@/lib/embed";
import { formatDate, pick, type Locale } from "@/lib/i18n/config";

/**
 * Row shapes for supabase/migrations/0010_archive.sql.
 *
 * An archive entry is one of two kinds. Both carry a heading and a paragraph;
 * what differs is the media — a photo entry has a gallery, a video entry has
 * either an external link or an uploaded file.
 */

export const archiveKinds = ["photo", "video"] as const;
export type ArchiveKind = (typeof archiveKinds)[number];

/**
 * Gallery ceiling, shared by the editor and the action that stores it. A gallery
 * this long is already unusable to scroll; the cap is there so one entry cannot
 * grow into a payload that trips the action's own limits.
 */
export const MAX_ARCHIVE_PHOTOS = 40;

export type ArchivePhoto = {
  id: string;
  entry_id: string;
  image_url: string;
  caption: string | null;
  caption_en: string | null;
  sort_order: number;
};

export type ArchiveEntry = {
  id: string;
  kind: ArchiveKind;
  heading: string;
  heading_en: string | null;
  body: string | null;
  body_en: string | null;
  category: string | null;
  category_en: string | null;
  location: string | null;
  location_en: string | null;
  event_date: string | null;
  cover_image_url: string | null;
  /** External watch page — only embedded if `toEmbedUrl` recognises the host. */
  video_url: string | null;
  /** Uploaded file in our own storage bucket, played in a <video> tag. */
  video_file_url: string | null;
  sort_order: number;
  is_published: boolean;
  /** Empty for a video entry. Ordered by sort_order. */
  photos: ArchivePhoto[];
};

/**
 * Year an entry is filed under, as a string so it can go straight into a filter
 * chip. Entries with no date are excluded from the year filter rather than
 * bucketed under a guess.
 */
export function archiveYear(entry: ArchiveEntry): string | null {
  return entry.event_date ? entry.event_date.slice(0, 4) : null;
}

/**
 * The image a card should show. A photo entry with no explicit cover falls back
 * to its first gallery image, so uploading a gallery is enough.
 */
export function archiveCover(entry: ArchiveEntry): string | null {
  return entry.cover_image_url ?? entry.photos[0]?.image_url ?? null;
}

/** Whether a video entry has anything to play at all. */
export function hasPlayableVideo(entry: ArchiveEntry): boolean {
  return Boolean(entry.video_file_url || entry.video_url);
}

/**
 * One entry with the locale already applied — plain display strings, ready for
 * a client component.
 *
 * The filter UI has to run in the browser, and handing it raw bilingual rows
 * would mean shipping `pick`, both languages of every field and the embed
 * allowlist to the client for no gain.
 */
export type ArchiveItem = {
  id: string;
  kind: ArchiveKind;
  heading: string;
  body: string;
  category: string;
  location: string;
  /** Formatted for display; null when the entry has no date. */
  date: string | null;
  /** Raw year, used by the year filter. */
  year: string | null;
  cover: string | null;
  /** Set only when the external link is one we are willing to frame. */
  embedUrl: string | null;
  /** The original watch page, offered as a link out. */
  externalUrl: string | null;
  fileUrl: string | null;
  photos: { id: string; url: string; caption: string }[];
};

export function resolveArchiveEntry(
  locale: Locale,
  entry: ArchiveEntry
): ArchiveItem {
  return {
    id: entry.id,
    kind: entry.kind,
    heading: pick(locale, entry.heading, entry.heading_en),
    body: pick(locale, entry.body, entry.body_en),
    category: pick(locale, entry.category, entry.category_en),
    location: pick(locale, entry.location, entry.location_en),
    date: formatDate(locale, entry.event_date),
    year: archiveYear(entry),
    cover: archiveCover(entry),
    embedUrl: entry.video_url ? toEmbedUrl(entry.video_url) : null,
    externalUrl: entry.video_url,
    fileUrl: entry.video_file_url,
    photos: entry.photos.map((photo) => ({
      id: photo.id,
      url: photo.image_url,
      caption: pick(locale, photo.caption, photo.caption_en),
    })),
  };
}
