"use client";

import { useRef, useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    ExternalLink,
    FileUp,
    Link2,
    Loader2,
    Trash2,
} from "lucide-react";

import { uploadDocumentToMedia } from "@/lib/supabase/upload";
import type { ArchiveAttachmentKind } from "@/lib/types/archive";
import { BilingualField } from "./BilingualField";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type AttachmentDraft = {
    kind: ArchiveAttachmentKind;
    label: string;
    label_en: string;
    url: string;
    mime_type: string;
};

function labelFromFile(name: string) {
    return name.replace(/\.(pdf|docx?)$/i, "").replace(/[-_]+/g, " ").trim();
}

function documentMime(file: File) {
    const name = file.name.toLowerCase();
    if (file.type) return file.type;
    if (name.endsWith(".pdf")) return "application/pdf";
    if (name.endsWith(".docx")) {
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    return "application/msword";
}

/** Ordered downloads and external evidence links attached to one archive item. */
export function ArchiveAttachmentsEditor({
    attachments,
    onChange,
    max,
}: {
    attachments: AttachmentDraft[];
    onChange: (attachments: AttachmentDraft[]) => void;
    max: number;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = (index: number, patch: Partial<AttachmentDraft>) => {
        onChange(
            attachments.map((attachment, current) =>
                current === index ? { ...attachment, ...patch } : attachment
            )
        );
    };

    const move = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= attachments.length) return;
        const next = [...attachments];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    const addExternal = () => {
        setError(null);
        if (attachments.length >= max) {
            setError(`সর্বোচ্চ ${max}টি রেফারেন্স যোগ করা যাবে।`);
            return;
        }
        onChange([
            ...attachments,
            {
                kind: "external_link",
                label: "",
                label_en: "",
                url: "",
                mime_type: "",
            },
        ]);
    };

    const addDocuments = async (files: FileList | null) => {
        setError(null);
        if (!files?.length) return;

        const room = max - attachments.length;
        if (room <= 0) {
            setError(`সর্বোচ্চ ${max}টি রেফারেন্স যোগ করা যাবে।`);
            return;
        }

        const selected = Array.from(files).slice(0, room);
        const added: AttachmentDraft[] = [];
        const failed: string[] = [];
        setUploading(true);

        for (const file of selected) {
            const result = await uploadDocumentToMedia(file, "documents");
            if (result.ok) {
                added.push({
                    kind: "document",
                    label: labelFromFile(file.name) || "রেফারেন্স ডকুমেন্ট",
                    label_en: "",
                    url: result.url,
                    mime_type: documentMime(file),
                });
            } else {
                failed.push(file.name);
            }
        }

        setUploading(false);
        if (added.length) onChange([...attachments, ...added]);
        if (selected.length < files.length || failed.length) {
            setError(
                failed.length
                    ? `আপলোড করা যায়নি: ${failed.join(", ")}`
                    : `সর্বোচ্চ ${max}টি রেফারেন্স রাখা যাবে; অতিরিক্ত ফাইল বাদ দেওয়া হয়েছে।`
            );
        }
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h4 className="font-semibold text-ink-900">
                        রেফারেন্স ও ডাউনলোড
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-ink-500">
                        PDF/Word নথি বা বিশ্বস্ত HTTPS লিঙ্ক যোগ করুন। এগুলো শুধু বিস্তারিত পাতায় দেখাবে।
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={addExternal}
                        disabled={uploading || attachments.length >= max}
                        className={addButtonClass}
                    >
                        <Link2 className="size-4" aria-hidden="true" />
                        বাহ্যিক লিঙ্ক
                    </button>
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading || attachments.length >= max}
                        className={addButtonClass}
                    >
                        {uploading ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <FileUp className="size-4" aria-hidden="true" />
                        )}
                        ডকুমেন্ট আপলোড
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx"
                        className="sr-only"
                        aria-label="রেফারেন্স ডকুমেন্ট আপলোড"
                        onChange={(event) => void addDocuments(event.target.files)}
                    />
                </div>
            </div>

            {error && (
                <p role="alert" className="text-xs font-medium text-danger">
                    {error}
                </p>
            )}

            {attachments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-300 px-6 py-7 text-center text-sm text-ink-500">
                    কোনো রেফারেন্স ডকুমেন্ট বা লিঙ্ক যোগ করা হয়নি।
                </p>
            ) : (
                <ul className="space-y-3">
                    {attachments.map((attachment, index) => (
                        <li
                            key={`${attachment.kind}-${attachment.url}-${index}`}
                            className="rounded-xl border border-ink-200 bg-surface p-4"
                        >
                            <div className="flex items-start gap-3">
                                <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                                    {attachment.kind === "document" ? (
                                        <FileUp className="size-4" aria-hidden="true" />
                                    ) : (
                                        <ExternalLink className="size-4" aria-hidden="true" />
                                    )}
                                </span>
                                <div className="min-w-0 flex-1 space-y-3">
                                    <BilingualField
                                        label="রেফারেন্সের নাম"
                                        value={attachment.label}
                                        onChange={(value) => update(index, { label: value })}
                                        valueEn={attachment.label_en}
                                        onChangeEn={(value) =>
                                            update(index, { label_en: value })
                                        }
                                        placeholder="যেমন: মামলার আদেশের কপি"
                                    />

                                    {attachment.kind === "external_link" ? (
                                        <Input
                                            type="url"
                                            inputMode="url"
                                            aria-label="রেফারেন্সের HTTPS লিঙ্ক"
                                            value={attachment.url}
                                            onChange={(event) =>
                                                update(index, { url: event.target.value })
                                            }
                                            placeholder="https://…"
                                        />
                                    ) : (
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block truncate text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
                                        >
                                            {attachment.url.split("/").pop() || "ডকুমেন্ট খুলুন"}
                                        </a>
                                    )}
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => move(index, -1)}
                                        disabled={index === 0}
                                        className={iconButtonClass}
                                        aria-label="উপরে সরান"
                                    >
                                        <ArrowUp className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(index, 1)}
                                        disabled={index === attachments.length - 1}
                                        className={iconButtonClass}
                                        aria-label="নিচে সরান"
                                    >
                                        <ArrowDown className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onChange(
                                                attachments.filter((_, current) => current !== index)
                                            )
                                        }
                                        className="flex size-9 items-center justify-center rounded-lg text-danger transition-ui hover:bg-danger-soft"
                                        aria-label="রেফারেন্স সরান"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const addButtonClass = cn(
    "inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink-300",
    "bg-surface px-3.5 text-sm font-medium text-ink-800 transition-ui",
    "hover:border-brand-400 hover:text-brand-800 disabled:opacity-50"
);

const iconButtonClass = cn(
    "flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui",
    "hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
);
