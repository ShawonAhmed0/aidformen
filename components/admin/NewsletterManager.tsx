"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteNewsletterSubscriber } from "@/lib/actions/newsletter";
import { Button } from "@/components/ui/button";
import type { AdminLocale } from "@/lib/i18n/admin";
import type { NewsletterSubscriber } from "@/lib/types/content";
import { useAdminLocale } from "./AdminLocale";

const copy = {
    bn: {
        removed: "ইমেইলটি তালিকা থেকে সরানো হয়েছে।",
        heading: "সাবস্ক্রাইবার",
        total: (count: string) => `মোট ${count} জন`,
        copied: "কপি হয়েছে",
        copyAll: "সব ইমেইল কপি করুন",
        downloadCsv: "CSV ডাউনলোড",
        empty: "এখনো কেউ সাবস্ক্রাইব করেননি।",
        remove: "সরান",
        cancel: "বাতিল",
        removeLabel: (email: string) => `${email} সরান`,
    },
    en: {
        removed: "The email was removed from the list.",
        heading: "Subscribers",
        total: (count: string) => `${count} in total`,
        copied: "Copied",
        copyAll: "Copy all emails",
        downloadCsv: "Download CSV",
        empty: "No one has subscribed yet.",
        remove: "Remove",
        cancel: "Cancel",
        removeLabel: (email: string) => `Remove ${email}`,
    },
};

const dateFormat: Record<AdminLocale, Intl.DateTimeFormat> = {
    bn: new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" }),
    en: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }),
};

const numberFormat: Record<AdminLocale, Intl.NumberFormat> = {
    bn: new Intl.NumberFormat("bn-BD"),
    en: new Intl.NumberFormat("en-GB"),
};

/**
 * The subscriber list, with the two things an editor actually does with it:
 * take the addresses to a mail tool (copy or CSV), and remove one on request.
 */
export function NewsletterManager({ subscribers }: { subscribers: NewsletterSubscriber[] }) {
    const router = useRouter();
    const locale = useAdminLocale();
    const t = copy[locale];
    const [pending, startTransition] = useTransition();
    const [confirming, setConfirming] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const copyAll = async () => {
        await navigator.clipboard.writeText(subscribers.map((s) => s.email).join(", "));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    const downloadCsv = () => {
        const rows = [
            "email,subscribed_at",
            ...subscribers.map((s) => `${s.email},${s.created_at}`),
        ];
        const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const remove = (id: string) => {
        startTransition(async () => {
            const result = await deleteNewsletterSubscriber(id);
            setConfirming(null);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success(t.removed);
            router.refresh();
        });
    };

    return (
        <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-ink-900">{t.heading}</h2>
                    <p className="mt-1 text-sm text-ink-500 tabular-nums">
                        {t.total(numberFormat[locale].format(subscribers.length))}
                    </p>
                </div>

                {subscribers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => void copyAll()}>
                            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                            {copied ? t.copied : t.copyAll}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={downloadCsv}>
                            <Download aria-hidden="true" />
                            {t.downloadCsv}
                        </Button>
                    </div>
                )}
            </div>

            {subscribers.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-ink-300 px-6 py-12 text-center text-sm text-ink-500">
                    {t.empty}
                </p>
            ) : (
                <ul className="mt-6 divide-y divide-ink-200 rounded-xl border border-ink-200">
                    {subscribers.map((subscriber) => (
                        <li key={subscriber.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <Mail className="size-4 shrink-0 text-ink-400" aria-hidden="true" />
                            <a
                                href={`mailto:${subscriber.email}`}
                                className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 hover:text-brand-700"
                            >
                                {subscriber.email}
                            </a>
                            <time
                                dateTime={subscriber.created_at}
                                className="text-xs text-ink-500 tabular-nums"
                            >
                                {dateFormat[locale].format(new Date(subscriber.created_at))}
                            </time>

                            {confirming === subscriber.id ? (
                                <span className="flex gap-1.5">
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        disabled={pending}
                                        onClick={() => remove(subscriber.id)}
                                    >
                                        {pending ? (
                                            <Loader2 className="animate-spin" aria-hidden="true" />
                                        ) : (
                                            <Trash2 aria-hidden="true" />
                                        )}
                                        {t.remove}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={pending}
                                        onClick={() => setConfirming(null)}
                                    >
                                        {t.cancel}
                                    </Button>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setConfirming(subscriber.id)}
                                    aria-label={t.removeLabel(subscriber.email)}
                                    className="flex size-9 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-danger-soft hover:text-danger"
                                >
                                    <Trash2 className="size-4" aria-hidden="true" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
