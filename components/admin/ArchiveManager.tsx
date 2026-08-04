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
    Images,
    ImageOff,
    Loader2,
    MapPin,
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
    archiveKinds,
    MAX_ARCHIVE_PHOTOS,
    type ArchiveEntry,
    type ArchiveKind,
} from "@/lib/types/archive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BilingualField } from "./BilingualField";
import { MediaField } from "./MediaField";
import { ArchiveGalleryEditor, type GalleryPhoto } from "./ArchiveGalleryEditor";
import { cn } from "@/lib/utils";

const s = (v: string | null | undefined) => v ?? "";

/** What each kind is for, so the choice is not a guess. */
const kindInfo: Record<ArchiveKind, { label: string; description: string }> = {
    photo: {
        label: "ছবির আর্কাইভ",
        description: "একটি ঘটনার আলোকচিত্র সংকলন — শিরোনাম, বিবরণ ও গ্যালারি।",
    },
    video: {
        label: "ভিডিও আর্কাইভ",
        description: "শিরোনাম, বিবরণ ও একটি ভিডিও — লিঙ্ক অথবা আপলোড করা ফাইল।",
    },
};

type Draft = {
    id: string | null;
    kind: ArchiveKind;
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
    is_published: boolean;
    photos: GalleryPhoto[];
};

const emptyDraft = (kind: ArchiveKind): Draft => ({
    id: null,
    kind,
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
    is_published: true,
    photos: [],
});

const toDraft = (entry: ArchiveEntry): Draft => ({
    id: entry.id,
    kind: entry.kind,
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

        const body = new FormData();
        if (draft.id) body.append("id", draft.id);
        body.append("kind", draft.kind);
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

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-ink-900">
                            আর্কাইভ এন্ট্রি
                        </h2>
                        <p className="mt-1 text-sm text-ink-500">
                            আর্কাইভ পাতার তালিকা। উপরের দিকের এন্ট্রিগুলো হোমপেজেও দেখাবে।
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {archiveKinds.map((kind) => (
                            <Button
                                key={kind}
                                type="button"
                                size="sm"
                                variant={kind === "photo" ? "primary" : "outline"}
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
                            const missingVideo =
                                isVideo && !entry.video_url && !entry.video_file_url;

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
                                                ) : (
                                                    <Images
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                {isVideo
                                                    ? kindInfo.video.label
                                                    : `${entry.photos.length} ছবি`}
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
                                            {!isVideo && entry.photos.length === 0 && (
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
                                                “{entry.heading}” এবং এর সব ছবি স্থায়ীভাবে মুছে
                                                যাবে।
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
                        className="my-8 w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-xl"
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

                        <div className="mt-5 space-y-5">
                            {/* Two options, so a segmented control rather than a
                                select — the choice and its consequence are both
                                visible without opening anything. */}
                            <div>
                                <span className="flex text-sm font-medium text-ink-700">
                                    ধরন
                                </span>

                                <div
                                    role="tablist"
                                    aria-label="আর্কাইভের ধরন"
                                    className="mt-2 flex gap-2"
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
                                                    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-ui",
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

                            <MediaField
                                label="কভার ছবি"
                                accept="image"
                                folder="archive"
                                value={draft.cover_image_url}
                                onChange={(url) => patch({ cover_image_url: url })}
                                helper={
                                    draft.kind === "photo"
                                        ? "না দিলে গ্যালারির প্রথম ছবিটি কভার হবে।"
                                        : "ভিডিওর থাম্বনেইল হিসেবে ব্যবহৃত হবে।"
                                }
                            />

                            <BilingualField
                                label="শিরোনাম"
                                required
                                multiline
                                rows={2}
                                value={draft.heading}
                                onChange={(v) => patch({ heading: v })}
                                valueEn={draft.heading_en}
                                onChangeEn={(v) => patch({ heading_en: v })}
                            />

                            <BilingualField
                                label="বিবরণ"
                                multiline
                                rows={5}
                                value={draft.body}
                                onChange={(v) => patch({ body: v })}
                                valueEn={draft.body_en}
                                onChangeEn={(v) => patch({ body_en: v })}
                                helper="আর্কাইভ খুললে শিরোনামের নিচে এই লেখাটি দেখাবে। অনুচ্ছেদ ভাঙা রাখা যাবে।"
                            />

                            <BilingualField
                                label="বিভাগ"
                                value={draft.category}
                                onChange={(v) => patch({ category: v })}
                                valueEn={draft.category_en}
                                onChangeEn={(v) => patch({ category_en: v })}
                                placeholder="যেমন: আয়োজন"
                                helper="আর্কাইভ পাতার ফিল্টারে এই নামেই দেখাবে।"
                            />

                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field label="তারিখ" helper="সাল অনুযায়ী ফিল্টার এখান থেকেই হয়।">
                                    {(props) => (
                                        <Input
                                            {...props}
                                            type="date"
                                            value={draft.event_date}
                                            onChange={(e) =>
                                                patch({ event_date: e.target.value })
                                            }
                                        />
                                    )}
                                </Field>

                                <BilingualField
                                    label="স্থান"
                                    value={draft.location}
                                    onChange={(v) => patch({ location: v })}
                                    valueEn={draft.location_en}
                                    onChangeEn={(v) => patch({ location_en: v })}
                                />
                            </div>

                            {draft.kind === "photo" ? (
                                <ArchiveGalleryEditor
                                    photos={draft.photos}
                                    onChange={(photos) => patch({ photos })}
                                    max={MAX_ARCHIVE_PHOTOS}
                                />
                            ) : (
                                <div className="space-y-5 rounded-xl border border-ink-200 bg-surface-sunken p-5">
                                    <p className="text-sm text-ink-600">
                                        ভিডিওর লিঙ্ক দিন অথবা ফাইল আপলোড করুন। দুটোই থাকলে
                                        আপলোড করা ফাইলটিই চলবে।
                                    </p>

                                    <Field
                                        label="ভিডিওর লিঙ্ক"
                                        helper="ইউটিউব বা ফেসবুকের লিঙ্ক পাতাতেই চলবে।"
                                    >
                                        {(props) => (
                                            <Input
                                                {...props}
                                                type="url"
                                                value={draft.video_url}
                                                onChange={(e) =>
                                                    patch({ video_url: e.target.value })
                                                }
                                                placeholder="https://youtube.com/watch?v=…"
                                            />
                                        )}
                                    </Field>

                                    {linkNotEmbeddable && (
                                        <p className="text-xs font-medium text-warning">
                                            এই লিঙ্কটি পাতার ভেতরে চালানো যাবে না — দর্শক নতুন
                                            ট্যাবে খুলে দেখতে পারবেন। ইউটিউব বা ফেসবুকের লিঙ্ক
                                            দিলে সাইটেই চলবে।
                                        </p>
                                    )}

                                    <MediaField
                                        label="ভিডিও ফাইল"
                                        accept="video"
                                        folder="archive"
                                        value={draft.video_file_url}
                                        onChange={(url) => patch({ video_file_url: url })}
                                        helper="সর্বোচ্চ ৫০ MB। বড় ভিডিও ইউটিউবে দিয়ে লিঙ্ক ব্যবহার করাই ভালো।"
                                    />
                                </div>
                            )}

                            <label className="flex items-center gap-2.5 text-sm text-ink-700">
                                <input
                                    type="checkbox"
                                    checked={draft.is_published}
                                    onChange={(e) =>
                                        patch({ is_published: e.target.checked })
                                    }
                                    className="size-4 rounded border-ink-300 accent-brand-800"
                                />
                                ওয়েবসাইটে দেখান
                            </label>
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
