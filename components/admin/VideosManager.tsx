"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowDown,
    ArrowUp,
    Eye,
    EyeOff,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    Video as VideoIcon,
    X,
} from "lucide-react";
import { toast } from "sonner";

import {
    createVideo,
    deleteVideo,
    reorderVideos,
    toggleVideoPublished,
    updateVideo,
} from "@/lib/actions/videos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ImagePicker } from "./ImagePicker";
import { BilingualField } from "./BilingualField";
import type { Video } from "@/lib/types/content";
import { cn } from "@/lib/utils";

const s = (v: string | null | undefined) => v ?? "";

type Draft = {
    id: string | null;
    title: string;
    title_en: string;
    thumbnail_url: string | null;
    video_url: string;
    duration: string;
    year: string;
    is_published: boolean;
};

const emptyDraft: Draft = {
    id: null,
    title: "",
    title_en: "",
    thumbnail_url: null,
    video_url: "",
    duration: "",
    year: "",
    is_published: true,
};

const toDraft = (v: Video): Draft => ({
    id: v.id,
    title: v.title,
    title_en: s(v.title_en),
    thumbnail_url: v.thumbnail_url,
    video_url: s(v.video_url),
    duration: s(v.duration),
    year: s(v.year),
    is_published: v.is_published,
});

export function VideosManager({ videos }: { videos: Video[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

    const [order, setOrder] = useState(videos);
    const [renderedIds, setRenderedIds] = useState(videos.map((v) => v.id).join(","));
    const incoming = videos.map((v) => v.id).join(",");
    if (renderedIds !== incoming) {
        setRenderedIds(incoming);
        setOrder(videos);
    }

    const move = (index: number, direction: -1 | 1) => {
        const next = [...order];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;

        [next[index], next[target]] = [next[target], next[index]];
        setOrder(next);

        const body = new FormData();
        next.forEach((v) => body.append("ids", v.id));

        startTransition(async () => {
            const result = await reorderVideos(body);
            if (!result.ok) toast.error(result.error);
            router.refresh();
        });
    };

    const togglePublished = (video: Video) => {
        const body = new FormData();
        body.append("id", video.id);
        body.append("is_published", String(!video.is_published));

        startTransition(async () => {
            const result = await toggleVideoPublished(body);
            if (!result.ok) toast.error(result.error);
            router.refresh();
        });
    };

    const save = () => {
        if (!draft) return;
        if (!draft.title.trim()) {
            toast.error("শিরোনাম প্রয়োজন।");
            return;
        }

        const body = new FormData();
        if (draft.id) body.append("id", draft.id);
        body.append("title", draft.title);
        body.append("title_en", draft.title_en);
        if (draft.thumbnail_url) body.append("thumbnail_url", draft.thumbnail_url);
        body.append("video_url", draft.video_url);
        body.append("duration", draft.duration);
        body.append("year", draft.year);
        body.append("is_published", String(draft.is_published));

        startTransition(async () => {
            const result = draft.id ? await updateVideo(body) : await createVideo(body);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            toast.success(draft.id ? "ভিডিও আপডেট হয়েছে।" : "নতুন ভিডিও যোগ হয়েছে।");
            setDraft(null);
            router.refresh();
        });
    };

    return (
        <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-ink-900">ভিডিও</h2>
                    <p className="mt-1 text-sm text-ink-500">
                        হোমপেজের “মিডিয়া ও ডকুমেন্টারি” অংশে যে ভিডিওগুলো দেখাবে।
                    </p>
                </div>

                <Button
                    type="button"
                    size="sm"
                    onClick={() => setDraft({ ...emptyDraft })}
                    disabled={pending}
                >
                    <Plus aria-hidden="true" />
                    নতুন ভিডিও
                </Button>
            </div>

            {order.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-ink-300 px-6 py-12 text-center">
                    <p className="text-sm font-medium text-ink-700">
                        এখনো কোনো ভিডিও যোগ করা হয়নি।
                    </p>
                </div>
            ) : (
                <ul className="mt-6 space-y-3">
                    {order.map((video, index) => (
                        <li
                            key={video.id}
                            className={cn(
                                "flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 p-3",
                                !video.is_published && "bg-surface-sunken"
                            )}
                        >
                            <span className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50">
                                {video.thumbnail_url ? (
                                    <Image
                                        src={video.thumbnail_url}
                                        alt=""
                                        fill
                                        unoptimized
                                        sizes="96px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <VideoIcon
                                        className="size-5 text-brand-600"
                                        aria-hidden="true"
                                    />
                                )}
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink-900">
                                    {video.title}
                                </p>

                                <p className="mt-0.5 text-xs text-ink-500">
                                    {[video.duration, video.year].filter(Boolean).join(" • ") ||
                                        "সময়কাল ও সাল দেওয়া হয়নি"}
                                </p>

                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {!video.is_published && (
                                        <Badge tone="neutral" size="sm">
                                            অপ্রকাশিত
                                        </Badge>
                                    )}
                                    {!video.video_url && (
                                        <Badge tone="warning" size="sm">
                                            লিঙ্ক নেই
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    disabled={pending || index === 0}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                                    aria-label="উপরে সরান"
                                >
                                    <ArrowUp className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    disabled={pending || index === order.length - 1}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                                    aria-label="নিচে সরান"
                                >
                                    <ArrowDown className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => togglePublished(video)}
                                    disabled={pending}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                                    aria-label={
                                        video.is_published ? "সাইট থেকে লুকান" : "সাইটে দেখান"
                                    }
                                >
                                    {video.is_published ? (
                                        <Eye className="size-4" />
                                    ) : (
                                        <EyeOff className="size-4" />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDraft(toDraft(video))}
                                    disabled={pending}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                                    aria-label="সম্পাদনা করুন"
                                >
                                    <Pencil className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setConfirmingDelete(video.id)}
                                    disabled={pending}
                                    className="flex size-9 items-center justify-center rounded-lg text-danger transition-ui hover:bg-danger-soft"
                                    aria-label="মুছে ফেলুন"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>

                            {confirmingDelete === video.id && (
                                <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-line bg-danger-soft px-4 py-3">
                                    <p className="text-sm text-danger">
                                        “{video.title}” স্থায়ীভাবে মুছে যাবে।
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
                                                body.append("id", video.id);
                                                setConfirmingDelete(null);
                                                startTransition(async () => {
                                                    const r = await deleteVideo(body);
                                                    if (!r.ok) toast.error(r.error);
                                                    else toast.success("ভিডিও মুছে ফেলা হয়েছে।");
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
                    ))}
                </ul>
            )}

            {draft && (
                <div
                    className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-ink-950/60 p-4 backdrop-blur-sm"
                    role="presentation"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setDraft(null);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={draft.id ? "ভিডিও সম্পাদনা" : "নতুন ভিডিও"}
                        className="my-8 w-full max-w-xl rounded-2xl bg-surface p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg text-ink-900">
                                {draft.id ? "ভিডিও সম্পাদনা" : "নতুন ভিডিও"}
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
                            <ImagePicker
                                label="থাম্বনেইল"
                                folder="videos"
                                value={draft.thumbnail_url}
                                onChange={(url) =>
                                    setDraft((d) => (d ? { ...d, thumbnail_url: url } : d))
                                }
                            />

                            <BilingualField
                                label="শিরোনাম"
                                required
                                multiline
                                rows={2}
                                value={draft.title}
                                onChange={(v) => setDraft((d) => (d ? { ...d, title: v } : d))}
                                valueEn={draft.title_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, title_en: v } : d))
                                }
                            />

                            <Field
                                label="ভিডিওর লিঙ্ক"
                                helper="ইউটিউব বা অন্য ঠিকানার সম্পূর্ণ URL। নতুন ট্যাবে খুলবে।"
                            >
                                {(props) => (
                                    <Input
                                        {...props}
                                        type="url"
                                        value={draft.video_url}
                                        onChange={(e) =>
                                            setDraft((d) =>
                                                d ? { ...d, video_url: e.target.value } : d
                                            )
                                        }
                                        placeholder="https://youtube.com/watch?v=…"
                                    />
                                )}
                            </Field>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field label="সময়কাল" helper="যেমন: ১২:৪৫">
                                    {(props) => (
                                        <Input
                                            {...props}
                                            value={draft.duration}
                                            onChange={(e) =>
                                                setDraft((d) =>
                                                    d ? { ...d, duration: e.target.value } : d
                                                )
                                            }
                                            placeholder="১২:৪৫"
                                        />
                                    )}
                                </Field>

                                <Field label="সাল" helper="যেমন: ২০২৩">
                                    {(props) => (
                                        <Input
                                            {...props}
                                            value={draft.year}
                                            onChange={(e) =>
                                                setDraft((d) =>
                                                    d ? { ...d, year: e.target.value } : d
                                                )
                                            }
                                            placeholder="২০২৩"
                                        />
                                    )}
                                </Field>
                            </div>

                            <label className="flex items-center gap-2.5 text-sm text-ink-700">
                                <input
                                    type="checkbox"
                                    checked={draft.is_published}
                                    onChange={(e) =>
                                        setDraft((d) =>
                                            d ? { ...d, is_published: e.target.checked } : d
                                        )
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
