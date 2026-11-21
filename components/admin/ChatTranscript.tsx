import type { AdminLocale } from "@/lib/i18n/admin";
import type { ChatHistoryMessage } from "@/lib/types/chatbot";
import { cn } from "@/lib/utils";

const copy = {
    bn: {
        empty: "এই সেশনে এখনো সম্পূর্ণ বার্তা সংরক্ষিত হয়নি।",
        visitor: "দর্শনার্থী",
        assistant: "সহায়ক",
    },
    en: {
        empty: "No complete messages have been saved for this session yet.",
        visitor: "Visitor",
        assistant: "Assistant",
    },
};

const dateTimeOptions: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
};

const dateTime: Record<AdminLocale, Intl.DateTimeFormat> = {
    bn: new Intl.DateTimeFormat("bn-BD", dateTimeOptions),
    en: new Intl.DateTimeFormat("en-GB", dateTimeOptions),
};

/** Date and time in Dhaka, which is where every reader of the admin is. */
export function formatAdminDateTime(value: string, locale: AdminLocale) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : dateTime[locale].format(date);
}

/** A saved conversation as chat bubbles, for the admin's read-only views. */
export function ChatTranscript({
    messages,
    locale,
}: {
    messages: ChatHistoryMessage[];
    locale: AdminLocale;
}) {
    const t = copy[locale];

    if (messages.length === 0) {
        return <p className="text-center text-sm text-ink-500">{t.empty}</p>;
    }

    return (
        <div className="space-y-3">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                    <div
                        className={cn(
                            "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                            message.role === "user"
                                ? "rounded-tr-sm bg-brand-800 text-white"
                                : "rounded-tl-sm border border-ink-200 bg-surface text-ink-700"
                        )}
                    >
                        <p className="mb-1 text-2xs font-semibold opacity-65">
                            {message.role === "user" ? t.visitor : t.assistant}
                        </p>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <time dateTime={message.created_at} className="mt-1.5 block text-2xs opacity-55">
                            {formatAdminDateTime(message.created_at, locale)}
                        </time>
                    </div>
                </div>
            ))}
        </div>
    );
}
