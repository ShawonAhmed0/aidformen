"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteNewsletterSubscriber } from "@/lib/actions/newsletter";
import { Button } from "@/components/ui/button";
import type { NewsletterSubscriber } from "@/lib/types/content";

const dateFormat = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" });

/**
 * The subscriber list, with the two things an editor actually does with it:
 * take the addresses to a mail tool (copy or CSV), and remove one on request.
 */
export function NewsletterManager({ subscribers }: { subscribers: NewsletterSubscriber[] }) {
    const router = useRouter();
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
            toast.success("ইমেইলটি তালিকা থেকে সরানো হয়েছে।");
            router.refresh();
        });
    };

    return (
        <div className="rounded-xl border border-ink-200 bg-surface p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-ink-900">সাবস্ক্রাইবার</h2>
                    <p className="mt-1 text-sm text-ink-500 tabular-nums">
                        মোট {new Intl.NumberFormat("bn-BD").format(subscribers.length)} জন
                    </p>
                </div>

                {subscribers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => void copyAll()}>
                            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                            {copied ? "কপি হয়েছে" : "সব ইমেইল কপি করুন"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={downloadCsv}>
                            <Download aria-hidden="true" />
                            CSV ডাউনলোড
                        </Button>
                    </div>
                )}
            </div>

            {subscribers.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-ink-300 px-6 py-12 text-center text-sm text-ink-500">
                    এখনো কেউ সাবস্ক্রাইব করেননি।
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
                                {dateFormat.format(new Date(subscriber.created_at))}
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
                                        সরান
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={pending}
                                        onClick={() => setConfirming(null)}
                                    >
                                        বাতিল
                                    </Button>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setConfirming(subscriber.id)}
                                    aria-label={`${subscriber.email} সরান`}
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
