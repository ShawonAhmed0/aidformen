"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";

import { summarizeRange } from "@/lib/actions/chat-summaries";
import type { RangeSummary as Summary } from "@/lib/content/chat-reports";
import { useAdminLocale } from "./AdminLocale";

const copy = {
    bn: {
        title: "AI সারসংক্ষেপ",
        writing: "AI এই সময়ের চ্যাটগুলোর সারসংক্ষেপ লিখছে…",
        regenerate: "আবার লিখুন",
        failed: "সারসংক্ষেপ তৈরি করা যায়নি।",
        retry: "আবার চেষ্টা করুন",
        written: (when: string) => `লেখা হয়েছে ${when}`,
    },
    en: {
        title: "AI summary",
        writing: "The AI is summarising the chats in this period…",
        regenerate: "Rewrite",
        failed: "Couldn't write the summary.",
        retry: "Try again",
        written: (when: string) => `Written ${when}`,
    },
};

/**
 * Claude's summary of the chats in a date range.
 *
 * Shows the cached summary when it was written from the same number of chats
 * as there are now; otherwise writes a fresh one as soon as the card mounts,
 * so the admin never has to ask for it.
 */
export function RangeSummary({
    from,
    to,
    initial,
    count,
}: {
    from: string;
    to: string;
    initial: Summary | null;
    /** Counted chats in the range right now. */
    count: number;
}) {
    const locale = useAdminLocale();
    const t = copy[locale];
    const [summary, setSummary] = useState(initial);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();
    const requested = useRef(false);

    const write = () => {
        setError(null);
        startTransition(async () => {
            const result = await summarizeRange(from, to).catch(() => null);
            if (!result?.ok || !result.data) {
                setError(result && !result.ok ? result.error : t.failed);
                return;
            }
            setSummary(result.data);
        });
    };

    const stale = !summary || summary.chat_count !== count;
    useEffect(() => {
        // Once per mount: development runs effects twice.
        if (!stale || requested.current) return;
        requested.current = true;
        write();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const text = summary ? (locale === "en" ? summary.summary_en : summary.summary_bn) : null;
    const when = summary
        ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "bn-BD", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Dhaka",
          }).format(new Date(summary.generated_at))
        : null;

    return (
        <section
            aria-labelledby="range-summary"
            aria-busy={pending}
            className="rounded-xl border border-brand-200 bg-brand-50 p-5 sm:p-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="range-summary" className="flex items-center gap-2 text-base font-semibold text-ink-900">
                    <Sparkles className="size-4.5 text-brand-700" aria-hidden="true" />
                    {t.title}
                </h2>
                {summary && !pending && (
                    <button
                        type="button"
                        onClick={write}
                        data-print-hide
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand-800 transition-ui hover:bg-brand-100"
                    >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        {t.regenerate}
                    </button>
                )}
            </div>

            {pending ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-ink-600">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t.writing}
                </p>
            ) : error && !text ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-danger">
                    {error}
                    <button type="button" onClick={write} className="font-medium text-brand-800 underline underline-offset-4">
                        {t.retry}
                    </button>
                </div>
            ) : null}

            {text && (
                // Kept on screen while a rewrite runs, dimmed, rather than flashing away.
                <div className={pending ? "opacity-50 transition-ui" : "transition-ui"}>
                    <p className="mt-3 text-[0.97rem] leading-7 text-ink-800">{text}</p>
                    {when && <p className="mt-2 text-xs text-ink-500">{t.written(when)}</p>}
                </div>
            )}
        </section>
    );
}
