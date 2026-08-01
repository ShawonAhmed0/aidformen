"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, RotateCcw, Send, X } from "lucide-react";

import { MAX_MESSAGE_CHARS, type ChatMessage } from "@/lib/types/chatbot";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type ChatWidgetProps = {
    locale: Locale;
    botName: string;
    greeting: string;
    disclaimer: string;
    labels: {
        open: string;
        close: string;
        placeholder: string;
        send: string;
        restart: string;
        error: string;
        thinking: string;
    };
};

export function ChatWidget({
    locale,
    botName,
    greeting,
    disclaimer,
    labels,
}: ChatWidgetProps) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Follow the tail of the conversation as it streams in.
    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [messages, streaming]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    // Escape closes; abort any in-flight request when the widget unmounts.
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const send = async () => {
        const text = draft.trim();
        if (!text || streaming) return;

        setError(null);
        setDraft("");

        const next: ChatMessage[] = [...messages, { role: "user", content: text }];
        // Append an empty assistant turn up front and fill it as chunks arrive.
        setMessages([...next, { role: "assistant", content: "" }]);
        setStreaming(true);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: next, locale }),
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                const payload = await res.json().catch(() => null);
                throw new Error(payload?.error ?? labels.error);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                setMessages((prev) => {
                    const copy = [...prev];
                    const last = copy[copy.length - 1];
                    if (last?.role === "assistant") {
                        copy[copy.length - 1] = {
                            ...last,
                            content: last.content + chunk,
                        };
                    }
                    return copy;
                });
            }
        } catch (err) {
            if ((err as Error).name === "AbortError") return;
            setError((err as Error).message || labels.error);
            // Drop the empty assistant bubble so the thread does not show a gap.
            setMessages((prev) =>
                prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant" && !m.content))
            );
        } finally {
            setStreaming(false);
            abortRef.current = null;
        }
    };

    const restart = () => {
        abortRef.current?.abort();
        setMessages([]);
        setError(null);
        setDraft("");
        inputRef.current?.focus();
    };

    return (
        <>
            {/* Bottom-left, clear of the sticky footer CTAs on the right. */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="chat-panel"
                aria-label={open ? labels.close : labels.open}
                className={cn(
                    "fixed bottom-5 left-5 z-70 flex size-14 items-center justify-center rounded-full",
                    "bg-brand-800 text-white shadow-lg transition-ui",
                    "hover:bg-brand-700 active:bg-brand-900"
                )}
            >
                {open ? (
                    <X className="size-6" aria-hidden="true" />
                ) : (
                    <MessageCircle className="size-6" aria-hidden="true" />
                )}
            </button>

            {open && (
                <div
                    id="chat-panel"
                    ref={panelRef}
                    role="dialog"
                    aria-label={botName}
                    className={cn(
                        "fixed z-70 flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-2xl",
                        // Full width on a phone, a panel from sm up.
                        "inset-x-3 bottom-24 max-h-[70dvh]",
                        "sm:inset-x-auto sm:bottom-24 sm:left-5 sm:h-[32rem] sm:w-96"
                    )}
                >
                    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-200 bg-brand-800 px-4 py-3 text-white">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{botName}</p>
                        </div>

                        <div className="flex items-center gap-1">
                            {messages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={restart}
                                    aria-label={labels.restart}
                                    title={labels.restart}
                                    className="flex size-9 items-center justify-center rounded-lg text-white/70 transition-ui hover:bg-white/10 hover:text-white"
                                >
                                    <RotateCcw className="size-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label={labels.close}
                                className="flex size-9 items-center justify-center rounded-lg text-white/70 transition-ui hover:bg-white/10 hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                    </header>

                    <div
                        ref={listRef}
                        className="flex-1 space-y-3 overflow-y-auto p-4"
                        aria-live="polite"
                        aria-atomic="false"
                    >
                        <p className="rounded-2xl rounded-tl-sm bg-surface-sunken px-3.5 py-2.5 text-sm text-ink-700">
                            {greeting}
                        </p>

                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex",
                                    m.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <p
                                    className={cn(
                                        "max-w-[85%] whitespace-pre-wrap px-3.5 py-2.5 text-sm",
                                        m.role === "user"
                                            ? "rounded-2xl rounded-tr-sm bg-brand-800 text-white"
                                            : "rounded-2xl rounded-tl-sm bg-surface-sunken text-ink-700"
                                    )}
                                >
                                    {m.content ||
                                        (streaming && i === messages.length - 1 ? (
                                            <span className="flex items-center gap-1.5 text-ink-500">
                                                <Loader2
                                                    className="size-3.5 animate-spin"
                                                    aria-hidden="true"
                                                />
                                                {labels.thinking}
                                            </span>
                                        ) : null)}
                                </p>
                            </div>
                        ))}

                        {error && (
                            <p
                                role="alert"
                                className="rounded-xl border border-danger-line bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
                            >
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="shrink-0 border-t border-ink-200 p-3">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
                                onKeyDown={(e) => {
                                    // Enter sends; Shift+Enter is a newline.
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        void send();
                                    }
                                }}
                                rows={1}
                                placeholder={labels.placeholder}
                                aria-label={labels.placeholder}
                                className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-base text-foreground outline-none transition-ui hover:border-ink-400 focus:border-brand-600"
                            />

                            <button
                                type="button"
                                onClick={() => void send()}
                                disabled={streaming || !draft.trim()}
                                aria-label={labels.send}
                                className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-white transition-ui hover:bg-brand-700 disabled:opacity-40"
                            >
                                {streaming ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Send className="size-4" />
                                )}
                            </button>
                        </div>

                        <p className="mt-2 text-2xs text-ink-500">{disclaimer}</p>
                    </div>
                </div>
            )}
        </>
    );
}
