import type { Dictionary } from "@/lib/i18n/dictionary";

/**
 * The slice of the dictionary the archive's client components need.
 *
 * Passing the whole `Dictionary` would serialise every string on the site into
 * the payload for these components; this is the part they actually read.
 */
export type ArchiveLabels = Dictionary["archive"];
