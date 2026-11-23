"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Crop, ImagePlus, Loader2, Trash2 } from "lucide-react";

import {
    ARCHIVE_IMAGE_TYPES,
    describeArchiveFileError,
    uploadToMedia,
} from "@/lib/supabase/upload";
import { useAdminLocale } from "./AdminLocale";
import { BilingualField } from "./BilingualField";
import { ImageCropDialog } from "./ImageCropDialog";
import { cn } from "@/lib/utils";

export type GalleryPhoto = {
    url: string;
    caption: string;
    caption_en: string;
};

const copy = {
    bn: {
        limit: (max: number) => `সর্বোচ্চ ${max}টি ছবি যোগ করা যাবে।`,
        limitTrimmed: (max: number) =>
            `সর্বোচ্চ ${max}টি ছবি যোগ করা যাবে — বাকিগুলো বাদ দেওয়া হয়েছে।`,
        failed: (names: string) =>
            `যোগ করা যায়নি: ${names} — ছবি JPG/PNG/WEBP এবং ৪০ MB-এর কম হতে হবে।`,
        referenceTitle: "সহায়ক / রেফারেন্স ছবি",
        galleryTitle: "গ্যালারির ছবি",
        referenceHint: (max: number) =>
            `সর্বোচ্চ ${max}টি। আলাদা কভার না দিলে প্রথম ছবিটি কার্ডে দেখাবে; বাকিগুলো শুধু বিস্তারিত পাতায় থাকবে।`,
        galleryHint: "প্রথম ছবিটি কভার হিসেবে ব্যবহৃত হবে যদি আলাদা কভার না দেওয়া হয়।",
        uploading: (done: number, total: number) => `${done}/${total} আপলোড হচ্ছে…`,
        add: "ছবি যোগ করুন",
        referenceInput: "রেফারেন্স ছবি",
        galleryInput: "গ্যালারির ছবি",
        overLimit: (max: number, extra: number) =>
            `এই ধরনের এন্ট্রিতে সর্বোচ্চ ${max}টি ছবি রাখা যাবে। সংরক্ষণের আগে অতিরিক্ত ${extra}টি ছবি সরান।`,
        referenceEmpty: "এখনো কোনো সহায়ক ছবি যোগ করা হয়নি।",
        galleryEmpty: "এখনো কোনো ছবি যোগ করা হয়নি।",
        caption: "ক্যাপশন",
        referenceCaptionPlaceholder: "ঐচ্ছিক — ছবিটির প্রাসঙ্গিকতা",
        galleryCaptionPlaceholder: "ঐচ্ছিক — ছবিটি কী দেখাচ্ছে",
        adjust: "ঠিক করুন",
        adjustLabel: (n: number) => `${n} নম্বর ছবি ঠিক করুন`,
        cropHint: "একটি ছবি যোগ করলে সঙ্গে সঙ্গে ঠিক করার সুযোগ পাবেন; অনেকগুলো একসঙ্গে দিলে পরে প্রতিটির \"ঠিক করুন\" ব্যবহার করুন।",
        moveUp: "উপরে সরান",
        moveDown: "নিচে সরান",
        remove: "ছবি সরান",
    },
    en: {
        limit: (max: number) => `You can add up to ${max} images.`,
        limitTrimmed: (max: number) =>
            `You can add up to ${max} images — the rest were left out.`,
        failed: (names: string) =>
            `Could not add: ${names} — images must be JPG/PNG/WEBP and under 40 MB.`,
        referenceTitle: "Supporting / reference images",
        galleryTitle: "Gallery images",
        referenceHint: (max: number) =>
            `Up to ${max}. Without a separate cover, the first image appears on the card; the rest appear only on the detail page.`,
        galleryHint: "The first image is used as the cover if no separate cover is set.",
        uploading: (done: number, total: number) => `Uploading ${done}/${total}…`,
        add: "Add images",
        referenceInput: "Reference images",
        galleryInput: "Gallery images",
        overLimit: (max: number, extra: number) =>
            `This kind of entry can hold up to ${max} images. Remove ${extra} before saving.`,
        referenceEmpty: "No supporting images added yet.",
        galleryEmpty: "No images added yet.",
        caption: "Caption",
        referenceCaptionPlaceholder: "Optional — why this image is relevant",
        galleryCaptionPlaceholder: "Optional — what the image shows",
        adjust: "Adjust",
        adjustLabel: (n: number) => `Adjust image ${n}`,
        cropHint: "Add one image to adjust it straight away; after adding several, use \"Adjust\" on each.",
        moveUp: "Move up",
        moveDown: "Move down",
        remove: "Remove image",
    },
};

/**
 * The photo gallery of an archive entry: upload many, caption each, order them.
 *
 * Files go straight to storage from the browser (see lib/supabase/upload.ts) and
 * are uploaded one at a time rather than all at once, so a dozen photographs off
 * a phone cannot open a dozen parallel connections — and the counter can say
 * where it is instead of just spinning.
 */
export function ArchiveGalleryEditor({
    photos,
    onChange,
    max,
    mode = "gallery",
}: {
    photos: GalleryPhoto[];
    onChange: (photos: GalleryPhoto[]) => void;
    max: number;
    mode?: "gallery" | "references";
}) {
    const t = copy[useAdminLocale()];
    const inputRef = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);
    // The image in the crop dialog: a new single pick, or an existing photo.
    const [cropping, setCropping] = useState<
        { source: File; index: null } | { source: string; index: number } | null
    >(null);

    /** Uploads one adjusted (or untouched) photo: appended, or replacing `index`. */
    const uploadOne = async (file: File, index: number | null) => {
        setError(null);
        setProgress({ done: 0, total: 1 });
        const result = await uploadToMedia(file, "archive");
        setProgress(null);
        if (!result.ok) {
            setError(t.failed(file.name));
            return;
        }
        if (index === null) onChange([...photos, { url: result.url, caption: "", caption_en: "" }]);
        else onChange(photos.map((p, i) => (i === index ? { ...p, url: result.url } : p)));
    };

    const addFiles = async (files: FileList | null) => {
        setError(null);
        if (!files || files.length === 0) return;

        const room = max - photos.length;
        if (room <= 0) {
            setError(t.limit(max));
            return;
        }

        const chosen = Array.from(files).slice(0, room);
        if (chosen.length < files.length) {
            setError(t.limitTrimmed(max));
        }

        // One photo: frame it before it goes up. A batch goes up as is, so a
        // dozen pictures don't mean a dozen dialogs in a row.
        if (
            chosen.length === 1 &&
            ARCHIVE_IMAGE_TYPES.includes(chosen[0].type) &&
            !describeArchiveFileError(chosen[0])
        ) {
            setCropping({ source: chosen[0], index: null });
            return;
        }

        setProgress({ done: 0, total: chosen.length });

        const added: GalleryPhoto[] = [];
        const failures: string[] = [];

        for (const [index, file] of chosen.entries()) {
            if (!ARCHIVE_IMAGE_TYPES.includes(file.type)) {
                failures.push(file.name);
                setProgress({ done: index + 1, total: chosen.length });
                continue;
            }

            const invalid = describeArchiveFileError(file);
            if (invalid) {
                failures.push(file.name);
                setProgress({ done: index + 1, total: chosen.length });
                continue;
            }

            const result = await uploadToMedia(file, "archive");
            if (result.ok) added.push({ url: result.url, caption: "", caption_en: "" });
            else failures.push(file.name);

            setProgress({ done: index + 1, total: chosen.length });
        }

        setProgress(null);

        // Whatever succeeded is kept: losing nine good uploads because the tenth
        // was a 30MB PNG would be the worst possible outcome here.
        if (added.length) onChange([...photos, ...added]);

        if (failures.length) {
            setError(t.failed(failures.join(", ")));
        }
    };

    const update = (index: number, patch: Partial<GalleryPhoto>) => {
        onChange(photos.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    };

    const move = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= photos.length) return;

        const next = [...photos];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    const remove = (index: number) => {
        // Only drops the reference; the storage object is cleaned up by
        // updateArchiveEntry once the change is actually saved.
        onChange(photos.filter((_, i) => i !== index));
    };

    const busy = progress !== null;
    const isReferenceGallery = mode === "references";
    const overLimit = photos.length > max;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <span className="flex text-sm font-medium text-ink-700">
                        {isReferenceGallery ? t.referenceTitle : t.galleryTitle}
                    </span>
                    <p className="mt-0.5 text-xs text-ink-500">
                        {isReferenceGallery ? t.referenceHint(max) : t.galleryHint} {t.cropHint}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-ink-300 bg-surface px-4 text-sm font-medium text-ink-800 transition-ui hover:border-brand-400 hover:text-brand-800 disabled:opacity-60"
                >
                    {busy ? (
                        <>
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            {t.uploading(progress.done, progress.total)}
                        </>
                    ) : (
                        <>
                            <ImagePlus className="size-4" aria-hidden="true" />
                            {t.add}
                        </>
                    )}
                </button>
            </div>

            <input
                ref={inputRef}
                type="file"
                multiple
                accept={ARCHIVE_IMAGE_TYPES.join(",")}
                className="sr-only"
                aria-label={isReferenceGallery ? t.referenceInput : t.galleryInput}
                onChange={(event) => {
                    void addFiles(event.target.files);
                    event.target.value = "";
                }}
            />

            {error && (
                <p role="alert" className="text-xs font-medium text-danger">
                    {error}
                </p>
            )}

            {overLimit && (
                <p role="alert" className="text-xs font-medium text-warning">
                    {t.overLimit(max, photos.length - max)}
                </p>
            )}

            <ImageCropDialog
                source={cropping?.source ?? null}
                aspect="standard"
                onClose={() => setCropping(null)}
                onApply={(file) => {
                    if (cropping) void uploadOne(file, cropping.index);
                }}
                onUseOriginal={
                    cropping && cropping.index === null
                        ? () => void uploadOne(cropping.source as File, null)
                        : undefined
                }
            />

            {photos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-300 px-6 py-8 text-center text-sm text-ink-500">
                    {isReferenceGallery ? t.referenceEmpty : t.galleryEmpty}
                </p>
            ) : (
                <ul className="space-y-3">
                    {photos.map((photo, index) => (
                        <li
                            key={`${photo.url}-${index}`}
                            className="flex flex-wrap items-start gap-4 rounded-xl border border-ink-200 p-3"
                        >
                            <span className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                                <Image
                                    src={photo.url}
                                    alt=""
                                    fill
                                    unoptimized
                                    sizes="112px"
                                    className="object-cover"
                                />
                            </span>

                            <div className="min-w-56 flex-1">
                                <BilingualField
                                    label={t.caption}
                                    value={photo.caption}
                                    onChange={(v) => update(index, { caption: v })}
                                    valueEn={photo.caption_en}
                                    onChangeEn={(v) => update(index, { caption_en: v })}
                                    placeholder={
                                        isReferenceGallery
                                            ? t.referenceCaptionPlaceholder
                                            : t.galleryCaptionPlaceholder
                                    }
                                />
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCropping({ source: photo.url, index })}
                                    disabled={busy}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-700 transition-ui hover:bg-brand-50 hover:text-brand-800 disabled:opacity-40"
                                    aria-label={t.adjustLabel(index + 1)}
                                >
                                    <Crop className="size-4" aria-hidden="true" />
                                    <span className="hidden sm:inline">{t.adjust}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    disabled={index === 0}
                                    className={arrowClass}
                                    aria-label={t.moveUp}
                                >
                                    <ArrowUp className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    disabled={index === photos.length - 1}
                                    className={arrowClass}
                                    aria-label={t.moveDown}
                                >
                                    <ArrowDown className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="flex size-9 items-center justify-center rounded-lg text-danger transition-ui hover:bg-danger-soft"
                                    aria-label={t.remove}
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const arrowClass = cn(
    "flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui",
    "hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
);
