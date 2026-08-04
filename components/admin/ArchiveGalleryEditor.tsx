"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";

import {
    ARCHIVE_IMAGE_TYPES,
    describeArchiveFileError,
    uploadToMedia,
} from "@/lib/supabase/upload";
import { BilingualField } from "./BilingualField";
import { cn } from "@/lib/utils";

export type GalleryPhoto = {
    url: string;
    caption: string;
    caption_en: string;
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
}: {
    photos: GalleryPhoto[];
    onChange: (photos: GalleryPhoto[]) => void;
    max: number;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);

    const addFiles = async (files: FileList | null) => {
        setError(null);
        if (!files || files.length === 0) return;

        const room = max - photos.length;
        if (room <= 0) {
            setError(`সর্বোচ্চ ${max}টি ছবি যোগ করা যাবে।`);
            return;
        }

        const chosen = Array.from(files).slice(0, room);
        if (chosen.length < files.length) {
            setError(`সর্বোচ্চ ${max}টি ছবি যোগ করা যাবে — বাকিগুলো বাদ দেওয়া হয়েছে।`);
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
            setError(
                `যোগ করা যায়নি: ${failures.join(", ")} — ছবি JPG/PNG/WEBP এবং ৮ MB-এর কম হতে হবে।`
            );
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

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <span className="flex text-sm font-medium text-ink-700">
                        গ্যালারির ছবি
                    </span>
                    <p className="mt-0.5 text-xs text-ink-500">
                        প্রথম ছবিটি কভার হিসেবে ব্যবহৃত হবে যদি আলাদা কভার না দেওয়া হয়।
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
                            {progress.done}/{progress.total} আপলোড হচ্ছে…
                        </>
                    ) : (
                        <>
                            <ImagePlus className="size-4" aria-hidden="true" />
                            ছবি যোগ করুন
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
                aria-label="গ্যালারির ছবি"
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

            {photos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-300 px-6 py-8 text-center text-sm text-ink-500">
                    এখনো কোনো ছবি যোগ করা হয়নি।
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
                                    label="ক্যাপশন"
                                    value={photo.caption}
                                    onChange={(v) => update(index, { caption: v })}
                                    valueEn={photo.caption_en}
                                    onChangeEn={(v) => update(index, { caption_en: v })}
                                    placeholder="ঐচ্ছিক — ছবিটি কী দেখাচ্ছে"
                                />
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    disabled={index === 0}
                                    className={arrowClass}
                                    aria-label="উপরে সরান"
                                >
                                    <ArrowUp className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    disabled={index === photos.length - 1}
                                    className={arrowClass}
                                    aria-label="নিচে সরান"
                                >
                                    <ArrowDown className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="flex size-9 items-center justify-center rounded-lg text-danger transition-ui hover:bg-danger-soft"
                                    aria-label="ছবি সরান"
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
