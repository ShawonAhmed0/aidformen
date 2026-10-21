"use client";

import { useId, useRef, useState } from "react";
import {
    Bold,
    Heading2,
    Heading3,
    ImagePlus,
    Italic,
    Languages,
    Link2,
    List,
    ListOrdered,
    Loader2,
    Quote,
} from "lucide-react";

import {
    ARCHIVE_IMAGE_TYPES,
    describeArchiveFileError,
    uploadToMedia,
} from "@/lib/supabase/upload";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

type EditorialTextFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    valueEn: string;
    onChangeEn: (value: string) => void;
    rows?: number;
    required?: boolean;
    helper?: string;
    className?: string;
};

type Tool = {
    label: string;
    icon: typeof Bold;
    action: "bold" | "italic" | "h2" | "h3" | "bullet" | "number" | "quote";
};

const tools: Tool[] = [
    { label: "বোল্ড", icon: Bold, action: "bold" },
    { label: "ইটালিক", icon: Italic, action: "italic" },
    { label: "বড় শিরোনাম", icon: Heading2, action: "h2" },
    { label: "ছোট শিরোনাম", icon: Heading3, action: "h3" },
    { label: "বুলেট তালিকা", icon: List, action: "bullet" },
    { label: "নম্বর তালিকা", icon: ListOrdered, action: "number" },
    { label: "উদ্ধৃতি", icon: Quote, action: "quote" },
];

function baseName(fileName: string) {
    return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

/**
 * Bilingual long-form editor backed by the archive's existing text columns.
 * The toolbar writes a deliberately small Markdown subset rendered by
 * EditorialContent; it never stores HTML.
 */
export function EditorialTextField({
    label,
    value,
    onChange,
    valueEn,
    onChangeEn,
    rows = 8,
    required = false,
    helper,
    className,
}: EditorialTextFieldProps) {
    const [lang, setLang] = useState<"bn" | "en">("bn");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const id = useId();
    const fieldId = `${id}-${lang}`;

    const isBn = lang === "bn";
    const current = isBn ? value : valueEn;
    const setCurrent = isBn ? onChange : onChangeEn;

    const replaceSelection = (
        replacement: string,
        selectFrom = replacement.length,
        selectTo = replacement.length
    ) => {
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? current.length;
        const end = textarea?.selectionEnd ?? current.length;
        const next = `${current.slice(0, start)}${replacement}${current.slice(end)}`;
        setCurrent(next);

        requestAnimationFrame(() => {
            const control = textareaRef.current;
            if (!control) return;
            control.focus();
            control.setSelectionRange(start + selectFrom, start + selectTo);
        });
    };

    const wrap = (before: string, after: string, placeholder: string) => {
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? current.length;
        const end = textarea?.selectionEnd ?? current.length;
        const chosen = current.slice(start, end) || placeholder;
        replaceSelection(
            `${before}${chosen}${after}`,
            before.length,
            before.length + chosen.length
        );
    };

    const prefixLines = (prefix: string | ((index: number) => string), placeholder: string) => {
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? current.length;
        const end = textarea?.selectionEnd ?? current.length;
        const chosen = current.slice(start, end) || placeholder;
        const replacement = chosen
            .split("\n")
            .map((line, index) => `${typeof prefix === "function" ? prefix(index) : prefix}${line}`)
            .join("\n");
        replaceSelection(replacement, 0, replacement.length);
    };

    const applyTool = (action: Tool["action"]) => {
        setError(null);
        if (action === "bold") return wrap("**", "**", "গুরুত্বপূর্ণ লেখা");
        if (action === "italic") return wrap("_", "_", "বিশেষ লেখা");
        if (action === "h2") return prefixLines("## ", "শিরোনাম");
        if (action === "h3") return prefixLines("### ", "উপশিরোনাম");
        if (action === "bullet") return prefixLines("- ", "তালিকার বিষয়");
        if (action === "number") return prefixLines((index) => `${index + 1}. `, "তালিকার বিষয়");
        return prefixLines("> ", "উদ্ধৃতি");
    };

    const addLink = () => {
        setError(null);
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? current.length;
        const end = textarea?.selectionEnd ?? current.length;
        const selected = current.slice(start, end) || "লিঙ্কের লেখা";
        const raw = window.prompt("HTTPS লিঙ্ক দিন", "https://");
        if (!raw) return;

        try {
            const url = new URL(raw);
            if (url.protocol !== "https:") throw new Error("unsafe");
            const replacement = `[${selected}](${url.toString()})`;
            replaceSelection(replacement, 1, 1 + selected.length);
        } catch {
            setError("শুধু সঠিক HTTPS লিঙ্ক যোগ করা যাবে।");
        }
    };

    const addImage = async (file: File | undefined) => {
        setError(null);
        if (!file) return;
        if (!ARCHIVE_IMAGE_TYPES.includes(file.type)) {
            setError("শুধু JPG, PNG, WEBP অথবা AVIF ছবি যোগ করা যাবে।");
            return;
        }

        const invalid = describeArchiveFileError(file);
        if (invalid) {
            setError(invalid);
            return;
        }

        setUploading(true);
        const result = await uploadToMedia(file, "archive");
        setUploading(false);

        if (!result.ok) {
            setError(result.error);
            return;
        }

        const caption = baseName(file.name) || (isBn ? "সংবাদচিত্র" : "News image");
        const leading = current.trim() ? "\n\n" : "";
        replaceSelection(`${leading}![${caption}](${result.url})\n\n`);
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={fieldId} className="text-sm font-medium text-ink-700">
                    {label}
                    {required && (
                        <span className="ms-1 text-danger" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>

                <div
                    role="tablist"
                    aria-label={`${label} — ভাষা`}
                    className="flex items-center gap-0.5 rounded-lg bg-ink-100 p-0.5"
                >
                    {(
                        [
                            ["bn", "বাংলা", value],
                            ["en", "English", valueEn],
                        ] as const
                    ).map(([key, text, content]) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={lang === key}
                            onClick={() => {
                                setLang(key);
                                setError(null);
                            }}
                            className={cn(
                                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-ui",
                                lang === key
                                    ? "bg-surface text-ink-900 shadow-xs"
                                    : "text-ink-500 hover:text-ink-800"
                            )}
                        >
                            {text}
                            {key === "en" && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "size-1.5 rounded-full",
                                        content.trim() ? "bg-success" : "bg-ink-300"
                                    )}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-input bg-surface focus-within:border-brand-600">
                <div
                    role="toolbar"
                    aria-label={`${label} সম্পাদনার সরঞ্জাম`}
                    className="flex flex-wrap items-center gap-0.5 border-b border-ink-200 bg-surface-sunken p-1.5"
                >
                    {tools.map(({ label: toolLabel, icon: Icon, action }) => (
                        <button
                            key={action}
                            type="button"
                            title={toolLabel}
                            aria-label={toolLabel}
                            onClick={() => applyTool(action)}
                            className="flex size-9 items-center justify-center rounded-md text-ink-600 transition-ui hover:bg-surface hover:text-brand-800"
                        >
                            <Icon className="size-4" aria-hidden="true" />
                        </button>
                    ))}

                    <span aria-hidden="true" className="mx-1 h-5 w-px bg-ink-200" />

                    <button
                        type="button"
                        title="লিঙ্ক যোগ করুন"
                        aria-label="লিঙ্ক যোগ করুন"
                        onClick={addLink}
                        className="flex size-9 items-center justify-center rounded-md text-ink-600 transition-ui hover:bg-surface hover:text-brand-800"
                    >
                        <Link2 className="size-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        title="লেখার মাঝে কেন্দ্রে ছবি যোগ করুন"
                        aria-label="লেখার মাঝে কেন্দ্রে ছবি যোগ করুন"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                        className="flex size-9 items-center justify-center rounded-md text-ink-600 transition-ui hover:bg-surface hover:text-brand-800 disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <ImagePlus className="size-4" aria-hidden="true" />
                        )}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept={ARCHIVE_IMAGE_TYPES.join(",")}
                        className="sr-only"
                        tabIndex={-1}
                        onChange={(event) => void addImage(event.target.files?.[0])}
                    />
                </div>

                <Textarea
                    ref={textareaRef}
                    id={fieldId}
                    key={fieldId}
                    value={current}
                    rows={rows}
                    required={required && isBn}
                    onChange={(event) => setCurrent(event.target.value)}
                    placeholder={
                        isBn
                            ? "এখানে বিস্তারিত লিখুন…"
                            : "English translation (optional)"
                    }
                    className="min-h-40 resize-y rounded-none border-0 focus:border-0"
                />
            </div>

            {error && (
                <p role="alert" className="text-xs font-medium text-danger">
                    {error}
                </p>
            )}
            {isBn ? (
                <p className="text-xs leading-5 text-ink-500">
                    {helper ||
                        "লেখা নির্বাচন করে format করুন। Image বাটনে ছবি দিলে cursor-এর জায়গায় কেন্দ্রে বসবে।"}
                </p>
            ) : (
                !valueEn.trim() && (
                    <p className="flex items-center gap-1.5 text-xs text-ink-500">
                        <Languages className="size-3.5" aria-hidden="true" />
                        খালি রাখলে ইংরেজি সাইটে বাংলা লেখাটিই দেখাবে।
                    </p>
                )
            )}
        </div>
    );
}
