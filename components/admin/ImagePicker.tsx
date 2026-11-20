"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";

import { MAX_SOURCE_IMAGE_BYTES, uploadToMedia } from "@/lib/supabase/upload";
import type { MediaFolder } from "@/lib/types/media";
import { cn } from "@/lib/utils";
import { useAdminLocale } from "./AdminLocale";

type ImagePickerProps = {
    /** Current image URL, or null for empty. */
    value: string | null;
    onChange: (url: string | null) => void;
    /** Storage folder, keeps the bucket organised. */
    folder: MediaFolder;
    label?: string;
    /** Aspect of the preview box. */
    aspect?: "video" | "square" | "wide";
    /** `contain` for artwork that must not be cropped, e.g. a signature. */
    fit?: "cover" | "contain";
    className?: string;
    helper?: string;
};

// Matches what lib/supabase/upload.ts accepts for images.
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const aspects = {
    video: "aspect-video",
    square: "aspect-square",
    wide: "aspect-3/1",
} as const;

const copy = {
    bn: {
        image: "ছবি",
        wrongType: "শুধু JPG, PNG, WEBP বা AVIF ফাইল দেওয়া যাবে।",
        tooLarge: "ছবির আকার ৪০ মেগাবাইটের কম হতে হবে।",
        change: "পরিবর্তন",
        remove: "ছবি সরান",
        drop: "ছবি টেনে আনুন বা ক্লিক করুন",
        hint: "JPG, PNG, WEBP · বড় ছবি নিজে থেকেই ছোট হবে",
        uploading: "ছোট করে আপলোড হচ্ছে…",
    },
    en: {
        image: "Image",
        wrongType: "Only JPG, PNG, WEBP or AVIF files are accepted.",
        tooLarge: "The image must be smaller than 40 MB.",
        change: "Change",
        remove: "Remove image",
        drop: "Drag an image here or click",
        hint: "JPG, PNG, WEBP · large images are resized automatically",
        uploading: "Resizing and uploading…",
    },
};

/**
 * Drag-and-drop image field used by the hero, team and video editors.
 *
 * Uploads straight from the browser to Supabase Storage. It used to post the
 * file through a Server Action, whose request body is capped at 1 MB — so any
 * real photograph (hero slides, team portraits) failed to upload. Storage RLS
 * (`media_admin_insert`) is what authorises the write; the checks here are
 * for fast feedback, not for trust.
 */
export function ImagePicker({
    value,
    onChange,
    folder,
    label,
    aspect = "video",
    fit = "cover",
    className,
    helper,
}: ImagePickerProps) {
    const t = copy[useAdminLocale()];
    const fieldLabel = label ?? t.image;
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = (file: File | undefined | null) => {
        setError(null);
        if (!file) return;

        if (!ALLOWED.includes(file.type)) {
            setError(t.wrongType);
            return;
        }
        if (file.size > MAX_SOURCE_IMAGE_BYTES) {
            setError(t.tooLarge);
            return;
        }

        startTransition(async () => {
            const result = await uploadToMedia(file, folder);
            if (result.ok) {
                onChange(result.url);
            } else {
                setError(result.error);
            }
        });
    };

    return (
        <div className={cn("space-y-2", className)}>
            <span className="flex text-sm font-medium text-ink-700">{fieldLabel}</span>

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    handleFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                    "relative overflow-hidden rounded-xl border-2 border-dashed transition-ui",
                    aspects[aspect],
                    dragging
                        ? "border-brand-600 bg-brand-50"
                        : "border-ink-300 bg-surface-sunken",
                    error && "border-danger"
                )}
            >
                {value ? (
                    <>
                        <Image
                            src={value}
                            alt=""
                            fill
                            unoptimized
                            sizes="(min-width: 1024px) 33vw, 100vw"
                            className={fit === "contain" ? "object-contain p-3" : "object-cover"}
                        />

                        {/* Controls sit on a scrim so they stay legible on any image. */}
                        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-ink-950/80 to-transparent p-3">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                disabled={pending}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/95 px-3 text-sm font-medium text-ink-900 transition-ui hover:bg-white disabled:opacity-60"
                            >
                                <UploadCloud className="size-4" aria-hidden="true" />
                                {t.change}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    onChange(null);
                                    setError(null);
                                }}
                                disabled={pending}
                                className="inline-flex size-9 items-center justify-center rounded-lg bg-white/95 text-danger transition-ui hover:bg-white disabled:opacity-60"
                                aria-label={t.remove}
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={pending}
                        className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center transition-ui hover:bg-brand-50/50 disabled:opacity-60"
                    >
                        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                            <ImagePlus className="size-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-medium text-ink-700">
                            {t.drop}
                        </span>
                        <span className="text-xs text-ink-500">
                            {t.hint}
                        </span>
                    </button>
                )}

                {pending && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-surface/80 text-sm font-medium text-ink-700 backdrop-blur-sm">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        {t.uploading}
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={ALLOWED.join(",")}
                className="sr-only"
                aria-label={fieldLabel}
                onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    // Reset so picking the same file twice still fires onChange.
                    e.target.value = "";
                }}
            />

            {helper && !error && <p className="text-xs text-ink-500">{helper}</p>}

            {error && (
                <p role="alert" className="text-xs font-medium text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
