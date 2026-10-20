import {
    CalendarClock,
    ChevronDown,
    History,
    MessageSquareText,
    Phone,
    UserRound,
} from "lucide-react";

import type { ChatConversation } from "@/lib/types/chatbot";
import { cn } from "@/lib/utils";

const dateTime = new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
});

function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : dateTime.format(date);
}

export function ChatHistory({
    conversations,
}: {
    conversations: ChatConversation[];
}) {
    return (
        <section
            aria-labelledby="chat-history-heading"
            className="rounded-xl border border-ink-200 bg-surface shadow-xs"
        >
            <div className="flex flex-col gap-3 border-b border-ink-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
                            <History className="size-4.5" aria-hidden="true" />
                        </span>
                        <h2 id="chat-history-heading" className="text-base font-semibold text-ink-900">
                            কথোপকথনের হিস্ট্রি
                        </h2>
                    </div>
                    <p className="mt-2 text-sm text-ink-500">
                        সাম্প্রতিক {conversations.length}টি সেশন। শুধু অ্যাডমিনরা এই তথ্য দেখতে পারেন।
                    </p>
                </div>
                <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                    {conversations.length} সেশন
                </span>
            </div>

            {conversations.length === 0 ? (
                <div className="px-6 py-10 text-center">
                    <MessageSquareText className="mx-auto size-8 text-ink-300" aria-hidden="true" />
                    <p className="mt-3 text-sm font-medium text-ink-700">
                        এখনো কোনো কথোপকথন সংরক্ষিত হয়নি
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                        নতুন চ্যাট সম্পন্ন হলে সংক্ষিপ্তসার ও পুরো কথোপকথন এখানে দেখা যাবে।
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-ink-200">
                    {conversations.map((conversation) => (
                        <details key={conversation.id} className="group">
                            <summary className="cursor-pointer list-none px-5 py-4 transition-ui hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600 sm:px-6 [&::-webkit-details-marker]:hidden">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-800">
                                        <UserRound className="size-4" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="font-semibold text-ink-900">
                                                {conversation.visitor_name}
                                            </span>
                                            <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-2xs font-medium uppercase text-ink-500">
                                                {conversation.locale}
                                            </span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-600">
                                            {conversation.summary || "কথোপকথনের সংক্ষিপ্তসার পাওয়া যায়নি।"}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Phone className="size-3.5" aria-hidden="true" />
                                                {conversation.phone}
                                            </span>
                                            <time
                                                dateTime={conversation.updated_at}
                                                className="inline-flex items-center gap-1.5"
                                            >
                                                <CalendarClock className="size-3.5" aria-hidden="true" />
                                                {formatDate(conversation.updated_at)}
                                            </time>
                                            <span>{conversation.message_count} বার্তা</span>
                                        </div>
                                    </div>
                                    <ChevronDown
                                        className="mt-2 size-4 shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                                        aria-hidden="true"
                                    />
                                </div>
                            </summary>

                            <div className="border-t border-ink-100 bg-surface-sunken px-4 py-5 sm:px-6">
                                <div className="mx-auto max-w-2xl space-y-3">
                                    {conversation.messages.length === 0 ? (
                                        <p className="text-center text-sm text-ink-500">
                                            এই সেশনে এখনো সম্পূর্ণ বার্তা সংরক্ষিত হয়নি।
                                        </p>
                                    ) : (
                                        conversation.messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={cn(
                                                    "flex",
                                                    message.role === "user"
                                                        ? "justify-end"
                                                        : "justify-start"
                                                )}
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
                                                        {message.role === "user" ? "দর্শনার্থী" : "সহায়ক"}
                                                    </p>
                                                    <p className="whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </p>
                                                    <time
                                                        dateTime={message.created_at}
                                                        className="mt-1.5 block text-2xs opacity-55"
                                                    >
                                                        {formatDate(message.created_at)}
                                                    </time>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
            )}
        </section>
    );
}
