"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Film, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";

import {
    ARCHIVE_IMAGE_TYPES,
    ARCHIVE_VIDEO_TYPES,
    describeArchiveFileError,
    uploadToMedia,
} from "@/lib/supabase/upload";
import { cn } from "@/lib/utils";

type MediaFieldProps = {
    value: string | null;
    onChange: (url: string | null) => void;
    /** Which of the two file families this field accepts. */
    accept: "image" | "video";
    folder: string;
    label: string;
    helper?: string;
    className?: string;
};

/**
 * Single-file field that uploads straight to storage.
 *
 * The sibling `ImagePicker` posts the file through a Server Action, which caps
 * the request body at 1MB — fine for a small logo, not for a photograph off a
 * phone or a video. See lib/supabase/upload.ts for why this route is safe.
 */
export function MediaField({
    value,
    onChange,
    accept,
    folder,
    label,
    helper,
    className,
}: MediaFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const isVideo = accept === "video";
    const types = isVideo ? ARCHIVE_VIDEO_TYPES : ARCHIVE_IMAGE_TYPES;

    const handleFile = async (file: File | undefined | null) => {
        setError(null);
        if (!file) return;

        // The shared validator also covers the other family, so reject a file of
        // the wrong kind before it reaches it — dropping a video on the cover
        // field would otherwise upload happily and render nothing.
        if (!types.includes(file.type)) {
            setError(
                isVideo
                    ? "শুধু ভিডিও ফাইল (MP4, WEBM, MOV) দেওয়া যাবে।"
                    : "শুধু ছবি (JPG, PNG, WEBP, AVIF) দেওয়া যাবে।"
            );
            return;
        }

        const invalid = describeArchiveFileError(file);
        if (invalid) {
            setError(invalid);
            return;
        }

        setBusy(true);
        const result = await uploadToMedia(file, folder);
        setBusy(false);

        if (result.ok) onChange(result.url);
        else setError(result.error);
    };

    return (
        <div className={cn("space-y-2", className)}>
            <span className="flex text-sm font-medium text-ink-700">{label}</span>

            <div
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    void handleFile(event.dataTransfer.files?.[0]);
                }}
                className={cn(
                    "relative aspect-video overflow-hidden rounded-xl border-2 border-dashed transition-ui",
                    dragging
                        ? "border-brand-600 bg-brand-50"
                        : "border-ink-300 bg-surface-sunken",
                    error && "border-danger"
                )}
            >
                {value ? (
                    <>
                        {isVideo ? (
                            <video
                                src={value}
                                controls
                                preload="metadata"
                                playsInline
                                className="size-full bg-ink-950 object-contain"
                            />
                        ) : (
                            <Image
                                src={value}
                                alt=""
                                fill
                                unoptimized
                                sizes="(min-width: 1024px) 33vw, 100vw"
                                className="object-cover"
                            />
                        )}

                        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-ink-950/80 to-transparent p-3">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                disabled={busy}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/95 px-3 text-sm font-medium text-ink-900 transition-ui hover:bg-white disabled:opacity-60"
                            >
                                <UploadCloud className="size-4" aria-hidden="true" />
                                পরিবর্তন
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    onChange(null);
                                    setError(null);
                                }}
                                disabled={busy}
                                className="inline-flex size-9 items-center justify-center rounded-lg bg-white/95 text-danger transition-ui hover:bg-white disabled:opacity-60"
                                aria-label="সরান"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center transition-ui hover:bg-brand-50/50 disabled:opacity-60"
                    >
                        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                            {isVideo ? (
                                <Film className="size-5" aria-hidden="true" />
                            ) : (
                                <ImagePlus className="size-5" aria-hidden="true" />
                            )}
                        </span>
                        <span className="text-sm font-medium text-ink-700">
                            {isVideo
                                ? "ভিডিও টেনে আনুন বা ক্লিক করুন"
                                : "ছবি টেনে আনুন বা ক্লিক করুন"}
                        </span>
                        <span className="text-xs text-ink-500">
                            {isVideo
                                ? "MP4, WEBM, MOV · সর্বোচ্চ ৫০ MB"
                                : "JPG, PNG, WEBP · সর্বোচ্চ ৮ MB"}
                        </span>
                    </button>
                )}

                {busy && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-surface/80 text-sm font-medium text-ink-700 backdrop-blur-sm">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        আপলোড হচ্ছে…
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={types.join(",")}
                className="sr-only"
                aria-label={label}
                onChange={(event) => {
                    void handleFile(event.target.files?.[0]);
                    // Reset so picking the same file twice still fires onChange.
                    event.target.value = "";
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
