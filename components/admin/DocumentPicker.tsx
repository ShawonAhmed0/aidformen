"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, Trash2, UploadCloud } from "lucide-react";

import { uploadDocument } from "@/lib/actions/media";
import type { MediaFolder } from "@/lib/types/media";
import { cn } from "@/lib/utils";

type DocumentPickerProps = {
    /** Current PDF URL, or null for empty. */
    value: string | null;
    onChange: (url: string | null) => void;
    folder: MediaFolder;
    label?: string;
    helper?: string;
    className?: string;
};

const MAX_BYTES = 10 * 1024 * 1024;

/** Stored names are generated, so show the tail of the object key, not a guess. */
function fileNameFrom(url: string) {
    try {
        return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "") || "PDF";
    } catch {
        return "PDF";
    }
}

/**
 * Drag-and-drop PDF field, mirroring ImagePicker so the two read the same in a
 * form. Client-side type and size checks are for feedback only — `uploadDocument`
 * re-checks both.
 */
export function DocumentPicker({
    value,
    onChange,
    folder,
    label = "PDF",
    helper,
    className,
}: DocumentPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    // Only known for a file picked this session; a saved URL falls back to its key.
    const [uploadedName, setUploadedName] = useState<string | null>(null);

    const handleFile = (file: File | undefined | null) => {
        setError(null);
        if (!file) return;

        const looksLikePdf =
            file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (!looksLikePdf) {
            setError("শুধু PDF ফাইল দেওয়া যাবে।");
            return;
        }
        if (file.size > MAX_BYTES) {
            setError("ফাইলের আকার ১০ মেগাবাইটের কম হতে হবে।");
            return;
        }

        const body = new FormData();
        body.append("file", file);
        body.append("folder", folder);

        startTransition(async () => {
            const result = await uploadDocument(body);
            if (result.ok) {
                setUploadedName(result.data?.name ?? null);
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
                    "relative rounded-xl border-2 border-dashed transition-ui",
                    dragging
                        ? "border-brand-600 bg-brand-50"
                        : "border-ink-300 bg-surface-sunken",
                    error && "border-danger"
                )}
            >
                {value ? (
                    <div className="flex flex-wrap items-center gap-3 p-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                            <FileText className="size-5" aria-hidden="true" />
                        </span>

                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1 truncate text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
                        >
                            {uploadedName ?? fileNameFrom(value)}
                        </a>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                disabled={pending}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-300 bg-surface px-3 text-sm font-medium text-ink-800 transition-ui hover:bg-ink-50 disabled:opacity-60"
                            >
                                <UploadCloud className="size-4" aria-hidden="true" />
                                পরিবর্তন
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setUploadedName(null);
                                    onChange(null);
                                    setError(null);
                                }}
                                disabled={pending}
                                className="inline-flex size-9 items-center justify-center rounded-lg border border-ink-300 bg-surface text-danger transition-ui hover:bg-danger-soft disabled:opacity-60"
                                aria-label="ফাইল সরান"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={pending}
                        className="flex w-full flex-col items-center justify-center gap-2 px-4 py-7 text-center transition-ui hover:bg-brand-50/50 disabled:opacity-60"
                    >
                        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                            <FileText className="size-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-medium text-ink-700">
                            PDF টেনে আনুন বা ক্লিক করুন
                        </span>
                        <span className="text-xs text-ink-500">
                            শুধু PDF · সর্বোচ্চ ১০ MB
                        </span>
                    </button>
                )}

                {pending && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-surface/80 text-sm font-medium text-ink-700 backdrop-blur-sm">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        আপলোড হচ্ছে…
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                aria-label={label}
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
