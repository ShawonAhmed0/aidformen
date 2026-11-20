"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    ChevronDown,
    Eye,
    EyeOff,
    ImageOff,
    Loader2,
    Music2,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
    createArchiveEntry,
    deleteArchiveEntry,
    toggleArchivePublished,
    updateArchiveEntry,
} from "@/lib/actions/archive";
import { toEmbedUrl } from "@/lib/embed";
import type { AdminLocale } from "@/lib/i18n/admin";
import {
    archiveCover,
    archiveSlugFromTitle,
    isArchiveSlug,
    MAX_ARCHIVE_ATTACHMENTS,
    MAX_ARCHIVE_PHOTOS,
    MAX_ARCHIVE_REFERENCE_PHOTOS,
    sectionForContentType,
    subsectionForContentType,
    subsectionsBySection,
    type ArchiveContentType,
    type ArchiveEntry,
    type ArchiveSection,
    type ArchiveSubsection,
    type PostKind,
} from "@/lib/types/archive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAdminLocale } from "./AdminLocale";
import { BilingualField } from "./BilingualField";
import { EditorialTextField } from "./EditorialTextField";
import { MediaField } from "./MediaField";
import { DocumentPicker } from "./DocumentPicker";
import { ArchiveGalleryEditor, type GalleryPhoto } from "./ArchiveGalleryEditor";
import {
    ArchiveAttachmentsEditor,
    type AttachmentDraft,
} from "./ArchiveAttachmentsEditor";
import { cn } from "@/lib/utils";

const copy = {
    bn: {
        sections: {
            press_media: "মিডিয়া সেন্টার",
            news_archive: "গবেষণা ও কেস স্টাডি",
        },
        types: {
            news_events: "নিউজ ও ইভেন্ট",
            press_release: "প্রেস রিলিজ",
            media_coverage: "মিডিয়া কভারেজ",
            case_study: "কেস স্টাডি",
            report: "পরিসংখ্যান ও গবেষণা",
        },
        // List
        posts: "পোস্ট",
        newPost: "নতুন পোস্ট",
        searchPlaceholder: "শিরোনাম দিয়ে খুঁজুন…",
        filterAll: "সব",
        filterPublished: "প্রকাশিত",
        filterDrafts: "খসড়া",
        published: "প্রকাশিত",
        draft: "খসড়া",
        hasAudio: "অডিও",
        photoCount: (n: number) => `${n}টি ছবি`,
        empty: "এখনো কোনো পোস্ট নেই। “নতুন পোস্ট” চেপে প্রথমটি যোগ করুন।",
        noMatches: "এই খোঁজে কিছু পাওয়া যায়নি।",
        edit: "সম্পাদনা",
        publish: "প্রকাশ করুন",
        unpublish: "লুকান",
        remove: "মুছে ফেলুন",
        cancel: "বাতিল",
        confirmDelete: (title: string) =>
            `“${title}” এবং এর সংযুক্ত ছবি-ফাইল স্থায়ীভাবে মুছে যাবে।`,
        deleted: "পোস্টটি মুছে ফেলা হয়েছে।",
        // Form
        back: "তালিকায় ফিরুন",
        newTitle: "নতুন পোস্ট",
        editTitle: "পোস্ট সম্পাদনা",
        typeLabel: "কোন ধরনের পোস্ট?",
        basics: "মূল তথ্য",
        heading: "শিরোনাম",
        date: "তারিখ",
        location: "স্থান (ঐচ্ছিক)",
        locationPlaceholder: "যেমন: জাতীয় প্রেস ক্লাব, ঢাকা",
        cover: "কভার ছবি",
        coverHelp: "তালিকা ও শেয়ারে এই ছবিটি দেখাবে। না দিলে প্রথম গ্যালারি ছবিটি ব্যবহার হবে।",
        body: "লেখা",
        bodyHelp: "শিরোনাম, তালিকা, লিঙ্ক ও লেখার মাঝে ছবি যোগ করা যায়।",
        media: "ছবি, ভিডিও ও অডিও",
        mediaHint: "সবই ঐচ্ছিক — যা আছে শুধু সেটুকু যোগ করুন।",
        video: "ভিডিও",
        videoLink: "ইউটিউব বা ফেসবুক ভিডিওর লিঙ্ক",
        videoFile: "অথবা ছোট ভিডিও ফাইল আপলোড করুন",
        videoFileHelp: "সর্বোচ্চ ৫০ MB। বড় ভিডিও ইউটিউবে তুলে লিঙ্ক দিন।",
        videoNotEmbeddable:
            "এই লিঙ্কটি পাতার ভেতরে চালানো যাবে না — দর্শক নতুন ট্যাবে খুলে দেখবেন।",
        audio: "অডিও",
        audioHelp: "বক্তব্য, সাক্ষাৎকার বা লেখাটির পাঠ — পাতার উপরে প্লেয়ারে বাজবে।",
        audioUpload: "অডিও ফাইল",
        audioUploadHelp: "MP3, M4A, OGG বা WAV · সর্বোচ্চ ২৫ MB",
        audioLink: "অথবা অডিওর লিঙ্ক",
        source: "মূল সংবাদের উৎস",
        sourceHint: "কোন সংবাদমাধ্যমে প্রকাশিত হয়েছে এবং তার লিঙ্ক।",
        sourceName: "সংবাদমাধ্যমের নাম",
        sourceNamePlaceholder: "যেমন: প্রথম আলো",
        sourceUrl: "মূল সংবাদের লিঙ্ক",
        more: "আরও অপশন",
        moreHint: "ক্যাটাগরি, সংযুক্ত নথি ও সাংবাদিকদের জন্য ফাইল",
        category: "ক্যাটাগরি (ঐচ্ছিক)",
        categoryPlaceholder: "যেমন: সংবাদ সম্মেলন",
        categoryHelp: "সাইটে ক্যাটাগরি অনুযায়ী ফিল্টার করতে ব্যবহার হয়।",
        mediaKit: "সাংবাদিকদের জন্য ফাইল (Drive/Cloud লিঙ্ক)",
        pressFile: "প্রেস রিলিজ PDF/Doc লিঙ্ক",
        pressUpload: "অথবা প্রেস রিলিজ PDF আপলোড করুন",
        hdPhotos: "HD ছবির ফোল্ডার",
        rawVideo: "Raw ভিডিওর ফোল্ডার",
        httpsHelp: "https:// দিয়ে শুরু হওয়া লিঙ্ক দিন।",
        saveDraft: "খসড়া হিসেবে সংরক্ষণ",
        publishNow: "প্রকাশ করুন",
        saveChanges: "পরিবর্তন সংরক্ষণ",
        moveToDrafts: "খসড়ায় ফিরিয়ে নিন",
        saving: "সংরক্ষণ হচ্ছে…",
        saved: "পোস্ট সংরক্ষণ হয়েছে।",
        publishedToast: "পোস্টটি প্রকাশিত হয়েছে।",
        errTitle: "শিরোনাম লিখুন।",
        errSlug: "শিরোনামে অন্তত কিছু অক্ষর বা সংখ্যা থাকতে হবে।",
        errPhotos: (max: number) => `সর্বোচ্চ ${max}টি ছবি রাখা যাবে। অতিরিক্ত ছবি সরান।`,
        errAttachment: "প্রতিটি সংযুক্তিতে একটি সঠিক https:// লিঙ্ক দিন অথবা অসম্পূর্ণটি সরান।",
    },
    en: {
        sections: {
            press_media: "Media Center",
            news_archive: "Research & Case Studies",
        },
        types: {
            news_events: "News & Events",
            press_release: "Press Release",
            media_coverage: "Media Coverage",
            case_study: "Case Study",
            report: "Statistics & Research",
        },
        posts: "Posts",
        newPost: "New post",
        searchPlaceholder: "Search by title…",
        filterAll: "All",
        filterPublished: "Published",
        filterDrafts: "Drafts",
        published: "Published",
        draft: "Draft",
        hasAudio: "Audio",
        photoCount: (n: number) => `${n} photo${n === 1 ? "" : "s"}`,
        empty: "No posts yet. Press “New post” to add the first one.",
        noMatches: "Nothing matches this search.",
        edit: "Edit",
        publish: "Publish",
        unpublish: "Unpublish",
        remove: "Delete",
        cancel: "Cancel",
        confirmDelete: (title: string) =>
            `“${title}” and its attached photos and files will be permanently deleted.`,
        deleted: "The post was deleted.",
        back: "Back to the list",
        newTitle: "New post",
        editTitle: "Edit post",
        typeLabel: "What kind of post is it?",
        basics: "The basics",
        heading: "Title",
        date: "Date",
        location: "Place (optional)",
        locationPlaceholder: "e.g. National Press Club, Dhaka",
        cover: "Cover photo",
        coverHelp:
            "Shown in lists and when shared. If left empty, the first gallery photo is used.",
        body: "Text",
        bodyHelp: "Headings, lists, links and images within the text are supported.",
        media: "Photos, video and audio",
        mediaHint: "All optional — add only what you have.",
        video: "Video",
        videoLink: "YouTube or Facebook video link",
        videoFile: "Or upload a small video file",
        videoFileHelp: "Up to 50 MB. Put longer videos on YouTube and paste the link.",
        videoNotEmbeddable:
            "This link can't play inside the page — visitors will open it in a new tab.",
        audio: "Audio",
        audioHelp:
            "A statement, an interview, or the post read aloud — plays in a player at the top of the page.",
        audioUpload: "Audio file",
        audioUploadHelp: "MP3, M4A, OGG or WAV · up to 25 MB",
        audioLink: "Or a link to the audio",
        source: "Original source",
        sourceHint: "Which outlet published it, and the link.",
        sourceName: "Outlet name",
        sourceNamePlaceholder: "e.g. Prothom Alo",
        sourceUrl: "Link to the original story",
        more: "More options",
        moreHint: "Category, attached documents and files for journalists",
        category: "Category (optional)",
        categoryPlaceholder: "e.g. Press conference",
        categoryHelp: "Used for the category filter on the site.",
        mediaKit: "Files for journalists (Drive/Cloud links)",
        pressFile: "Press release PDF/Doc link",
        pressUpload: "Or upload the press release PDF",
        hdPhotos: "HD photos folder",
        rawVideo: "Raw video folder",
        httpsHelp: "Use a link that starts with https://.",
        saveDraft: "Save as draft",
        publishNow: "Publish",
        saveChanges: "Save changes",
        moveToDrafts: "Move back to drafts",
        saving: "Saving…",
        saved: "The post was saved.",
        publishedToast: "The post is now published.",
        errTitle: "Add a title.",
        errSlug: "The title needs at least a few letters or numbers.",
        errPhotos: (max: number) => `Up to ${max} photos are allowed. Remove the extra ones.`,
        errAttachment:
            "Give every attachment a valid https:// link, or remove the unfinished one.",
    },
};

type Copy = (typeof copy)[AdminLocale];

const s = (v: string | null | undefined) => v ?? "";

/** What a new post in each subsection is stored as. */
const typeForSubsection: Record<ArchiveSubsection, ArchiveContentType> = {
    news_events: "event",
    press_release: "press_release",
    media_coverage: "media_coverage",
    case_study: "case_study",
    report: "report",
};

/**
 * Everything a row stores. The form shows only part of it; the rest (event
 * notices, the separate press-release text, the slug…) rides along untouched
 * so that saving an older entry through the simpler form never erases it.
 */
type Draft = {
    id: string | null;
    slug: string;
    content_type: ArchiveContentType;
    event_status: string;
    heading: string;
    heading_en: string;
    body: string;
    body_en: string;
    category: string;
    category_en: string;
    location: string;
    location_en: string;
    event_date: string;
    cover_image_url: string | null;
    video_url: string;
    video_file_url: string | null;
    notice_body: string;
    notice_body_en: string;
    post_event_body: string;
    post_event_body_en: string;
    press_release_body: string;
    press_release_body_en: string;
    press_release_url: string;
    hd_photos_url: string;
    raw_video_url: string;
    audio_url: string;
    source_name: string;
    source_name_en: string;
    source_url: string;
    is_published: boolean;
    photos: GalleryPhoto[];
    attachments: AttachmentDraft[];
};

const emptyDraft = (section: ArchiveSection): Draft => ({
    id: null,
    slug: "",
    content_type: typeForSubsection[subsectionsBySection[section][0]],
    event_status: "",
    heading: "",
    heading_en: "",
    body: "",
    body_en: "",
    category: "",
    category_en: "",
    location: "",
    location_en: "",
    // Most posts are about something that just happened.
    event_date: new Date().toISOString().slice(0, 10),
    cover_image_url: null,
    video_url: "",
    video_file_url: null,
    notice_body: "",
    notice_body_en: "",
    post_event_body: "",
    post_event_body_en: "",
    press_release_body: "",
    press_release_body_en: "",
    press_release_url: "",
    hd_photos_url: "",
    raw_video_url: "",
    audio_url: "",
    source_name: "",
    source_name_en: "",
    source_url: "",
    is_published: false,
    photos: [],
    attachments: [],
});

const toDraft = (entry: ArchiveEntry): Draft => ({
    id: entry.id,
    slug: entry.slug,
    content_type: entry.content_type,
    event_status: entry.event_status ?? "",
    heading: entry.heading,
    heading_en: s(entry.heading_en),
    body: s(entry.body),
    body_en: s(entry.body_en),
    category: s(entry.category),
    category_en: s(entry.category_en),
    location: s(entry.location),
    location_en: s(entry.location_en),
    event_date: s(entry.event_date),
    cover_image_url: entry.cover_image_url,
    video_url: s(entry.video_url),
    video_file_url: entry.video_file_url,
    notice_body: s(entry.notice_body),
    notice_body_en: s(entry.notice_body_en),
    post_event_body: s(entry.post_event_body),
    post_event_body_en: s(entry.post_event_body_en),
    press_release_body: s(entry.press_release_body),
    press_release_body_en: s(entry.press_release_body_en),
    press_release_url: s(entry.press_release_url),
    hd_photos_url: s(entry.hd_photos_url),
    raw_video_url: s(entry.raw_video_url),
    audio_url: s(entry.audio_url),
    source_name: s(entry.source_name),
    source_name_en: s(entry.source_name_en),
    source_url: s(entry.source_url),
    is_published: entry.is_published,
    photos: entry.photos.map((photo) => ({
        url: photo.image_url,
        caption: s(photo.caption),
        caption_en: s(photo.caption_en),
    })),
    attachments: entry.attachments.map((attachment) => ({
        kind: attachment.kind,
        label: s(attachment.label),
        label_en: s(attachment.label_en),
        url: attachment.file_url,
        mime_type: s(attachment.mime_type),
    })),
});

/**
 * How the post is presented, worked out from what it contains so the editor
 * never has to choose: a video if it has one, a photo gallery if it is mostly
 * pictures, otherwise an article. A video post may only keep a few supporting
 * photos, so one with a full gallery is filed as the gallery instead — its
 * video still plays on the page.
 */
function presentationOf(draft: Draft): PostKind {
    const hasVideo = Boolean(draft.video_url.trim() || draft.video_file_url);
    const photos = draft.photos.length;
    const hasText = draft.body.replace(/<[^>]*>/g, "").trim().length > 0;

    if (hasVideo && photos <= MAX_ARCHIVE_REFERENCE_PHOTOS) return "video";
    if (photos > MAX_ARCHIVE_REFERENCE_PHOTOS || (photos > 0 && !hasText)) return "photo";
    return "article";
}

type StatusFilter = "all" | "published" | "drafts";

/**
 * Editor for one public section's posts — the Media Center or Research & Case
 * Studies. The page hands over only that section's rows.
 *
 * Deliberately small: a list, and one short form. The URL slug, the section
 * and the presentation are all derived, and rarely used fields sit behind
 * "More options" instead of in the editor's way.
 */
export function ArchiveManager({
    entries,
    section,
}: {
    entries: ArchiveEntry[];
    section: ArchiveSection;
}) {
    const router = useRouter();
    const locale = useAdminLocale();
    const t = copy[locale];
    const [pending, startTransition] = useTransition();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<StatusFilter>("all");

    const rows = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return entries
            .filter((entry) =>
                status === "all"
                    ? true
                    : status === "published"
                      ? entry.is_published
                      : !entry.is_published
            )
            .filter(
                (entry) =>
                    !needle ||
                    `${entry.heading} ${entry.heading_en ?? ""}`.toLowerCase().includes(needle)
            )
            // Newest first, matching the order visitors see; undated drafts lead.
            .sort((a, b) => (b.event_date ?? "9999").localeCompare(a.event_date ?? "9999"));
    }, [entries, query, status]);

    const patch = (changes: Partial<Draft>) =>
        setDraft((d) => (d ? { ...d, ...changes } : d));

    const togglePublished = (entry: ArchiveEntry) => {
        const body = new FormData();
        body.append("id", entry.id);
        body.append("is_published", String(!entry.is_published));

        startTransition(async () => {
            const result = await toggleArchivePublished(body);
            if (!result.ok) toast.error(result.error);
            router.refresh();
        });
    };

    const remove = (entry: ArchiveEntry) => {
        const body = new FormData();
        body.append("id", entry.id);
        setConfirmingDelete(null);

        startTransition(async () => {
            const result = await deleteArchiveEntry(body);
            if (!result.ok) toast.error(result.error);
            else toast.success(t.deleted);
            router.refresh();
        });
    };

    const save = (publish: boolean) => {
        if (!draft) return;
        if (!draft.heading.trim()) {
            toast.error(t.errTitle);
            return;
        }
        // Existing posts keep their address; a new one gets it from the title.
        const slug = draft.id
            ? draft.slug.trim()
            : archiveSlugFromTitle(draft.heading_en.trim() || draft.heading);
        if (!isArchiveSlug(slug)) {
            toast.error(t.errSlug);
            return;
        }
        if (draft.photos.length > MAX_ARCHIVE_PHOTOS) {
            toast.error(t.errPhotos(MAX_ARCHIVE_PHOTOS));
            return;
        }
        const hasInvalidAttachment = draft.attachments.some((attachment) => {
            try {
                return new URL(attachment.url).protocol !== "https:";
            } catch {
                return true;
            }
        });
        if (hasInvalidAttachment) {
            toast.error(t.errAttachment);
            return;
        }

        const body = new FormData();
        if (draft.id) body.append("id", draft.id);
        body.append("slug", slug);
        body.append("kind", presentationOf(draft));
        body.append("section", sectionForContentType[draft.content_type]);
        body.append("content_type", draft.content_type);
        body.append("event_status", draft.content_type === "event" ? draft.event_status : "");
        body.append("heading", draft.heading);
        body.append("heading_en", draft.heading_en);
        body.append("body", draft.body);
        body.append("body_en", draft.body_en);
        body.append("category", draft.category);
        body.append("category_en", draft.category_en);
        body.append("location", draft.location);
        body.append("location_en", draft.location_en);
        body.append("event_date", draft.event_date);
        if (draft.cover_image_url) body.append("cover_image_url", draft.cover_image_url);
        body.append("video_url", draft.video_url);
        if (draft.video_file_url) body.append("video_file_url", draft.video_file_url);
        body.append("notice_body", draft.notice_body);
        body.append("notice_body_en", draft.notice_body_en);
        body.append("post_event_body", draft.post_event_body);
        body.append("post_event_body_en", draft.post_event_body_en);
        body.append("press_release_body", draft.press_release_body);
        body.append("press_release_body_en", draft.press_release_body_en);
        body.append("press_release_url", draft.press_release_url);
        body.append("hd_photos_url", draft.hd_photos_url);
        body.append("raw_video_url", draft.raw_video_url);
        body.append("audio_url", draft.audio_url);
        body.append("source_name", draft.source_name);
        body.append("source_name_en", draft.source_name_en);
        body.append("source_url", draft.source_url);

        draft.photos.forEach((photo) => {
            body.append("photo_url", photo.url);
            body.append("photo_caption", photo.caption);
            body.append("photo_caption_en", photo.caption_en);
        });

        draft.attachments.forEach((attachment) => {
            body.append("attachment_kind", attachment.kind);
            body.append("attachment_label", attachment.label);
            body.append("attachment_label_en", attachment.label_en);
            body.append("attachment_url", attachment.url);
            body.append("attachment_mime_type", attachment.mime_type);
        });

        body.append("is_published", String(publish));

        startTransition(async () => {
            const result = draft.id
                ? await updateArchiveEntry(body)
                : await createArchiveEntry(body);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            toast.success(publish && !draft.is_published ? t.publishedToast : t.saved);
            setDraft(null);
            router.refresh();
        });
    };

    if (draft) {
        return (
            <PostForm
                draft={draft}
                patch={patch}
                section={section}
                pending={pending}
                t={t}
                onCancel={() => setDraft(null)}
                onSave={save}
            />
        );
    }

    const filters: { value: StatusFilter; label: string; count: number }[] = [
        { value: "all", label: t.filterAll, count: entries.length },
        {
            value: "published",
            label: t.filterPublished,
            count: entries.filter((entry) => entry.is_published).length,
        },
        {
            value: "drafts",
            label: t.filterDrafts,
            count: entries.filter((entry) => !entry.is_published).length,
        },
    ];
    const dateFormat = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
        dateStyle: "medium",
    });

    return (
        <div className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-ink-900">
                    {t.sections[section]} — {t.posts}
                </h2>
                <Button type="button" onClick={() => setDraft(emptyDraft(section))} disabled={pending}>
                    <Plus aria-hidden="true" />
                    {t.newPost}
                </Button>
            </div>

            {entries.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                    <div className="flex gap-1 rounded-lg bg-surface-sunken p-1">
                        {filters.map((filter) => (
                            <button
                                key={filter.value}
                                type="button"
                                aria-pressed={status === filter.value}
                                onClick={() => setStatus(filter.value)}
                                className={cn(
                                    "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-ui",
                                    status === filter.value
                                        ? "bg-surface text-brand-800 shadow-xs"
                                        : "text-ink-600 hover:text-ink-900"
                                )}
                            >
                                {filter.label}
                                <span className="text-xs text-ink-500 tabular-nums">
                                    {filter.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="relative min-w-52 flex-1">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
                            aria-hidden="true"
                        />
                        <Input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t.searchPlaceholder}
                            aria-label={t.searchPlaceholder}
                            className="pl-9"
                        />
                    </div>
                </div>
            )}

            {rows.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-ink-300 px-6 py-12 text-center text-sm text-ink-500">
                    {entries.length === 0 ? t.empty : t.noMatches}
                </p>
            ) : (
                <ul className="mt-5 divide-y divide-ink-200 rounded-xl border border-ink-200">
                    {rows.map((entry) => {
                        const cover = archiveCover(entry);

                        return (
                            <li key={entry.id} className="flex flex-wrap items-center gap-4 p-3 sm:p-4">
                                <span className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50">
                                    {cover ? (
                                        <Image
                                            src={cover}
                                            alt=""
                                            fill
                                            unoptimized
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <ImageOff className="size-5 text-brand-600" aria-hidden="true" />
                                    )}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-ink-900">
                                        {entry.heading}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-500">
                                        <Badge tone={entry.is_published ? "success" : "neutral"} size="sm">
                                            {entry.is_published ? t.published : t.draft}
                                        </Badge>
                                        <span className="font-medium text-brand-700">
                                            {t.types[subsectionForContentType(entry.content_type)]}
                                        </span>
                                        {entry.event_date && (
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays className="size-3.5" aria-hidden="true" />
                                                {dateFormat.format(new Date(`${entry.event_date}T00:00:00`))}
                                            </span>
                                        )}
                                        {entry.photos.length > 0 && (
                                            <span>{t.photoCount(entry.photos.length)}</span>
                                        )}
                                        {entry.audio_url && (
                                            <span className="inline-flex items-center gap-1">
                                                <Music2 className="size-3.5" aria-hidden="true" />
                                                {t.hasAudio}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDraft(toDraft(entry))}
                                        disabled={pending}
                                    >
                                        <Pencil aria-hidden="true" />
                                        {t.edit}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => togglePublished(entry)}
                                        disabled={pending}
                                    >
                                        {entry.is_published ? (
                                            <EyeOff aria-hidden="true" />
                                        ) : (
                                            <Eye aria-hidden="true" />
                                        )}
                                        {entry.is_published ? t.unpublish : t.publish}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmingDelete(entry.id)}
                                        disabled={pending}
                                        className="flex size-9 items-center justify-center rounded-lg text-danger transition-ui hover:bg-danger-soft"
                                        aria-label={t.remove}
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>

                                {confirmingDelete === entry.id && (
                                    <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-line bg-danger-soft px-4 py-3">
                                        <p className="text-sm text-danger">
                                            {t.confirmDelete(entry.heading)}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setConfirmingDelete(null)}
                                            >
                                                {t.cancel}
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="danger"
                                                disabled={pending}
                                                onClick={() => remove(entry)}
                                            >
                                                {t.remove}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

function Card({
    title,
    hint,
    children,
}: {
    title: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-semibold text-ink-900">{title}</h3>
            {hint && <p className="mt-1 text-sm text-ink-500">{hint}</p>}
            <div className="mt-5 space-y-5">{children}</div>
        </section>
    );
}

function LinkField({
    label,
    value,
    onChange,
    placeholder,
    helper,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    helper?: string;
}) {
    return (
        <Field label={label} helper={helper}>
            {(props) => (
                <Input
                    {...props}
                    type="url"
                    inputMode="url"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoCapitalize="none"
                    spellCheck={false}
                />
            )}
        </Field>
    );
}

/** The one-page post form. Replaces the list while open. */
function PostForm({
    draft,
    patch,
    section,
    pending,
    t,
    onCancel,
    onSave,
}: {
    draft: Draft;
    patch: (changes: Partial<Draft>) => void;
    section: ArchiveSection;
    pending: boolean;
    t: Copy;
    onCancel: () => void;
    onSave: (publish: boolean) => void;
}) {
    const active = subsectionForContentType(draft.content_type);
    const isCoverage = active === "media_coverage";
    // A link we cannot frame still works as a link out, so this is a note
    // rather than a validation error.
    const linkNotEmbeddable =
        draft.video_url.trim().length > 0 && !toEmbedUrl(draft.video_url.trim());
    // Open the extras when an older post already has something in them.
    const moreInUse = Boolean(
        draft.category ||
            draft.attachments.length ||
            draft.press_release_url ||
            draft.hd_photos_url ||
            draft.raw_video_url ||
            (!isCoverage && (draft.source_name || draft.source_url))
    );

    const sourceFields = (
        <>
            <BilingualField
                label={t.sourceName}
                value={draft.source_name}
                onChange={(v) => patch({ source_name: v })}
                valueEn={draft.source_name_en}
                onChangeEn={(v) => patch({ source_name_en: v })}
                placeholder={t.sourceNamePlaceholder}
            />
            <LinkField
                label={t.sourceUrl}
                value={draft.source_url}
                onChange={(value) => patch({ source_url: value })}
                placeholder="https://…"
            />
        </>
    );

    return (
        <div className="space-y-5 pb-24">
            <div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="-ms-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-600 transition-ui hover:text-brand-800"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t.back}
                </button>
                <h2 className="mt-1 text-xl tracking-tight text-ink-900">
                    {draft.id ? t.editTitle : t.newTitle}
                </h2>
            </div>

            <Card title={t.typeLabel}>
                <div className="flex flex-wrap gap-2">
                    {subsectionsBySection[section].map((option) => {
                        const selected = option === active;
                        return (
                            <button
                                key={option}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => {
                                    // Keep an older entry's exact type while its
                                    // tab stays the same (event vs news).
                                    if (!selected) {
                                        patch({ content_type: typeForSubsection[option] });
                                    }
                                }}
                                className={cn(
                                    "inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-medium transition-ui",
                                    selected
                                        ? "border-brand-800 bg-brand-800 text-white"
                                        : "border-ink-300 bg-surface text-ink-700 hover:border-brand-400 hover:text-brand-800"
                                )}
                            >
                                {t.types[option]}
                            </button>
                        );
                    })}
                </div>
            </Card>

            <Card title={t.basics}>
                <BilingualField
                    label={t.heading}
                    required
                    multiline
                    rows={2}
                    value={draft.heading}
                    onChange={(v) => patch({ heading: v })}
                    valueEn={draft.heading_en}
                    onChangeEn={(v) => patch({ heading_en: v })}
                />

                <div className="grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
                    <Field label={t.date}>
                        {(props) => (
                            <Input
                                {...props}
                                type="date"
                                value={draft.event_date}
                                onChange={(event) => patch({ event_date: event.target.value })}
                            />
                        )}
                    </Field>
                    <BilingualField
                        label={t.location}
                        value={draft.location}
                        onChange={(v) => patch({ location: v })}
                        valueEn={draft.location_en}
                        onChangeEn={(v) => patch({ location_en: v })}
                        placeholder={t.locationPlaceholder}
                    />
                </div>

                <MediaField
                    label={t.cover}
                    accept="image"
                    folder="archive"
                    value={draft.cover_image_url}
                    onChange={(url) => patch({ cover_image_url: url })}
                    helper={t.coverHelp}
                    // The drop area is 16:9 at full width — half a screen of
                    // empty box in a form meant to be short.
                    className="sm:max-w-md"
                />

                <EditorialTextField
                    label={t.body}
                    rows={8}
                    value={draft.body}
                    onChange={(v) => patch({ body: v })}
                    valueEn={draft.body_en}
                    onChangeEn={(v) => patch({ body_en: v })}
                    helper={t.bodyHelp}
                />
            </Card>

            {isCoverage && (
                <Card title={t.source} hint={t.sourceHint}>
                    {sourceFields}
                </Card>
            )}

            <Card title={t.media} hint={t.mediaHint}>
                <ArchiveGalleryEditor
                    photos={draft.photos}
                    onChange={(photos) => patch({ photos })}
                    max={MAX_ARCHIVE_PHOTOS}
                    mode="gallery"
                />

                <div className="space-y-4 border-t border-ink-200 pt-5">
                    <h4 className="text-sm font-semibold text-ink-900">{t.video}</h4>
                    <LinkField
                        label={t.videoLink}
                        value={draft.video_url}
                        onChange={(value) => patch({ video_url: value })}
                        placeholder="https://youtube.com/watch?v=…"
                    />
                    {linkNotEmbeddable && (
                        <p className="text-xs font-medium text-warning">{t.videoNotEmbeddable}</p>
                    )}
                    <MediaField
                        label={t.videoFile}
                        accept="video"
                        folder="archive"
                        value={draft.video_file_url}
                        onChange={(url) => patch({ video_file_url: url })}
                        helper={t.videoFileHelp}
                        className="sm:max-w-md"
                    />
                </div>

                <div className="space-y-4 border-t border-ink-200 pt-5">
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                            <Music2 className="size-4 text-brand-700" aria-hidden="true" />
                            {t.audio}
                        </h4>
                        <p className="mt-1 text-sm text-ink-500">{t.audioHelp}</p>
                    </div>
                    <MediaField
                        label={t.audioUpload}
                        accept="audio"
                        folder="audio"
                        value={
                            draft.audio_url.includes("/storage/v1/object/public/media/audio/")
                                ? draft.audio_url
                                : null
                        }
                        onChange={(url) => patch({ audio_url: url ?? "" })}
                        helper={t.audioUploadHelp}
                    />
                    <LinkField
                        label={t.audioLink}
                        value={draft.audio_url}
                        onChange={(value) => patch({ audio_url: value })}
                        placeholder="https://…/audio.mp3"
                    />
                </div>
            </Card>

            <details
                open={moreInUse || undefined}
                className="group rounded-xl border border-ink-200 bg-surface shadow-xs"
            >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                    <span>
                        <span className="block text-base font-semibold text-ink-900">{t.more}</span>
                        <span className="mt-1 block text-sm text-ink-500">{t.moreHint}</span>
                    </span>
                    <ChevronDown
                        className="size-5 shrink-0 text-ink-500 transition-ui group-open:rotate-180"
                        aria-hidden="true"
                    />
                </summary>

                <div className="space-y-6 border-t border-ink-200 p-5 sm:p-6">
                    <BilingualField
                        label={t.category}
                        value={draft.category}
                        onChange={(v) => patch({ category: v })}
                        valueEn={draft.category_en}
                        onChangeEn={(v) => patch({ category_en: v })}
                        placeholder={t.categoryPlaceholder}
                        helper={t.categoryHelp}
                    />

                    {!isCoverage && (
                        <div className="space-y-5 border-t border-ink-200 pt-6">
                            <div>
                                <h4 className="text-sm font-semibold text-ink-900">{t.source}</h4>
                                <p className="mt-1 text-sm text-ink-500">{t.sourceHint}</p>
                            </div>
                            {sourceFields}
                        </div>
                    )}

                    <div className="border-t border-ink-200 pt-6">
                        <ArchiveAttachmentsEditor
                            attachments={draft.attachments}
                            onChange={(attachments) => patch({ attachments })}
                            max={MAX_ARCHIVE_ATTACHMENTS}
                        />
                    </div>

                    {section === "press_media" && (
                        <div className="space-y-5 border-t border-ink-200 pt-6">
                            <h4 className="text-sm font-semibold text-ink-900">{t.mediaKit}</h4>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <LinkField
                                    label={t.pressFile}
                                    value={draft.press_release_url}
                                    onChange={(value) => patch({ press_release_url: value })}
                                    placeholder="https://drive.google.com/…"
                                    helper={t.httpsHelp}
                                />
                                <LinkField
                                    label={t.hdPhotos}
                                    value={draft.hd_photos_url}
                                    onChange={(value) => patch({ hd_photos_url: value })}
                                    placeholder="https://drive.google.com/…"
                                />
                                <LinkField
                                    label={t.rawVideo}
                                    value={draft.raw_video_url}
                                    onChange={(value) => patch({ raw_video_url: value })}
                                    placeholder="https://drive.google.com/…"
                                />
                            </div>
                            <DocumentPicker
                                label={t.pressUpload}
                                value={draft.press_release_url || null}
                                onChange={(url) => patch({ press_release_url: url ?? "" })}
                                folder="documents"
                            />
                        </div>
                    )}
                </div>
            </details>

            {/* Always in reach on a long form. Two buttons instead of a
                "published" checkbox: what happens next is the button's label. */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-surface/95 px-5 py-3 backdrop-blur-md lg:left-(--admin-sidebar-w)">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-2">
                    {/* Phones: three buttons wrap to two rows, and "Back to the
                        list" above already cancels. */}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={pending}
                        className="max-sm:hidden"
                    >
                        {t.cancel}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onSave(false)}
                        disabled={pending}
                    >
                        {draft.is_published ? t.moveToDrafts : t.saveDraft}
                    </Button>
                    <Button type="button" onClick={() => onSave(true)} disabled={pending}>
                        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
                        {pending ? t.saving : draft.is_published ? t.saveChanges : t.publishNow}
                    </Button>
                </div>
            </div>
        </div>
    );
}
