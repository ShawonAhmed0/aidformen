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
    X,
} from "lucide-react";
import { toast } from "sonner";

import {
    createCarouselImage,
    deleteCarouselImage,
    reorderCarouselImages,
    toggleCarouselPublished,
    updateCarouselImage,
} from "@/lib/actions/hero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePicker } from "./ImagePicker";
import { FocalPointPicker } from "./FocalPointPicker";
import { BilingualField } from "./BilingualField";
import { useAdminLocale } from "./AdminLocale";
import type { CarouselImage } from "@/lib/types/content";
import { cn } from "@/lib/utils";

const s = (v: string | null | undefined) => v ?? "";

const copy = {
    bn: {
        genericError: "সমস্যা হয়েছে।",
        reordered: "ক্রম পরিবর্তন হয়েছে।",
        imageRequired: "স্লাইডের জন্য একটি ছবি আপলোড করুন।",
        updated: "স্লাইড আপডেট হয়েছে।",
        created: "নতুন স্লাইড যোগ হয়েছে।",
        hidden: "স্লাইড লুকানো হয়েছে।",
        published: "স্লাইড প্রকাশ করা হয়েছে।",
        deleted: "স্লাইড মুছে ফেলা হয়েছে।",
        heading: "হিরো ক্যারোজেল",
        intro: "হোমপেজের হিরো সেকশনের পেছনে যে ছবিগুলো ঘুরে ঘুরে দেখায়।",
        newSlide: "নতুন স্লাইড",
        editSlide: "স্লাইড সম্পাদনা",
        emptyTitle: "এখনো কোনো স্লাইড নেই।",
        emptyHint: "অন্তত একটি ছবি যোগ করলে হিরো সেকশনে দেখাবে।",
        untitled: "শিরোনামহীন স্লাইড",
        unpublished: "অপ্রকাশিত",
        moveUp: "উপরে সরান",
        moveDown: "নিচে সরান",
        hide: "লুকান",
        publish: "প্রকাশ করুন",
        edit: "সম্পাদনা করুন",
        delete: "মুছে ফেলুন",
        confirmDelete: "এই স্লাইড ও এর ছবি স্থায়ীভাবে মুছে যাবে।",
        cancel: "বাতিল",
        close: "বন্ধ করুন",
        imageLabel: "স্লাইডের ছবি",
        focalHelper:
            "হিরো সেকশন পর্দার আকার অনুযায়ী ছবি কেটে নেয়। যে অংশটি সব সময় দেখাতে চান, সেখানে টেনে আনুন।",
        titleLabel: "শিরোনাম",
        subtitleLabel: "উপশিরোনাম",
        altLabel: "ছবির বিকল্প বর্ণনা (alt)",
        altHelper: "স্ক্রিন রিডার ও ছবি লোড না হলে এই লেখাটি ব্যবহার হয়।",
        showOnSite: "ওয়েবসাইটে দেখান",
        save: "সংরক্ষণ করুন",
    },
    en: {
        genericError: "Something went wrong.",
        reordered: "Order updated.",
        imageRequired: "Upload an image for the slide.",
        updated: "Slide updated.",
        created: "New slide added.",
        hidden: "Slide hidden.",
        published: "Slide published.",
        deleted: "Slide deleted.",
        heading: "Hero carousel",
        intro: "The images that rotate behind the homepage hero section.",
        newSlide: "New slide",
        editSlide: "Edit slide",
        emptyTitle: "No slides yet.",
        emptyHint: "Add at least one image and it will show in the hero section.",
        untitled: "Untitled slide",
        unpublished: "Unpublished",
        moveUp: "Move up",
        moveDown: "Move down",
        hide: "Hide",
        publish: "Publish",
        edit: "Edit",
        delete: "Delete",
        confirmDelete: "This slide and its image will be permanently deleted.",
        cancel: "Cancel",
        close: "Close",
        imageLabel: "Slide image",
        focalHelper:
            "The hero section crops the image to fit the screen. Drag to the part you always want visible.",
        titleLabel: "Title",
        subtitleLabel: "Subtitle",
        altLabel: "Image alt text",
        altHelper: "Used by screen readers and when the image fails to load.",
        showOnSite: "Show on website",
        save: "Save",
    },
};

type Draft = {
    id: string | null;
    image_url: string | null;
    title: string;
    title_en: string;
    subtitle: string;
    subtitle_en: string;
    alt_text: string;
    alt_text_en: string;
    focal_x: number;
    focal_y: number;
    is_published: boolean;
};

const emptyDraft: Draft = {
    id: null,
    image_url: null,
    title: "",
    title_en: "",
    subtitle: "",
    subtitle_en: "",
    alt_text: "",
    alt_text_en: "",
    focal_x: 50,
    focal_y: 50,
    is_published: true,
};

const toDraft = (slide: CarouselImage): Draft => ({
    id: slide.id,
    image_url: slide.image_url,
    title: s(slide.title),
    title_en: s(slide.title_en),
    subtitle: s(slide.subtitle),
    subtitle_en: s(slide.subtitle_en),
    alt_text: s(slide.alt_text),
    alt_text_en: s(slide.alt_text_en),
    focal_x: slide.focal_x ?? 50,
    focal_y: slide.focal_y ?? 50,
    is_published: slide.is_published,
});

export function CarouselManager({ slides }: { slides: CarouselImage[] }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const t = copy[useAdminLocale()];
    const [draft, setDraft] = useState<Draft | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

    // Local copy so reordering feels instant; the server call follows.
    const [order, setOrder] = useState(slides);
    const [renderedIds, setRenderedIds] = useState(slides.map((s) => s.id).join(","));
    const incomingIds = slides.map((s) => s.id).join(",");
    if (renderedIds !== incomingIds) {
        setRenderedIds(incomingIds);
        setOrder(slides);
    }

    const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
        startTransition(async () => {
            const result = await fn();
            if (!result.ok) {
                toast.error(result.error ?? t.genericError);
                router.refresh();
                return;
            }
            toast.success(success);
            router.refresh();
        });

    const move = (index: number, direction: -1 | 1) => {
        const next = [...order];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;

        [next[index], next[target]] = [next[target], next[index]];
        setOrder(next);

        const body = new FormData();
        next.forEach((slide) => body.append("ids", slide.id));
        run(() => reorderCarouselImages(body), t.reordered);
    };

    const save = () => {
        if (!draft) return;
        if (!draft.image_url) {
            toast.error(t.imageRequired);
            return;
        }

        const body = new FormData();
        if (draft.id) body.append("id", draft.id);
        body.append("image_url", draft.image_url);
        body.append("title", draft.title);
        body.append("title_en", draft.title_en);
        body.append("subtitle", draft.subtitle);
        body.append("subtitle_en", draft.subtitle_en);
        body.append("alt_text", draft.alt_text);
        body.append("alt_text_en", draft.alt_text_en);
        body.append("focal_x", String(draft.focal_x));
        body.append("focal_y", String(draft.focal_y));
        body.append("is_published", String(draft.is_published));

        startTransition(async () => {
            const result = draft.id
                ? await updateCarouselImage(body)
                : await createCarouselImage(body);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            toast.success(draft.id ? t.updated : t.created);
            setDraft(null);
            router.refresh();
        });
    };

    return (
        <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-ink-900">
                        {t.heading}
                    </h2>
                    <p className="mt-1 text-sm text-ink-500">
                        {t.intro}
                    </p>
                </div>

                <Button
                    type="button"
                    size="sm"
                    onClick={() => setDraft({ ...emptyDraft })}
                    disabled={pending}
                >
                    <Plus aria-hidden="true" />
                    {t.newSlide}
                </Button>
            </div>

            {order.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-ink-300 px-6 py-12 text-center">
                    <p className="text-sm font-medium text-ink-700">
                        {t.emptyTitle}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                        {t.emptyHint}
                    </p>
                </div>
            ) : (
                <ul className="mt-6 space-y-3">
                    {order.map((slide, index) => (
                        <li
                            key={slide.id}
                            className={cn(
                                "flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 p-3 transition-ui",
                                !slide.is_published && "bg-surface-sunken"
                            )}
                        >
                            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                                <Image
                                    src={slide.image_url}
                                    alt=""
                                    fill
                                    unoptimized
                                    sizes="96px"
                                    className={cn(
                                        "object-cover",
                                        !slide.is_published && "opacity-50"
                                    )}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink-900">
                                    {slide.title || t.untitled}
                                </p>
                                {slide.subtitle && (
                                    <p className="mt-0.5 truncate text-xs text-ink-500">
                                        {slide.subtitle}
                                    </p>
                                )}
                                {!slide.is_published && (
                                    <Badge tone="neutral" size="sm" className="mt-1.5">
                                        {t.unpublished}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    disabled={pending || index === 0}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                                    aria-label={t.moveUp}
                                >
                                    <ArrowUp className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    disabled={pending || index === order.length - 1}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                                    aria-label={t.moveDown}
                                >
                                    <ArrowDown className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const body = new FormData();
                                        body.append("id", slide.id);
                                        body.append(
                                            "is_published",
                                            String(!slide.is_published)
                                        );
                                        run(
                                            () => toggleCarouselPublished(body),
                                            slide.is_published
                                                ? t.hidden
                                                : t.published
                                        );
                                    }}
                                    disabled={pending}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                                    aria-label={
                                        slide.is_published ? t.hide : t.publish
                                    }
                                >
                                    {slide.is_published ? (
                                        <Eye className="size-4" />
                                    ) : (
                                        <EyeOff className="size-4" />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDraft(toDraft(slide))}
                                    disabled={pending}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                                    aria-label={t.edit}
                                >
                                    <Pencil className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setConfirmingDelete(slide.id)}
                                    disabled={pending}
                                    className="flex size-9 items-center justify-center rounded-lg text-danger transition-ui hover:bg-danger-soft"
                                    aria-label={t.delete}
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>

                            {/* Inline confirm — deleting also removes the stored file. */}
                            {confirmingDelete === slide.id && (
                                <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-line bg-danger-soft px-4 py-3">
                                    <p className="text-sm text-danger">
                                        {t.confirmDelete}
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
                                            onClick={() => {
                                                const body = new FormData();
                                                body.append("id", slide.id);
                                                setConfirmingDelete(null);
                                                run(
                                                    () => deleteCarouselImage(body),
                                                    t.deleted
                                                );
                                            }}
                                        >
                                            {t.delete}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* Editor dialog */}
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
                        aria-label={draft.id ? t.editSlide : t.newSlide}
                        className="my-8 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg text-ink-900">
                                {draft.id ? t.editSlide : t.newSlide}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setDraft(null)}
                                className="flex size-9 items-center justify-center rounded-full text-ink-500 transition-ui hover:bg-ink-100"
                                aria-label={t.close}
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-5">
                            <ImagePicker
                                label={t.imageLabel}
                                folder="carousel"
                                aspect="video"
                                value={draft.image_url}
                                onChange={(url) =>
                                    setDraft((d) => (d ? { ...d, image_url: url } : d))
                                }
                            />

                            {draft.image_url && (
                                <FocalPointPicker
                                    url={draft.image_url}
                                    x={draft.focal_x}
                                    y={draft.focal_y}
                                    aspect="wide"
                                    onChange={(focal_x, focal_y) =>
                                        setDraft((d) => (d ? { ...d, focal_x, focal_y } : d))
                                    }
                                    helper={t.focalHelper}
                                />
                            )}

                            <BilingualField
                                label={t.titleLabel}
                                value={draft.title}
                                onChange={(v) =>
                                    setDraft((d) => (d ? { ...d, title: v } : d))
                                }
                                valueEn={draft.title_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, title_en: v } : d))
                                }
                            />

                            <BilingualField
                                label={t.subtitleLabel}
                                value={draft.subtitle}
                                onChange={(v) =>
                                    setDraft((d) => (d ? { ...d, subtitle: v } : d))
                                }
                                valueEn={draft.subtitle_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, subtitle_en: v } : d))
                                }
                            />

                            <BilingualField
                                label={t.altLabel}
                                value={draft.alt_text}
                                onChange={(v) =>
                                    setDraft((d) => (d ? { ...d, alt_text: v } : d))
                                }
                                valueEn={draft.alt_text_en}
                                onChangeEn={(v) =>
                                    setDraft((d) => (d ? { ...d, alt_text_en: v } : d))
                                }
                                helper={t.altHelper}
                            />

                            <label className="flex items-center gap-2.5 text-sm text-ink-700">
                                <input
                                    type="checkbox"
                                    checked={draft.is_published}
                                    onChange={(e) =>
                                        setDraft((d) =>
                                            d
                                                ? { ...d, is_published: e.target.checked }
                                                : d
                                        )
                                    }
                                    className="size-4 rounded border-ink-300 accent-brand-800"
                                />
                                {t.showOnSite}
                            </label>
                        </div>

                        <div className="mt-7 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDraft(null)}
                            >
                                {t.cancel}
                            </Button>
                            <Button type="button" onClick={save} disabled={pending}>
                                {pending && (
                                    <Loader2 className="animate-spin" aria-hidden="true" />
                                )}
                                {t.save}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
