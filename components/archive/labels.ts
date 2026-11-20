import type { Dictionary } from "@/lib/i18n/dictionary";
import type { ArchiveContentType } from "@/lib/types/archive";

/**
 * The slice of the dictionary the archive's client components need.
 *
 * Passing the whole `Dictionary` would serialise every string on the site into
 * the payload for these components; this is the part they actually read.
 */
export type ArchiveLabels = Dictionary["archive"];

/**
 * What a post is — news, press release, case study — which is the only tag a
 * card carries. Whether it holds a video or photos is not a kind of post.
 */
export function contentTypeLabel(t: ArchiveLabels, type: ArchiveContentType): string {
    switch (type) {
        case "event":
        case "mens_rights_news":
            return t.subNewsEvents;
        case "press_release":
            return t.typePressRelease;
        case "media_coverage":
            return t.typeMediaCoverage;
        case "case_study":
            return t.typeCaseStudy;
        case "report":
            return t.typeReport;
    }
}
