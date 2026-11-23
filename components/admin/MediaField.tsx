"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
    Crop,
    Film,
    ImagePlus,
    Loader2,
    Music2,
    Trash2,
    UploadCloud,
} from "lucide-react";

import {
    ARCHIVE_AUDIO_TYPES,
    ARCHIVE_IMAGE_TYPES,
    ARCHIVE_VIDEO_TYPES,
    describeArchiveFileError,
    uploadToMedia,
} from "@/lib/supabase/upload";
import type { MediaFolder } from "@/lib/types/media";
import { cn } from "@/lib/utils";
import { useAdminLocale } from "./AdminLocale";
import { ImageCropDialog, type AspectId } from "./ImageCropDialog";

type MediaFieldProps = {
    value: string | null;
    onChange: (url: string | null) => void;
    /** Which editorial file family this field accepts. */
    accept: "image" | "video" | "audio";
    folder: MediaFolder;
    label: string;
    helper?: string;
    className?: string;
    /**
     * Images only: open the crop dialog on this frame shape when a photo is
     * picked, and offer "Adjust" on the current one.
     */
    crop?: AspectId;
};

const copy = {
    bn: {
        wrongType: {
            video: "শুধু ভিডিও ফাইল (MP4, WEBM, MOV) দেওয়া যাবে।",
            audio: "শুধু অডিও ফাইল (MP3, M4A, OGG, WAV) দেওয়া যাবে।",
            image: "শুধু ছবি (JPG, PNG, WEBP, AVIF) দেওয়া যাবে।",
        },
        noAudioSupport: "আপনার ব্রাউজার অডিও চালাতে পারছে না।",
        change: "পরিবর্তন",
        adjust: "ঠিক করুন",
        remove: "সরান",
        drop: {
            video: "ভিডিও টেনে আনুন বা ক্লিক করুন",
            audio: "অডিও টেনে আনুন বা ক্লিক করুন",
            image: "ছবি টেনে আনুন বা ক্লিক করুন",
        },
        hint: {
            video: "MP4, WEBM, MOV · সর্বোচ্চ ৫০ MB",
            audio: "MP3, M4A, OGG, WAV · সর্বোচ্চ ২৫ MB",
            image: "JPG, PNG, WEBP · বড় ছবি নিজে থেকেই ছোট হবে",
        },
        uploading: "আপলোড হচ্ছে…",
    },
    en: {
        wrongType: {
            video: "Only video files (MP4, WEBM, MOV) are accepted.",
            audio: "Only audio files (MP3, M4A, OGG, WAV) are accepted.",
            image: "Only images (JPG, PNG, WEBP, AVIF) are accepted.",
        },
        noAudioSupport: "Your browser cannot play this audio.",
        change: "Change",
        adjust: "Adjust",
        remove: "Remove",
        drop: {
            video: "Drag a video here or click",
            audio: "Drag an audio file here or click",
            image: "Drag an image here or click",
        },
        hint: {
            video: "MP4, WEBM, MOV · up to 50 MB",
            audio: "MP3, M4A, OGG, WAV · up to 25 MB",
            image: "JPG, PNG, WEBP · large images are resized automatically",
        },
        uploading: "Uploading…",
    },
};

/**
 * Single-file field that uploads straight to storage.
 *
 * Like `ImagePicker`, it never routes the file through a Server Action, whose
 * 1 MB body cap a phone photo or a video would exceed. See
 * lib/supabase/upload.ts for why this route is safe.
 */
export function MediaField({
    value,
    onChange,
    accept,
    folder,
    label,
    helper,
    className,
    crop,
}: MediaFieldProps) {
    const t = copy[useAdminLocale()];
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    // A picked photo (or the current one) waiting in the crop dialog.
    const [cropping, setCropping] = useState<File | string | null>(null);
    const [pickedFile, setPickedFile] = useState<File | null>(null);

    const isVideo = accept === "video";
    const isAudio = accept === "audio";
    const types = isVideo
        ? ARCHIVE_VIDEO_TYPES
        : isAudio
          ? ARCHIVE_AUDIO_TYPES
          : ARCHIVE_IMAGE_TYPES;

    const handleFile = async (file: File | undefined | null) => {
        setError(null);
        if (!file) return;

        // The shared validator also covers the other family, so reject a file of
        // the wrong kind before it reaches it — dropping a video on the cover
        // field would otherwise upload happily and render nothing.
        if (!types.includes(file.type)) {
            setError(t.wrongType[accept]);
            return;
        }

        const invalid = describeArchiveFileError(file);
        if (invalid) {
            setError(invalid);
            return;
        }

        if (crop && accept === "image") {
            setPickedFile(file);
            setCropping(file);
            return;
        }
        await upload(file);
    };

    const upload = async (file: File) => {
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
                    "relative overflow-hidden rounded-xl border-2 border-dashed transition-ui",
                    isAudio ? "min-h-40" : "aspect-video",
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
                        ) : isAudio ? (
                            <div className="flex size-full min-h-40 flex-col items-center justify-center gap-3 px-5 pb-14 pt-5">
                                <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                                    <Music2 className="size-5" aria-hidden="true" />
                                </span>
                                <audio
                                    src={value}
                                    controls
                                    preload="metadata"
                                    className="w-full"
                                >
                                    {t.noAudioSupport}
                                </audio>
                            </div>
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
                            {crop && accept === "image" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPickedFile(null);
                                        setCropping(value);
                                    }}
                                    disabled={busy}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/95 px-3 text-sm font-medium text-ink-900 transition-ui hover:bg-white disabled:opacity-60"
                                >
                                    <Crop className="size-4" aria-hidden="true" />
                                    {t.adjust}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                disabled={busy}
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
                                disabled={busy}
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
                        disabled={busy}
                        className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center transition-ui hover:bg-brand-50/50 disabled:opacity-60"
                    >
                        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                            {isVideo ? (
                                <Film className="size-5" aria-hidden="true" />
                            ) : isAudio ? (
                                <Music2 className="size-5" aria-hidden="true" />
                            ) : (
                                <ImagePlus className="size-5" aria-hidden="true" />
                            )}
                        </span>
                        <span className="text-sm font-medium text-ink-700">
                            {t.drop[accept]}
                        </span>
                        <span className="text-xs text-ink-500">
                            {t.hint[accept]}
                        </span>
                    </button>
                )}

                {busy && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-surface/80 text-sm font-medium text-ink-700 backdrop-blur-sm">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        {t.uploading}
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

            {crop && accept === "image" && (
                <ImageCropDialog
                    source={cropping}
                    aspect={crop}
                    onClose={() => setCropping(null)}
                    onApply={(file) => void upload(file)}
                    // Only a fresh pick has an untouched original to fall back to.
                    onUseOriginal={pickedFile ? () => void upload(pickedFile) : undefined}
                />
            )}

            {error && (
                <p role="alert" className="text-xs font-medium text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
