"use client";

import { useId, useState } from "react";
import { Languages } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BilingualFieldProps = {
    label: string;
    /** Bengali value — the source language, always required-ish. */
    value: string;
    onChange: (value: string) => void;
    /** English value — nullable; blank means "not translated". */
    valueEn: string;
    onChangeEn: (value: string) => void;
    multiline?: boolean;
    rows?: number;
    required?: boolean;
    placeholder?: string;
    helper?: string;
    className?: string;
};

/**
 * Paired Bengali / English input.
 *
 * Bengali is the source language and English is optional — when the English
 * box is empty the site falls back to Bengali (see `pick()` in lib/i18n).
 * The tab shows a dot when a translation exists, so an editor can see at a
 * glance which fields are still untranslated without opening each one.
 */
export function BilingualField({
    label,
    value,
    onChange,
    valueEn,
    onChangeEn,
    multiline = false,
    rows = 4,
    required = false,
    placeholder,
    helper,
    className,
}: BilingualFieldProps) {
    const [lang, setLang] = useState<"bn" | "en">("bn");
    const id = useId();
    const fieldId = `${id}-${lang}`;

    const isBn = lang === "bn";
    const current = isBn ? value : valueEn;
    const setCurrent = isBn ? onChange : onChangeEn;

    const Control = multiline ? Textarea : Input;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                    htmlFor={fieldId}
                    className="flex items-center gap-1.5 text-sm font-medium text-ink-700"
                >
                    {label}
                    {required && (
                        <span className="text-danger" aria-hidden="true">
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
                    ).map(([key, text, content]) => {
                        const active = lang === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setLang(key)}
                                className={cn(
                                    "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-ui",
                                    active
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
                        );
                    })}
                </div>
            </div>

            <Control
                id={fieldId}
                // Keying on lang so React swaps the element instead of reusing
                // one control across two different values.
                key={fieldId}
                value={current}
                rows={multiline ? rows : undefined}
                onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
                    setCurrent(e.target.value)
                }
                placeholder={
                    isBn ? placeholder : "ইংরেজি অনুবাদ (ঐচ্ছিক)"
                }
                className={multiline ? "resize-y" : undefined}
            />

            {isBn
                ? helper && <p className="text-xs text-ink-500">{helper}</p>
                : !valueEn.trim() && (
                      <p className="flex items-center gap-1.5 text-xs text-ink-500">
                          <Languages className="size-3.5" aria-hidden="true" />
                          খালি রাখলে ইংরেজি সাইটে বাংলা লেখাটিই দেখাবে।
                      </p>
                  )}
        </div>
    );
}
