"use client";

import { useEffect, useRef, useState } from "react";
import {
    ArrowRight,
    Loader2,
    MessageCircle,
    Phone,
    RotateCcw,
    Send,
    ShieldCheck,
    Sparkles,
    UserRound,
    X,
} from "lucide-react";

import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import {
    isValidBangladeshPhone,
    MAX_MESSAGE_CHARS,
    normalizeBangladeshPhone,
    type ChatMessage,
    type ChatSessionCredentials,
} from "@/lib/types/chatbot";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type VisitorProfile = {
    name: string;
    phone: string;
};

type ChatWidgetProps = {
    locale: Locale;
    botName: string;
    greeting: string;
    disclaimer: string;
    historyRetentionDays: number;
    labels: {
        open: string;
        openPrompt: string;
        close: string;
        placeholder: string;
        send: string;
        restart: string;
        error: string;
        thinking: string;
        introTitle: string;
        introBody: string;
        name: string;
        namePlaceholder: string;
        phone: string;
        phonePlaceholder: string;
        phoneHint: string;
        continue: string;
        nameError: string;
        phoneError: string;
        privacyNotice: string;
        privateLabel: string;
        conversationReady: string;
        retentionPrefix: string;
        retentionSuffix: string;
    };
};

export function ChatWidget({
    locale,
    botName,
    greeting,
    disclaimer,
    historyRetentionDays,
    labels,
}: ChatWidgetProps) {
    const [open, setOpen] = useState(false);
    const [profile, setProfile] = useState<VisitorProfile | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [nameError, setNameError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [conversation, setConversation] =
        useState<ChatSessionCredentials | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const listRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [messages, streaming]);

    useEffect(() => {
        if (!open) return;
        if (profile) inputRef.current?.focus();
        else nameRef.current?.focus();
    }, [open, profile]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const beginConversation = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const cleanName = name.trim().replace(/\s+/g, " ");
        const cleanPhone = normalizeBangladeshPhone(phone);
        const nextNameError =
            cleanName.length < 2 || cleanName.length > 100 ? labels.nameError : "";
        const nextPhoneError = isValidBangladeshPhone(cleanPhone)
            ? ""
            : labels.phoneError;

        setNameError(nextNameError);
        setPhoneError(nextPhoneError);
        if (nextNameError || nextPhoneError) return;

        setName(cleanName);
        setPhone(cleanPhone);
        setProfile({ name: cleanName, phone: cleanPhone });
        setError(null);
    };

    const send = async () => {
        const text = draft.trim();
        if (!text || streaming || !profile) return;

        setError(null);
        setDraft("");

        const previous = messages;
        const next: ChatMessage[] = [...messages, { role: "user", content: text }];
        setMessages([...next, { role: "assistant", content: "" }]);
        setStreaming(true);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: next,
                    locale,
                    visitorName: profile.name,
                    phone: profile.phone,
                    conversation,
                }),
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error ?? labels.error);
            }

            const conversationId = response.headers.get("X-Chat-Conversation-Id");
            const conversationToken = response.headers.get(
                "X-Chat-Conversation-Token"
            );
            if (!conversationId || !conversationToken) {
                throw new Error(labels.error);
            }
            setConversation({ id: conversationId, token: conversationToken });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                setMessages((current) => {
                    const copy = [...current];
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
        } catch (caught) {
            if ((caught as Error).name === "AbortError") return;
            setError((caught as Error).message || labels.error);
            setMessages(previous);
            setDraft(text);
        } finally {
            setStreaming(false);
            abortRef.current = null;
        }
    };

    const restart = () => {
        abortRef.current?.abort();
        setProfile(null);
        setConversation(null);
        setMessages([]);
        setError(null);
        setDraft("");
        setName("");
        setPhone("");
        setNameError("");
        setPhoneError("");
    };

    return (
        <>
            <button
                data-print-hide
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls="chat-panel"
                aria-label={open ? labels.close : labels.open}
                className={cn(
                    "group fixed bottom-5 left-4 z-70 flex h-14 items-center gap-3 rounded-full border border-white/20",
                    "bg-brand-800 px-3.5 text-white shadow-xl shadow-brand-950/20 transition-ui",
                    "hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700",
                    open && "w-14 justify-center px-0"
                )}
            >
                <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white/12">
                    {open ? (
                        <X className="size-5" aria-hidden="true" />
                    ) : (
                        <>
                            <MessageCircle className="size-5" aria-hidden="true" />
                            <span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-brand-800 bg-brand-200" />
                        </>
                    )}
                </span>
                {!open && (
                    <span className="pr-1 text-left leading-tight">
                        <span className="block text-sm font-semibold">{labels.openPrompt}</span>
                        <span className="hidden text-2xs text-white/70 sm:block">
                            {botName}
                        </span>
                    </span>
                )}
            </button>

            {open && (
                <div
                    data-print-hide
                    id="chat-panel"
                    ref={panelRef}
                    role="dialog"
                    aria-labelledby="chat-title"
                    className={cn(
                        "fixed z-70 flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-2xl",
                        "inset-x-3 bottom-24 max-h-[76dvh] min-h-[26rem]",
                        "sm:inset-x-auto sm:bottom-24 sm:left-5 sm:h-[35rem] sm:w-[25rem]"
                    )}
                >
                    <header className="flex shrink-0 items-center justify-between gap-3 bg-brand-800 px-4 py-3.5 text-white">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/12">
                                <Sparkles className="size-5 text-brand-100" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <h2 id="chat-title" className="truncate text-sm font-semibold">
                                    {botName}
                                </h2>
                                <p className="mt-0.5 flex items-center gap-1.5 text-2xs text-white/70">
                                    <ShieldCheck className="size-3" aria-hidden="true" />
                                    {labels.privateLabel}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {profile && (
                                <button
                                    type="button"
                                    onClick={restart}
                                    aria-label={labels.restart}
                                    title={labels.restart}
                                    className="flex size-9 items-center justify-center rounded-lg text-white/70 transition-ui hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                                >
                                    <RotateCcw className="size-4" aria-hidden="true" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label={labels.close}
                                className="flex size-9 items-center justify-center rounded-lg text-white/70 transition-ui hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                            >
                                <X className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                    </header>

                    {!profile ? (
                        <div className="flex flex-1 flex-col overflow-y-auto p-5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-800">
                                <MessageCircle className="size-6" aria-hidden="true" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-ink-900">
                                {labels.introTitle}
                            </h3>
                            <p className="mt-1.5 text-sm leading-6 text-ink-600">
                                {labels.introBody}
                            </p>

                            <form onSubmit={beginConversation} className="mt-5 space-y-4" noValidate>
                                <div>
                                    <label htmlFor="chat-name" className="text-sm font-medium text-ink-800">
                                        {labels.name}
                                    </label>
                                    <div className="relative mt-1.5">
                                        <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                                        <input
                                            ref={nameRef}
                                            id="chat-name"
                                            name="name"
                                            type="text"
                                            autoComplete="name"
                                            value={name}
                                            onChange={(event) => {
                                                setName(event.target.value.slice(0, 100));
                                                if (nameError) setNameError("");
                                            }}
                                            aria-invalid={Boolean(nameError)}
                                            aria-describedby={nameError ? "chat-name-error" : undefined}
                                            placeholder={labels.namePlaceholder}
                                            className="h-11 w-full rounded-lg border border-input bg-surface pl-10 pr-3 text-base text-foreground outline-none transition-ui hover:border-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                                        />
                                    </div>
                                    {nameError && (
                                        <p id="chat-name-error" role="alert" className="mt-1.5 text-xs text-danger">
                                            {nameError}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="chat-phone" className="text-sm font-medium text-ink-800">
                                        {labels.phone}
                                    </label>
                                    <div className="relative mt-1.5">
                                        <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                                        <input
                                            id="chat-phone"
                                            name="phone"
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel-national"
                                            value={phone}
                                            onChange={(event) => {
                                                setPhone(event.target.value.slice(0, 20));
                                                if (phoneError) setPhoneError("");
                                            }}
                                            aria-invalid={Boolean(phoneError)}
                                            aria-describedby={
                                                phoneError
                                                    ? "chat-phone-hint chat-phone-error"
                                                    : "chat-phone-hint"
                                            }
                                            placeholder={labels.phonePlaceholder}
                                            className="h-11 w-full rounded-lg border border-input bg-surface pl-10 pr-3 text-base text-foreground outline-none transition-ui hover:border-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                                        />
                                    </div>
                                    <p id="chat-phone-hint" className="mt-1.5 text-xs text-ink-500">
                                        {labels.phoneHint}
                                    </p>
                                    {phoneError && (
                                        <p id="chat-phone-error" role="alert" className="mt-1 text-xs text-danger">
                                            {phoneError}
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-xl bg-surface-sunken px-3.5 py-3 text-xs leading-5 text-ink-600">
                                    <p className="flex gap-2">
                                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                                        <span>
                                            {labels.privacyNotice} {labels.retentionPrefix}{" "}
                                            {historyRetentionDays} {labels.retentionSuffix}
                                        </span>
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition-ui hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                                >
                                    {labels.continue}
                                    <ArrowRight className="size-4" aria-hidden="true" />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div
                                ref={listRef}
                                className="flex-1 space-y-3 overflow-y-auto p-4"
                                aria-live="polite"
                                aria-atomic="false"
                            >
                                <p className="mx-auto w-fit rounded-full bg-brand-50 px-3 py-1 text-2xs font-medium text-brand-800">
                                    {labels.conversationReady}
                                </p>

                                <div className="flex justify-start">
                                    <p className="max-w-[88%] rounded-2xl rounded-tl-sm bg-surface-sunken px-3.5 py-2.5 text-sm leading-6 text-ink-700">
                                        {greeting}
                                    </p>
                                </div>

                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex",
                                            message.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[88%] px-3.5 py-2.5 text-sm leading-6",
                                                message.role === "user"
                                                    ? "whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-brand-800 text-white"
                                                    : "rounded-2xl rounded-tl-sm bg-surface-sunken text-ink-700"
                                            )}
                                        >
                                            {message.role === "assistant" ? (
                                                <ChatMarkdown content={message.content} />
                                            ) : (
                                                message.content
                                            )}

                                            {!message.content &&
                                                streaming &&
                                                index === messages.length - 1 && (
                                                    <span className="flex items-center gap-1.5 text-ink-500">
                                                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                                        {labels.thinking}
                                                    </span>
                                                )}
                                        </div>
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

                            <div className="shrink-0 border-t border-ink-200 bg-surface p-3">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        ref={inputRef}
                                        value={draft}
                                        onChange={(event) =>
                                            setDraft(event.target.value.slice(0, MAX_MESSAGE_CHARS))
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" && !event.shiftKey) {
                                                event.preventDefault();
                                                void send();
                                            }
                                        }}
                                        rows={1}
                                        placeholder={labels.placeholder}
                                        aria-label={labels.placeholder}
                                        className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border border-input bg-surface px-3 py-2.5 text-base text-foreground outline-none transition-ui hover:border-ink-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => void send()}
                                        disabled={streaming || !draft.trim()}
                                        aria-label={labels.send}
                                        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-white transition-ui hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-40"
                                    >
                                        {streaming ? (
                                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                        ) : (
                                            <Send className="size-4" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>

                                <p className="mt-2 text-2xs leading-4 text-ink-500">{disclaimer}</p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
