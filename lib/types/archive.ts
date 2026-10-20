import { toEmbedUrl } from "@/lib/embed";
import { formatDate, pick, type Locale } from "@/lib/i18n/config";

/**
 * Row shapes for supabase/migrations/0010_archive.sql.
 *
 * An archive entry is one of two kinds. Both carry a heading and a paragraph;
 * what differs is the media — a photo entry has a gallery, a video entry has
 * either an external link or an uploaded file.
 */

export const archiveKinds = ["article", "photo", "video", "audio"] as const;
export type ArchiveKind = (typeof archiveKinds)[number];

export const archiveSections = ["press_media", "news_archive"] as const;
export type ArchiveSection = (typeof archiveSections)[number];

export const archiveContentTypes = [
  "event",
  "press_release",
  "media_coverage",
  "mens_rights_news",
  "case_study",
  "report",
] as const;
export type ArchiveContentType = (typeof archiveContentTypes)[number];

export const archiveEventStatuses = ["upcoming", "completed"] as const;
export type ArchiveEventStatus = (typeof archiveEventStatuses)[number];

export const ARCHIVE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isArchiveSlug(value: string): boolean {
  return value.length <= 120 && ARCHIVE_SLUG_PATTERN.test(value);
}

const bengaliDigits = "০১২৩৪৫৬৭৮৯";
const bengaliIndependentVowels: Record<string, string> = {
  "অ": "a",
  "আ": "a",
  "ই": "i",
  "ঈ": "i",
  "উ": "u",
  "ঊ": "u",
  "ঋ": "ri",
  "এ": "e",
  "ঐ": "oi",
  "ও": "o",
  "ঔ": "ou",
};
const bengaliVowelSigns: Record<string, string> = {
  "া": "a",
  "ি": "i",
  "ী": "i",
  "ু": "u",
  "ূ": "u",
  "ৃ": "ri",
  "ে": "e",
  "ৈ": "oi",
  "ো": "o",
  "ৌ": "ou",
};
const bengaliConsonants: Record<string, string> = {
  "ক": "k",
  "খ": "kh",
  "গ": "g",
  "ঘ": "gh",
  "ঙ": "ng",
  "চ": "ch",
  "ছ": "chh",
  "জ": "j",
  "ঝ": "jh",
  "ঞ": "n",
  "ট": "t",
  "ঠ": "th",
  "ড": "d",
  "ঢ": "dh",
  "ণ": "n",
  "ত": "t",
  "থ": "th",
  "দ": "d",
  "ধ": "dh",
  "ন": "n",
  "প": "p",
  "ফ": "ph",
  "ব": "b",
  "ভ": "bh",
  "ম": "m",
  "য": "y",
  "র": "r",
  "ল": "l",
  "শ": "sh",
  "ষ": "sh",
  "স": "s",
  "হ": "h",
  "ৎ": "t",
};

/**
 * Generates an ASCII route segment from either an English or Bengali title.
 *
 * Bengali is transliterated rather than discarded so an administrator can
 * create a useful URL without also entering the optional English title.
 * Collision suffixes are added by the create action, where the authoritative
 * list of existing slugs is available.
 */
export function archiveSlugFromTitle(title: string): string {
  const chars = Array.from(
    title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  );
  let transliterated = "";

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const digit = bengaliDigits.indexOf(char);

    if (/[A-Za-z0-9]/.test(char)) {
      transliterated += char;
      continue;
    }
    if (digit >= 0) {
      transliterated += String(digit);
      continue;
    }
    if (char === "&") {
      transliterated += " and ";
      continue;
    }
    if (char === "'" || char === "’") continue;

    const independentVowel = bengaliIndependentVowels[char];
    if (independentVowel) {
      transliterated += independentVowel;
      continue;
    }

    let consonant = bengaliConsonants[char];
    let nextIndex = index + 1;
    if (
      (char === "ড" || char === "ঢ" || char === "য") &&
      chars[nextIndex] === "়"
    ) {
      consonant = char === "ড" ? "r" : char === "ঢ" ? "rh" : "y";
      index += 1;
      nextIndex += 1;
    }
    if (consonant) {
      const next = chars[nextIndex];
      transliterated += consonant;
      if (!bengaliVowelSigns[next] && next !== "্") transliterated += "a";
      continue;
    }

    const vowelSign = bengaliVowelSigns[char];
    if (vowelSign) {
      transliterated += vowelSign;
      continue;
    }
    if (char === "ং") {
      transliterated += "ng";
      continue;
    }
    if (char === "ঃ") {
      transliterated += "h";
      continue;
    }
    if (char === "ঁ") {
      transliterated += "n";
      continue;
    }
    if (char === "্" || char === "়") continue;

    transliterated += " ";
  }

  const slug = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 100)
    .replace(/-+$/g, "");

  return slug || "news-item";
}

/** Adds the deterministic suffix used when another record already owns a slug. */
export function archiveSlugWithSequence(base: string, sequence: number): string {
  if (sequence <= 1) return base;

  const suffix = `-${sequence}`;
  const prefix = base.slice(0, 120 - suffix.length).replace(/-+$/g, "");
  return `${prefix}${suffix}`;
}

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
  slug: string;
  kind: ArchiveKind;
  section: ArchiveSection;
  content_type: ArchiveContentType;
  event_status: ArchiveEventStatus | null;
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
  notice_body: string | null;
  notice_body_en: string | null;
  post_event_body: string | null;
  post_event_body_en: string | null;
  press_release_body: string | null;
  press_release_body_en: string | null;
  press_release_url: string | null;
  hd_photos_url: string | null;
  raw_video_url: string | null;
  audio_url: string | null;
  source_name: string | null;
  source_name_en: string | null;
  source_url: string | null;
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
  return safeMediaUrl(entry.cover_image_url ?? entry.photos[0]?.image_url);
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
  slug: string;
  kind: ArchiveKind;
  section: ArchiveSection;
  contentType: ArchiveContentType;
  eventStatus: ArchiveEventStatus | null;
  heading: string;
  body: string;
  category: string;
  location: string;
  /** Formatted for display; null when the entry has no date. */
  date: string | null;
  dateIso: string | null;
  /** Raw year, used by the year filter. */
  year: string | null;
  cover: string | null;
  /** Set only when the external link is one we are willing to frame. */
  embedUrl: string | null;
  /** The original watch page, offered as a link out. */
  externalUrl: string | null;
  fileUrl: string | null;
  noticeBody: string;
  postEventBody: string;
  pressReleaseBody: string;
  pressReleaseUrl: string | null;
  hdPhotosUrl: string | null;
  rawVideoUrl: string | null;
  audioUrl: string | null;
  sourceName: string;
  sourceUrl: string | null;
  photos: { id: string; url: string; caption: string }[];
};

/** External editorial links are HTTPS-only to prevent mixed-content warnings. */
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** Public media may be an app-local path or a secure absolute URL. */
export function safeMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return safeHttpsUrl(value);
}

export function resolveArchiveEntry(
  locale: Locale,
  entry: ArchiveEntry
): ArchiveItem {
  return {
    id: entry.id,
    slug: entry.slug || `archive-${entry.id.slice(0, 8)}`,
    kind: entry.kind,
    section: entry.section || "press_media",
    contentType: entry.content_type || "event",
    eventStatus: entry.event_status || null,
    heading: pick(locale, entry.heading, entry.heading_en),
    body: pick(locale, entry.body, entry.body_en),
    category: pick(locale, entry.category, entry.category_en),
    location: pick(locale, entry.location, entry.location_en),
    date: formatDate(locale, entry.event_date),
    dateIso: entry.event_date,
    year: archiveYear(entry),
    cover: archiveCover(entry),
    embedUrl: safeHttpsUrl(entry.video_url)
      ? toEmbedUrl(safeHttpsUrl(entry.video_url)!)
      : null,
    externalUrl: safeHttpsUrl(entry.video_url),
    fileUrl: safeHttpsUrl(entry.video_file_url),
    noticeBody: pick(locale, entry.notice_body, entry.notice_body_en),
    postEventBody: pick(locale, entry.post_event_body, entry.post_event_body_en),
    pressReleaseBody: pick(
      locale,
      entry.press_release_body,
      entry.press_release_body_en
    ),
    pressReleaseUrl: safeHttpsUrl(entry.press_release_url),
    hdPhotosUrl: safeHttpsUrl(entry.hd_photos_url),
    rawVideoUrl: safeHttpsUrl(entry.raw_video_url),
    audioUrl: safeHttpsUrl(entry.audio_url),
    sourceName: pick(locale, entry.source_name, entry.source_name_en),
    sourceUrl: safeHttpsUrl(entry.source_url),
    photos: entry.photos.flatMap((photo) => {
      const url = safeMediaUrl(photo.image_url);
      return url
        ? [
            {
              id: photo.id,
              url,
              caption: pick(locale, photo.caption, photo.caption_en),
            },
          ]
        : [];
    }),
  };
}
