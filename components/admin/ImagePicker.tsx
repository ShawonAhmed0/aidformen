"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";

import { uploadImage, type MediaFolder } from "@/lib/actions/media";
import { cn } from "@/lib/utils";

type ImagePickerProps = {
    /** Current image URL, or null for empty. */
    value: string | null;
    onChange: (url: string | null) => void;
    /** Storage folder, keeps the bucket organised. */
    folder: MediaFolder;
    label?: string;
    /** Aspect of the preview box. */
    aspect?: "video" | "square" | "wide";
    className?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

const aspects = {
    video: "aspect-video",
    square: "aspect-square",
    wide: "aspect-3/1",
} as const;

/**
 * Drag-and-drop image field used by every admin editor.
 *
 * Validates type and size on the client before spending an upload round trip,
 * then hands the file to the `uploadImage` action which re-checks both — the
 * client check is for speed and feedback, not for trust.
 */
export function ImagePicker({
    value,
    onChange,
    folder,
    label = "ছবি",
    aspect = "video",
    className,
}: ImagePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = (file: File | undefined | null) => {
        setError(null);
        if (!file) return;

        if (!ALLOWED.includes(file.type)) {
            setError("শুধু JPG, PNG, WEBP, AVIF বা GIF ফাইল দেওয়া যাবে।");
            return;
        }
        if (file.size > MAX_BYTES) {
            setError("ছবির আকার ৫ মেগাবাইটের কম হতে হবে।");
            return;
        }

        const body = new FormData();
        body.append("file", file);
        body.append("folder", folder);

        startTransition(async () => {
            const result = await uploadImage(body);
            if (result.ok) {
                onChange(result.data?.url ?? null);
            } else {
                setError(result.error);
            }
        });
    };

    return (
        <div className={cn("space-y-2", className)}>
            <span className="flex text-sm font-medium text-ink-700">{label}</span>

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
                            className="object-cover"
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
                                পরিবর্তন
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    onChange(null);
                                    setError(null);
                                }}
                                disabled={pending}
                                className="inline-flex size-9 items-center justify-center rounded-lg bg-white/95 text-danger transition-ui hover:bg-white disabled:opacity-60"
                                aria-label="ছবি সরান"
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
                            ছবি টেনে আনুন বা ক্লিক করুন
                        </span>
                        <span className="text-xs text-ink-500">
                            JPG, PNG, WEBP · সর্বোচ্চ ৫ MB
                        </span>
                    </button>
                )}

                {pending && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-surface/80 text-sm font-medium text-ink-700 backdrop-blur-sm">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        আপলোড হচ্ছে…
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={ALLOWED.join(",")}
                className="sr-only"
                aria-label={label}
                onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    // Reset so picking the same file twice still fires onChange.
                    e.target.value = "";
                }}
            />

            {error && (
                <p role="alert" className="text-xs font-medium text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
