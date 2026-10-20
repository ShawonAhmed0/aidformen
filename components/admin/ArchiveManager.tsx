"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowDown,
    ArrowUp,
    CalendarDays,
    Eye,
    EyeOff,
    FileText,
    Images,
    ImageOff,
    Loader2,
    MapPin,
    Music2,
    Newspaper,
    Pencil,
    Play,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "sonner";

import {
    createArchiveEntry,
    deleteArchiveEntry,
    reorderArchiveEntries,
    toggleArchivePublished,
    updateArchiveEntry,
} from "@/lib/actions/archive";
import { toEmbedUrl } from "@/lib/embed";
import {
    archiveCover,
    archiveEventStatuses,
    archiveKinds,
    archiveSections,
    archiveSlugFromTitle,
    isArchiveSlug,
    MAX_ARCHIVE_PHOTOS,
    type ArchiveContentType,
    type ArchiveEntry,
    type ArchiveEventStatus,
    type ArchiveKind,
    type ArchiveSection,
} from "@/lib/types/archive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BilingualField } from "./BilingualField";
import { MediaField } from "./MediaField";
import { DocumentPicker } from "./DocumentPicker";
import { ArchiveGalleryEditor, type GalleryPhoto } from "./ArchiveGalleryEditor";
import { cn } from "@/lib/utils";

const s = (v: string | null | undefined) => v ?? "";

/** What each kind is for, so the choice is not a guess. */
const kindInfo: Record<ArchiveKind, { label: string; description: string }> = {
    article: {
        label: "লেখা / রিপোর্ট",
        description: "প্রেস রিলিজ, সংবাদ, কেস স্টাডি বা রিপোর্টের লেখা।",
    },
    photo: {
        label: "ছবির আর্কাইভ",
        description: "একটি ঘটনার আলোকচিত্র সংকলন — শিরোনাম, বিবরণ ও গ্যালারি।",
    },
    video: {
        label: "ভিডিও আর্কাইভ",
        description: "ভিডিও প্রিভিউ বা প্রকাশিত ভিডিওর লিঙ্কসহ একটি এন্ট্রি।",
    },
    audio: {
        label: "অডিও আর্কাইভ",
        description: "বক্তব্য, সাক্ষাৎকার বা সংবাদমাধ্যমের জন্য অডিও ক্লিপ।",
    },
};

const sectionInfo: Record<ArchiveSection, { label: string; description: string }> = {
    press_media: {
        label: "Press & Media Center",
        description: "নিজস্ব ইভেন্ট, প্রেস রিলিজ এবং সাংবাদিকদের মিডিয়া কিট।",
    },
    news_archive: {
        label: "News Archive & Documentation",
        description: "বাইরের সংবাদ, পুরুষ অধিকার আর্কাইভ, কেস স্টাডি ও রিপোর্ট।",
    },
};

const contentTypeLabels: Record<ArchiveContentType, string> = {
    event: "ইভেন্ট / কর্মসূচি",
    press_release: "প্রেস রিলিজ",
    media_coverage: "মিডিয়া কভারেজ",
    mens_rights_news: "পুরুষ অধিকার সংবাদ",
    case_study: "কেস স্টাডি",
    report: "রিপোর্ট / গবেষণা",
};

const eventStatusLabels: Record<ArchiveEventStatus, string> = {
    upcoming: "আসন্ন",
    completed: "সম্পন্ন",
};

const contentTypesBySection: Record<ArchiveSection, readonly ArchiveContentType[]> = {
    press_media: ["event", "press_release"],
    news_archive: [
        "media_coverage",
        "mens_rights_news",
        "case_study",
        "report",
    ],
};

type Draft = {
    id: string | null;
    slug: string;
    kind: ArchiveKind;
    section: ArchiveSection;
    content_type: ArchiveContentType;
    event_status: ArchiveEventStatus | "";
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
};

const emptyDraft = (kind: ArchiveKind): Draft => ({
    id: null,
    slug: "",
    kind,
    section: "press_media",
    content_type: "event",
    event_status: "upcoming",
    heading: "",
    heading_en: "",
    body: "",
    body_en: "",
    category: "",
    category_en: "",
    location: "",
    location_en: "",
    event_date: "",
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
    // New editorial records start as drafts. Publishing is an explicit choice
    // after the required title and primary media have been checked.
    is_published: false,
    photos: [],
});

const toDraft = (entry: ArchiveEntry): Draft => ({
    id: entry.id,
    slug: entry.slug,
    kind: entry.kind,
    section: entry.section,
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
});

export function ArchiveManager({ entries }: { entries: ArchiveEntry[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

    // Local copy so arrow reordering feels instant; resynced whenever the server
    // sends a different set of rows.
    const [rows, setRows] = useState(entries);
    const [renderedIds, setRenderedIds] = useState(entries.map((e) => e.id).join(","));
    const incoming = entries.map((e) => e.id).join(",");
    if (renderedIds !== incoming) {
        setRenderedIds(incoming);
        setRows(entries);
    }

    const patch = (changes: Partial<Draft>) =>
        setDraft((d) => (d ? { ...d, ...changes } : d));

    const move = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= rows.length) return;

        const next = [...rows];
        [next[index], next[target]] = [next[target], next[index]];
        setRows(next);

        const body = new FormData();
        next.forEach((entry) => body.append("ids", entry.id));

        startTransition(async () => {
            const result = await reorderArchiveEntries(body);
            if (!result.ok) toast.error(result.error);
            router.refresh();
        });
    };

    const togglePublished = (entry: ArchiveEntry) => {
        if (!entry.is_published) {
            const error = publicationError(entry);
            if (error) {
                toast.error(error);
                return;
            }
        }

        const body = new FormData();
        body.append("id", entry.id);
        body.append("is_published", String(!entry.is_published));

        startTransition(async () => {
            const result = await toggleArchivePublished(body);
            if (!result.ok) toast.error(result.error);
            router.refresh();
        });
    };

    const save = () => {
        if (!draft) return;
        if (!draft.heading.trim()) {
            toast.error("শিরোনাম প্রয়োজন।");
            return;
        }
        const slug = draft.id
            ? draft.slug.trim()
            : archiveSlugFromTitle(draft.heading_en.trim() || draft.heading);
        if (!isArchiveSlug(slug)) {
            toast.error(
                "ইউআরএল স্লাগে শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন দিন।"
            );
            return;
        }
        if (draft.is_published) {
            const error = publicationError(draft);
            if (error) {
                toast.error(error);
                return;
            }
        }

        const body = new FormData();
        if (draft.id) body.append("id", draft.id);
        body.append("slug", slug);
        body.append("kind", draft.kind);
        body.append("section", draft.section);
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

        // Both kinds' media is always submitted, so switching kind while editing
        // and switching back does not silently discard the other one's media.
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

        body.append("is_published", String(draft.is_published));

        startTransition(async () => {
            const result = draft.id
                ? await updateArchiveEntry(body)
                : await createArchiveEntry(body);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            toast.success(draft.id ? "আর্কাইভ আপডেট হয়েছে।" : "নতুন আর্কাইভ যোগ হয়েছে।");
            setDraft(null);
            router.refresh();
        });
    };

    // A link we cannot frame still works as a link out, so this is a note rather
    // than a validation error.
    const linkNotEmbeddable =
        draft?.kind === "video" &&
        draft.video_url.trim().length > 0 &&
        !toEmbedUrl(draft.video_url.trim());
    const draftPublishError = draft ? publicationError(draft) : null;

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-ink-900">
                            আর্কাইভ এন্ট্রি
                        </h2>
                        <p className="mt-1 text-sm text-ink-500">
                            প্রেস, মিডিয়া ও নিউজ আর্কাইভের তালিকা। বড় Raw ফাইল সাইটে না তুলে
                            Drive/Cloud-এর HTTPS লিঙ্ক দিন।
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {archiveKinds.map((kind) => (
                            <Button
                                key={kind}
                                type="button"
                                size="sm"
                                variant={kind === "article" ? "primary" : "outline"}
                                onClick={() => setDraft(emptyDraft(kind))}
                                disabled={pending}
                            >
                                <Plus aria-hidden="true" />
                                {kindInfo[kind].label}
                            </Button>
                        ))}
                    </div>
                </div>

                {rows.length === 0 ? (
                    <p className="mt-6 rounded-xl border border-dashed border-ink-300 px-6 py-12 text-center text-sm text-ink-500">
                        এখনো কোনো আর্কাইভ যোগ করা হয়নি।
                    </p>
                ) : (
                    <ul className="mt-6 space-y-3">
                        {rows.map((entry, index) => {
                            const cover = archiveCover(entry);
                            const isVideo = entry.kind === "video";
                            const isAudio = entry.kind === "audio";
                            const missingVideo =
                                isVideo && !entry.video_url && !entry.video_file_url;
                            const missingAudio = isAudio && !entry.audio_url;

                            return (
                                <li
                                    key={entry.id}
                                    className={cn(
                                        "flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 p-3",
                                        !entry.is_published && "bg-surface-sunken"
                                    )}
                                >
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
                                            <ImageOff
                                                className="size-5 text-brand-600"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-ink-900">
                                            {entry.heading}
                                        </p>

                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                                            <span className="inline-flex items-center gap-1 font-medium text-brand-700">
                                                {isVideo ? (
                                                    <Play
                                                        className="size-3.5 fill-current"
                                                        aria-hidden="true"
                                                    />
                                                ) : isAudio ? (
                                                    <Music2
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                ) : entry.kind === "article" ? (
                                                    <FileText
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <Images
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                {entry.kind === "photo"
                                                    ? `${entry.photos.length} ছবি`
                                                    : kindInfo[entry.kind].label}
                                            </span>

                                            <span>{sectionInfo[entry.section].label}</span>

                                            <span>
                                                {contentTypeLabels[entry.content_type]}
                                            </span>

                                            {entry.category && <span>{entry.category}</span>}

                                            {entry.event_date && (
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    {entry.event_date}
                                                </span>
                                            )}

                                            {entry.location && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    {entry.location}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {!entry.is_published && (
                                                <Badge tone="neutral" size="sm">
                                                    অপ্রকাশিত
                                                </Badge>
                                            )}
                                            {missingVideo && (
                                                <Badge tone="warning" size="sm">
                                                    ভিডিও নেই
                                                </Badge>
                                            )}
                                            {missingAudio && (
                                                <Badge tone="warning" size="sm">
                                                    অডিও নেই
                                                </Badge>
                                            )}
                                            {entry.kind === "photo" &&
                                                entry.photos.length === 0 && (
                                                <Badge tone="warning" size="sm">
                                                    ছবি নেই
                                                </Badge>
                                                )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => move(index, -1)}
                                            disabled={pending || index === 0}
                                            className={iconButton}
                                            aria-label="উপরে সরান"
                                        >
                                            <ArrowUp className="size-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => move(index, 1)}
                                            disabled={pending || index === rows.length - 1}
                                            className={iconButton}
                                            aria-label="নিচে সরান"
                                        >
                                            <ArrowDown className="size-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => togglePublished(entry)}
                                            disabled={pending}
                                            className={iconButton}
                                            aria-label={
                                                entry.is_published
                                                    ? "সাইট থেকে লুকান"
                                                    : "সাইটে দেখান"
                                            }
                                        >
                                            {entry.is_published ? (
                                                <Eye className="size-4" />
                                            ) : (
                                                <EyeOff className="size-4" />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDraft(toDraft(entry))}
                                            disabled={pending}
                                            className={iconButton}
                                            aria-label="সম্পাদনা করুন"
                                        >
                                            <Pencil className="size-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setConfirmingDelete(entry.id)}
                                            disabled={pending}
                                            className="flex size-9 items-center justify-center rounded-lg text-danger transition-ui hover:bg-danger-soft"
                                            aria-label="মুছে ফেলুন"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    {confirmingDelete === entry.id && (
                                        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-line bg-danger-soft px-4 py-3">
                                            <p className="text-sm text-danger">
                                                “{entry.heading}” এবং এর সংযুক্ত মিডিয়া স্থায়ীভাবে
                                                মুছে যাবে।
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setConfirmingDelete(null)}
                                                >
                                                    বাতিল
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="danger"
                                                    disabled={pending}
                                                    onClick={() => {
                                                        const body = new FormData();
                                                        body.append("id", entry.id);
                                                        setConfirmingDelete(null);
                                                        startTransition(async () => {
                                                            const r =
                                                                await deleteArchiveEntry(body);
                                                            if (!r.ok) toast.error(r.error);
                                                            else
                                                                toast.success(
                                                                    "আর্কাইভ মুছে ফেলা হয়েছে।"
                                                                );
                                                            router.refresh();
                                                        });
                                                    }}
                                                >
                                                    মুছে ফেলুন
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

            {draft && (
                <div
                    className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-ink-950/60 p-4 backdrop-blur-sm"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setDraft(null);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={draft.id ? "আর্কাইভ সম্পাদনা" : "নতুন আর্কাইভ"}
                        className="my-8 w-full max-w-4xl rounded-2xl bg-surface p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg text-ink-900">
                                {draft.id ? "আর্কাইভ সম্পাদনা" : "নতুন আর্কাইভ"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setDraft(null)}
                                className="flex size-9 items-center justify-center rounded-full text-ink-500 transition-ui hover:bg-ink-100"
                                aria-label="বন্ধ করুন"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-6">
                            <section className="space-y-5 rounded-xl border border-ink-200 p-5">
                                <div>
                                    <h4 className="font-semibold text-ink-900">
                                        কোথায় ও কীভাবে দেখাবে
                                    </h4>
                                    <p className="mt-1 text-sm text-ink-500">
                                        সঠিক সেকশন ও কনটেন্ট টাইপ দিলে ভিজিটর সহজে ফিল্টার
                                        করতে পারবেন।
                                    </p>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    {archiveSections.map((section) => {
                                        const active = draft.section === section;
                                        return (
                                            <button
                                                key={section}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => {
                                                    const allowed =
                                                        contentTypesBySection[section];
                                                    patch({
                                                        section,
                                                        content_type: allowed.includes(
                                                            draft.content_type
                                                        )
                                                            ? draft.content_type
                                                            : allowed[0],
                                                        event_status:
                                                            section === "press_media"
                                                                ? draft.event_status || "upcoming"
                                                                : "",
                                                    });
                                                }}
                                                className={cn(
                                                    "rounded-xl border p-4 text-left transition-ui",
                                                    active
                                                        ? "border-brand-700 bg-brand-50"
                                                        : "border-ink-200 hover:border-brand-300"
                                                )}
                                            >
                                                <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                                                    {section === "press_media" ? (
                                                        <Newspaper
                                                            className="size-4 text-brand-700"
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <FileText
                                                            className="size-4 text-brand-700"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    {sectionInfo[section].label}
                                                </span>
                                                <span className="mt-1 block text-xs leading-5 text-ink-500">
                                                    {sectionInfo[section].description}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label="কনটেন্ট টাইপ" required>
                                        {(props) => (
                                            <select
                                                {...props}
                                                value={draft.content_type}
                                                onChange={(event) =>
                                                    patch({
                                                        content_type: event.target
                                                            .value as ArchiveContentType,
                                                        event_status:
                                                            event.target.value === "event"
                                                                ? draft.event_status ||
                                                                  "upcoming"
                                                                : "",
                                                    })
                                                }
                                                className={cn(selectClass, props.className)}
                                            >
                                                {contentTypesBySection[draft.section].map(
                                                    (type) => (
                                                        <option key={type} value={type}>
                                                            {contentTypeLabels[type]}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        )}
                                    </Field>

                                    {draft.content_type === "event" && (
                                        <Field label="ইভেন্টের অবস্থা" required>
                                            {(props) => (
                                                <select
                                                    {...props}
                                                    value={draft.event_status}
                                                    onChange={(event) =>
                                                        patch({
                                                            event_status: event.target
                                                                .value as ArchiveEventStatus,
                                                        })
                                                    }
                                                    className={cn(
                                                        selectClass,
                                                        props.className
                                                    )}
                                                >
                                                    {archiveEventStatuses.map((status) => (
                                                        <option key={status} value={status}>
                                                            {eventStatusLabels[status]}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </Field>
                                    )}
                                </div>

                                <Field
                                    label="ইউনিক URL স্লাগ (স্বয়ংক্রিয়)"
                                    helper={
                                        draft.id
                                            ? "প্রকাশিত URL স্থির রাখতে edit করার সময় slug অপরিবর্তিত থাকে।"
                                            : "বাংলা বা English শিরোনাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হবে।"
                                    }
                                >
                                    {(props) => (
                                        <Input
                                            {...props}
                                            value={draft.slug}
                                            readOnly
                                            placeholder="শিরোনাম লিখলে তৈরি হবে"
                                            autoCapitalize="none"
                                            spellCheck={false}
                                            className={cn(
                                                props.className,
                                                "bg-ink-50 text-ink-600"
                                            )}
                                        />
                                    )}
                                </Field>

                                <div>
                                    <span className="flex text-sm font-medium text-ink-700">
                                        উপস্থাপনার ধরন
                                    </span>
                                    <div
                                        role="tablist"
                                        aria-label="আর্কাইভের ধরন"
                                        className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4"
                                    >
                                        {archiveKinds.map((kind) => {
                                            const active = draft.kind === kind;
                                            return (
                                                <button
                                                    key={kind}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={active}
                                                    onClick={() => patch({ kind })}
                                                    className={cn(
                                                        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-ui",
                                                        active
                                                            ? "border-brand-800 bg-brand-800 text-white"
                                                            : "border-ink-300 bg-surface text-ink-700 hover:border-brand-400 hover:text-brand-800"
                                                    )}
                                                >
                                                    {kind === "video" ? (
                                                        <Play
                                                            className="size-4 fill-current"
                                                            aria-hidden="true"
                                                        />
                                                    ) : kind === "audio" ? (
                                                        <Music2
                                                            className="size-4"
                                                            aria-hidden="true"
                                                        />
                                                    ) : kind === "article" ? (
                                                        <FileText
                                                            className="size-4"
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <Images
                                                            className="size-4"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    {kindInfo[kind].label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-2 text-xs text-ink-500">
                                        {kindInfo[draft.kind].description}
                                    </p>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-ink-200 p-5">
                                <h4 className="font-semibold text-ink-900">
                                    মূল তথ্য ও থাম্বনেইল
                                </h4>

                                <MediaField
                                    label="কভার / থাম্বনেইল"
                                    accept="image"
                                    folder="archive"
                                    value={draft.cover_image_url}
                                    onChange={(url) => patch({ cover_image_url: url })}
                                    helper={
                                        draft.kind === "photo"
                                            ? "না দিলে গ্যালারির প্রথম ছবিটি কভার হবে।"
                                            : "টাইমলাইন ও সামাজিক শেয়ারে থাম্বনেইল হিসেবে দেখাবে।"
                                    }
                                />

                                <BilingualField
                                    label="শিরোনাম"
                                    required
                                    multiline
                                    rows={2}
                                    value={draft.heading}
                                    onChange={(v) => {
                                        const slugTitle = draft.heading_en.trim() || v.trim();
                                        patch({
                                            heading: v,
                                            ...(!draft.id
                                                ? {
                                                      slug: slugTitle
                                                          ? archiveSlugFromTitle(slugTitle)
                                                          : "",
                                                  }
                                                : {}),
                                        });
                                    }}
                                    valueEn={draft.heading_en}
                                    onChangeEn={(v) => {
                                        const slugTitle = v.trim() || draft.heading.trim();
                                        patch({
                                            heading_en: v,
                                            ...(!draft.id
                                                ? {
                                                      slug: slugTitle
                                                          ? archiveSlugFromTitle(slugTitle)
                                                          : "",
                                                  }
                                                : {}),
                                        });
                                    }}
                                />

                                <BilingualField
                                    label="বিবরণ / সংক্ষিপ্ত সারসংক্ষেপ"
                                    multiline
                                    rows={5}
                                    value={draft.body}
                                    onChange={(v) => patch({ body: v })}
                                    valueEn={draft.body_en}
                                    onChangeEn={(v) => patch({ body_en: v })}
                                    helper="ডিটেইল পেজে শিরোনামের নিচে দেখাবে। অনুচ্ছেদ ভাঙা রাখা যাবে।"
                                />

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <BilingualField
                                        label="ক্যাটাগরি"
                                        value={draft.category}
                                        onChange={(v) => patch({ category: v })}
                                        valueEn={draft.category_en}
                                        onChangeEn={(v) => patch({ category_en: v })}
                                        placeholder="যেমন: সংবাদ সম্মেলন"
                                        helper="সাল ও ক্যাটাগরি ফিল্টারে ব্যবহার হবে।"
                                    />

                                    <Field
                                        label="তারিখ"
                                        helper="সালভিত্তিক টাইমলাইন এখান থেকেই তৈরি হবে।"
                                    >
                                        {(props) => (
                                            <Input
                                                {...props}
                                                type="date"
                                                value={draft.event_date}
                                                onChange={(e) =>
                                                    patch({
                                                        event_date: e.target.value,
                                                    })
                                                }
                                            />
                                        )}
                                    </Field>
                                </div>

                                <BilingualField
                                    label="স্থান"
                                    value={draft.location}
                                    onChange={(v) => patch({ location: v })}
                                    valueEn={draft.location_en}
                                    onChangeEn={(v) => patch({ location_en: v })}
                                />
                            </section>

                            {draft.section === "press_media" && (
                                <section className="space-y-5 rounded-xl border border-brand-200 bg-brand-50/40 p-5">
                                    <div>
                                        <h4 className="font-semibold text-ink-900">
                                            ইভেন্ট, প্রেস রিলিজ ও মিডিয়া কিট
                                        </h4>
                                        <p className="mt-1 text-sm leading-6 text-ink-600">
                                            HD ছবি ও Raw ভিডিও সাইটে আপলোড করবেন না। Google
                                            Drive/Cloud-এর public HTTPS folder link দিলে সাইট
                                            দ্রুত ও হালকা থাকবে।
                                        </p>
                                    </div>

                                    <BilingualField
                                        label="ইভেন্ট-পূর্ব নোটিশ"
                                        multiline
                                        rows={5}
                                        value={draft.notice_body}
                                        onChange={(v) => patch({ notice_body: v })}
                                        valueEn={draft.notice_body_en}
                                        onChangeEn={(v) =>
                                            patch({ notice_body_en: v })
                                        }
                                        helper="আসন্ন কর্মসূচির সময়, উদ্দেশ্য ও সাংবাদিকদের নির্দেশনা দিন।"
                                    />

                                    <BilingualField
                                        label="ইভেন্ট-পরবর্তী সারসংক্ষেপ"
                                        multiline
                                        rows={6}
                                        value={draft.post_event_body}
                                        onChange={(v) =>
                                            patch({ post_event_body: v })
                                        }
                                        valueEn={draft.post_event_body_en}
                                        onChangeEn={(v) =>
                                            patch({ post_event_body_en: v })
                                        }
                                    />

                                    <BilingualField
                                        label="প্রেস রিলিজ — অনলাইনে পড়ার লেখা"
                                        multiline
                                        rows={10}
                                        value={draft.press_release_body}
                                        onChange={(v) =>
                                            patch({ press_release_body: v })
                                        }
                                        valueEn={draft.press_release_body_en}
                                        onChangeEn={(v) =>
                                            patch({ press_release_body_en: v })
                                        }
                                    />

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <HttpsField
                                            label="প্রেস রিলিজ PDF/Doc লিঙ্ক"
                                            value={draft.press_release_url}
                                            onChange={(value) =>
                                                patch({ press_release_url: value })
                                            }
                                            placeholder="https://drive.google.com/…"
                                        />
                                        <HttpsField
                                            label="HD প্রেস ফটো ফোল্ডার"
                                            value={draft.hd_photos_url}
                                            onChange={(value) =>
                                                patch({ hd_photos_url: value })
                                            }
                                            placeholder="https://drive.google.com/…"
                                        />
                                        <HttpsField
                                            label="Raw ভিডিও ও বক্তব্য ফোল্ডার"
                                            value={draft.raw_video_url}
                                            onChange={(value) =>
                                                patch({ raw_video_url: value })
                                            }
                                            placeholder="https://drive.google.com/…"
                                        />
                                    </div>

                                    <DocumentPicker
                                        label="অথবা প্রেস রিলিজ PDF আপলোড করুন"
                                        value={draft.press_release_url || null}
                                        onChange={(url) =>
                                            patch({ press_release_url: url ?? "" })
                                        }
                                        folder="documents"
                                        helper="ছোট PDF (সর্বোচ্চ ১০ MB) সাইটের মিডিয়া স্টোরেজে রাখা যাবে; বড় ফাইলের জন্য Drive/Cloud লিঙ্ক ব্যবহার করুন।"
                                    />

                                    <p className="rounded-lg border border-brand-200 bg-surface px-4 py-3 text-sm leading-6 text-ink-700">
                                        সাংবাদিকদের জন্য প্রকাশিত পেজে “Media-ready &amp;
                                        Royalty Free for Public Use” নোটিশ দেখানো হবে। শেয়ার
                                        করার আগে Drive/Cloud ফোল্ডারটি “Anyone with the link
                                        can view/download” করুন।
                                    </p>
                                </section>
                            )}

                            {draft.section === "news_archive" && (
                                <section className="space-y-5 rounded-xl border border-ink-200 p-5">
                                    <div>
                                        <h4 className="font-semibold text-ink-900">
                                            মূল সংবাদ / তথ্যসূত্র (ঐচ্ছিক)
                                        </h4>
                                        <p className="mt-1 text-sm text-ink-500">
                                            প্রকাশকের নাম বা মূল প্রতিবেদনের লিঙ্ক থাকলে যোগ করতে
                                            পারেন; publish করার জন্য এগুলো বাধ্যতামূলক নয়।
                                        </p>
                                    </div>
                                    <BilingualField
                                        label="উৎস / প্রকাশকের নাম (ঐচ্ছিক)"
                                        value={draft.source_name}
                                        onChange={(v) => patch({ source_name: v })}
                                        valueEn={draft.source_name_en}
                                        onChangeEn={(v) =>
                                            patch({ source_name_en: v })
                                        }
                                        placeholder="যেমন: প্রথম আলো"
                                    />
                                    <HttpsField
                                        label="মূল সংবাদ / উৎসের লিঙ্ক (ঐচ্ছিক)"
                                        value={draft.source_url}
                                        onChange={(value) =>
                                            patch({ source_url: value })
                                        }
                                        placeholder="https://…"
                                        helper="ঐচ্ছিক — লিঙ্ক দিলে নিরাপত্তার জন্য https:// ব্যবহার করুন।"
                                    />
                                </section>
                            )}

                            {draft.kind === "photo" && (
                                <section className="rounded-xl border border-ink-200 p-5">
                                    <ArchiveGalleryEditor
                                        photos={draft.photos}
                                        onChange={(photos) => patch({ photos })}
                                        max={MAX_ARCHIVE_PHOTOS}
                                    />
                                </section>
                            )}

                            {draft.kind === "video" && (
                                <section className="space-y-5 rounded-xl border border-ink-200 bg-surface-sunken p-5">
                                    <div>
                                        <h4 className="font-semibold text-ink-900">
                                            ভিডিও প্রিভিউ / প্রকাশিত ভিডিও
                                        </h4>
                                        <p className="mt-1 text-sm leading-6 text-ink-600">
                                            দ্রুত লোডিংয়ের জন্য YouTube/Facebook-এর HTTPS লিঙ্ক
                                            অগ্রাধিকার দিন। Raw বা বড় ভিডিও উপরের Cloud folder
                                            link-এ রাখুন।
                                        </p>
                                    </div>

                                    <HttpsField
                                        label="ভিডিওর লিঙ্ক"
                                        value={draft.video_url}
                                        onChange={(value) =>
                                            patch({ video_url: value })
                                        }
                                        placeholder="https://youtube.com/watch?v=…"
                                        helper="YouTube বা Facebook লিঙ্ক পাতার ভেতর চালানোর চেষ্টা করা হবে।"
                                    />

                                    {linkNotEmbeddable && (
                                        <p className="text-xs font-medium text-warning">
                                            এই লিঙ্কটি পাতার ভেতরে চালানো যাবে না — দর্শক নতুন
                                            ট্যাবে খুলে দেখতে পারবেন।
                                        </p>
                                    )}

                                    <MediaField
                                        label="ছোট ভিডিও ফাইল (ঐচ্ছিক)"
                                        accept="video"
                                        folder="archive"
                                        value={draft.video_file_url}
                                        onChange={(url) =>
                                            patch({ video_file_url: url })
                                        }
                                        helper="সর্বোচ্চ ৫০ MB। Raw/HD ফুটেজ এখানে নয়—Cloud link ব্যবহার করুন।"
                                    />
                                </section>
                            )}

                            {draft.kind === "audio" && (
                                <section className="space-y-5 rounded-xl border border-ink-200 bg-surface-sunken p-5">
                                    <div>
                                        <h4 className="font-semibold text-ink-900">
                                            অডিও বক্তব্য / সাক্ষাৎকার
                                        </h4>
                                        <p className="mt-1 text-sm text-ink-600">
                                            একটি public HTTPS অডিও লিঙ্ক দিন, অথবা সর্বোচ্চ ২৫ MB
                                            ফাইল আপলোড করুন। আপলোড করলে লিঙ্কটি প্রতিস্থাপিত হবে।
                                        </p>
                                    </div>

                                    <HttpsField
                                        label="অডিওর HTTPS লিঙ্ক"
                                        value={draft.audio_url}
                                        onChange={(value) =>
                                            patch({ audio_url: value })
                                        }
                                        placeholder="https://…/audio.mp3"
                                    />

                                    <MediaField
                                        label="অথবা অডিও আপলোড"
                                        accept="audio"
                                        folder="audio"
                                        value={
                                            draft.audio_url.includes(
                                                "/storage/v1/object/public/media/audio/"
                                            )
                                                ? draft.audio_url
                                                : null
                                        }
                                        onChange={(url) =>
                                            patch({ audio_url: url ?? "" })
                                        }
                                        helper="MP3, M4A, OGG বা WAV · সর্বোচ্চ ২৫ MB"
                                    />
                                </section>
                            )}

                            <div className="rounded-xl border border-ink-200 bg-surface-sunken p-4">
                                <label className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
                                    <input
                                        type="checkbox"
                                        checked={draft.is_published}
                                        disabled={
                                            !draft.is_published && Boolean(draftPublishError)
                                        }
                                        onChange={(e) =>
                                            patch({ is_published: e.target.checked })
                                        }
                                        className="size-4 rounded border-ink-300 accent-brand-800 disabled:opacity-50"
                                    />
                                    ওয়েবসাইটে প্রকাশ করুন
                                </label>
                                <p
                                    className={cn(
                                        "mt-2 text-xs leading-5",
                                        draftPublishError
                                            ? "text-warning"
                                            : "text-success"
                                    )}
                                >
                                    {draftPublishError
                                        ? `এখন এটি খসড়া হিসেবে সংরক্ষণ করুন। প্রকাশ করতে: ${draftPublishError}`
                                        : "প্রকাশের প্রয়োজনীয় তথ্য প্রস্তুত। নতুন এন্ট্রি ডিফল্টভাবে খসড়া থাকে; যাচাই শেষে এই অপশন চালু করুন।"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-7 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDraft(null)}
                            >
                                বাতিল
                            </Button>
                            <Button type="button" onClick={save} disabled={pending}>
                                {pending && (
                                    <Loader2 className="animate-spin" aria-hidden="true" />
                                )}
                                সংরক্ষণ করুন
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const iconButton = cn(
    "flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui",
    "hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
);

const selectClass = cn(
    "h-11 w-full rounded-lg border border-input bg-surface px-3.5 text-base text-foreground",
    "transition-ui outline-none hover:border-ink-400 focus:border-brand-600",
    "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:opacity-60"
);

type PublishableEntry = Pick<
    ArchiveEntry,
    | "kind"
    | "cover_image_url"
    | "video_url"
    | "video_file_url"
    | "audio_url"
> & {
    heading: string;
    slug: string;
    photos: readonly unknown[];
};

function publicationError(entry: PublishableEntry): string | null {
    if (!entry.heading.trim()) return "শিরোনাম যোগ করুন।";
    if (!isArchiveSlug(entry.slug.trim())) return "সঠিক ইউনিক URL স্লাগ দিন।";
    if (
        entry.kind === "photo" &&
        !entry.cover_image_url &&
        entry.photos.length === 0
    ) {
        return "ছবির এন্ট্রিতে অন্তত একটি কভার বা গ্যালারির ছবি দিন।";
    }
    if (entry.kind === "video" && !entry.video_url && !entry.video_file_url) {
        return "ভিডিও এন্ট্রিতে ভিডিওর লিঙ্ক বা ছোট ভিডিও ফাইল দিন।";
    }
    if (entry.kind === "audio" && !entry.audio_url) {
        return "অডিও এন্ট্রিতে HTTPS লিঙ্ক বা অডিও ফাইল দিন।";
    }
    return null;
}

function HttpsField({
    label,
    value,
    onChange,
    placeholder,
    helper = "নিরাপদ HTTPS (https://) লিঙ্ক ব্যবহার করুন।",
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
                />
            )}
        </Field>
    );
}
