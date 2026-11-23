import Link from "next/link";
import {
    BriefcaseBusiness,
    CalendarClock,
    ChevronDown,
    Download,
    Inbox,
    ExternalLink,
    FileText,
    MessagesSquare,
    Paperclip,
    Phone,
    ShieldAlert,
    Sparkles,
    UserRound,
    Users,
    X,
} from "lucide-react";

import type { ChatDocument } from "@/lib/content/chat-documents";
import type { RangeSummary as CachedSummary } from "@/lib/content/chat-reports";
import { CaseReviewButton } from "./CaseReviewButton";
import { RangeSummary } from "./RangeSummary";
import { ChatTranscript } from "./ChatTranscript";
import { buttonVariants } from "@/components/ui/button";
import {
    caseQuery,
    caseStats,
    dhakaDay,
    filterCases,
    shiftDay,
    type CaseFilters,
    type CaseResult,
} from "@/lib/content/chat-cases";
import type { AdminLocale } from "@/lib/i18n/admin";
import {
    chatCategories,
    chatCategoryLabel,
    isFlagged,
    occupationGroupLabel,
    type ChatCase,
    type ChatHistoryMessage,
} from "@/lib/types/chatbot";
import { cn } from "@/lib/utils";

/** Enough for a busy day; wider ranges are for the figures and the CSV. */
export const CASES_SHOWN = 100;

const copy = {
    bn: {
        title: "সমস্যার তালিকা",
        intro:
            "চ্যাটে কে, কোন সমস্যা নিয়ে এসেছেন এবং প্রতিটি কথোপকথন থেকে AI কী বুঝেছে। সন্দেহজনক চ্যাট হিসাবের বাইরে রাখা হয়।",
        export: "CSV ডাউনলোড",
        exportExcel: "Excel ডাউনলোড",
        presets: { today: "আজ", yesterday: "গতকাল", week: "গত ৭ দিন", month: "গত ৩০ দিন" },
        from: "শুরু",
        to: "শেষ",
        category: "সমস্যার ধরন",
        allCategories: "সব ধরন",
        view: "দেখান",
        viewAll: "সব চ্যাট",
        viewFlagged: "শুধু যাচাই প্রয়োজন",
        apply: "দেখুন",
        stats: {
            total: "চ্যাট",
            people: "আলাদা নম্বর",
            top: "সবচেয়ে বেশি",
            flagged: "যাচাই প্রয়োজন",
        },
        peopleHint: "নম্বর যাচাই করা নয়",
        none: "—",
        byCategory: "সমস্যার ধরন অনুযায়ী",
        byCategoryHint: "সন্দেহজনক চ্যাট বাদে, এই সময়ের মধ্যে।",
        notRecorded: "এখনো বোঝা যায়নি",
        nothingToCount: "এই সময়ে গোনার মতো কোনো চ্যাট নেই।",
        conversations: "কথোপকথন",
        clearCategory: "ধরনের ফিল্টার সরান",
        emptyTitle: "এই সময়ে কোনো চ্যাট নেই",
        emptyBody: "অন্য তারিখ বা সব ধরন বেছে দেখুন।",
        showingFirst: (shown: string, total: string) =>
            `সর্বশেষ ${shown}টি দেখানো হচ্ছে, মোট ${total}টি। সবগুলোর জন্য তারিখ ছোট করুন বা CSV ডাউনলোড করুন।`,
        truncated: "এই সময়ে অনেক বেশি চ্যাট — শুধু প্রথম ২০,০০০টি গোনা হয়েছে। তারিখ ছোট করুন।",
        needsReview: "যাচাই প্রয়োজন",
        reviewedGenuine: "অ্যাডমিন: আসল",
        notTagged: "AI এখনো এই কথোপকথনটি পড়েনি।",
        age: (n: string) => `বয়স ${n}`,
        messages: (n: string) => `${n} বার্তা`,
        documents: (n: string) => `${n}টি নথি`,
        documentsHeading: "পাঠানো নথি",
        pages: (n: string) => `${n} পৃষ্ঠা`,
        linkExpiry: "নিরাপত্তার জন্য লিংক এক ঘণ্টা কাজ করে; পরে পেজটি আবার লোড করুন।",
        flagReason: "AI কেন সন্দেহ করছে",
        migrationTitle: "ডেটাবেস আপডেট প্রয়োজন",
        migrationBody:
            "Supabase-এর SQL Editor-এ supabase/migrations/0020_chat_intake.sql চালান। এরপর এই পেজ কাজ করবে।",
        failed: "কথোপকথনগুলো আনা যায়নি। পেজটি আবার লোড করুন।",
    },
    en: {
        title: "Problem feed",
        intro:
            "Who came to the chat, about what, and what the AI made of each conversation. Suspicious chats are left out of the figures.",
        export: "Download CSV",
        exportExcel: "Download Excel",
        presets: { today: "Today", yesterday: "Yesterday", week: "Last 7 days", month: "Last 30 days" },
        from: "From",
        to: "To",
        category: "Problem type",
        allCategories: "All types",
        view: "Show",
        viewAll: "All chats",
        viewFlagged: "Needs review only",
        apply: "Show",
        stats: {
            total: "Chats",
            people: "Different numbers",
            top: "Most common",
            flagged: "Needs review",
        },
        peopleHint: "Numbers are not verified",
        none: "—",
        byCategory: "By problem type",
        byCategoryHint: "In this period, leaving out suspicious chats.",
        notRecorded: "Not clear yet",
        nothingToCount: "No chats to count in this period.",
        conversations: "Conversations",
        clearCategory: "Clear the type filter",
        emptyTitle: "No chats in this period",
        emptyBody: "Try other dates or all problem types.",
        showingFirst: (shown: string, total: string) =>
            `Showing the latest ${shown} of ${total}. Narrow the dates or download the CSV for all of them.`,
        truncated: "Too many chats in this period — only the first 20,000 were counted. Narrow the dates.",
        needsReview: "Needs review",
        reviewedGenuine: "Admin: genuine",
        notTagged: "The AI hasn't read this conversation yet.",
        age: (n: string) => `Age ${n}`,
        messages: (n: string) => `${n} messages`,
        documents: (n: string) => `${n} ${n === "1" ? "document" : "documents"}`,
        documentsHeading: "Documents sent",
        pages: (n: string) => `${n} ${n === "1" ? "page" : "pages"}`,
        linkExpiry: "For safety, links work for an hour; reload the page after that.",
        flagReason: "Why the AI is suspicious",
        migrationTitle: "Database update needed",
        migrationBody:
            "Run supabase/migrations/0020_chat_intake.sql in the Supabase SQL Editor, then this page will work.",
        failed: "Couldn't load the conversations. Reload the page.",
    },
};

const intlLocale = { bn: "bn-BD", en: "en-GB" } as const;

const fieldClass =
    "h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground outline-none transition-ui hover:border-ink-400 focus:border-brand-600";

function formatters(locale: AdminLocale) {
    const tag = intlLocale[locale];
    return {
        number: new Intl.NumberFormat(tag),
        percent: new Intl.NumberFormat(tag, { style: "percent", maximumFractionDigits: 0 }),
        day: new Intl.DateTimeFormat(tag, { dateStyle: "long", timeZone: "Asia/Dhaka" }),
        time: new Intl.DateTimeFormat(tag, { timeStyle: "short", timeZone: "Asia/Dhaka" }),
        dateTime: new Intl.DateTimeFormat(tag, {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Dhaka",
        }),
    };
}

/** Midday, so the Dhaka date never slips a day in either direction. */
const noon = (day: string) => new Date(`${day}T12:00:00+06:00`);

/**
 * The admin Problem feed: date presets and filters, the figures for the range,
 * a breakdown by problem type, and every chat with its AI reading and
 * transcript. Pure rendering — the page loads the data.
 */
export function CaseFeed({
    filters,
    result,
    transcripts,
    summary,
    documents,
    locale,
}: {
    filters: CaseFilters;
    result: CaseResult;
    /** Messages for the chats on show, by conversation id. */
    transcripts: Record<string, ChatHistoryMessage[]>;
    /** The cached AI summary of exactly this date range, if any. */
    summary: CachedSummary | null;
    /** Documents attached to the chats on show, by conversation id. */
    documents: Record<string, ChatDocument[]>;
    locale: AdminLocale;
}) {
    const t = copy[locale];
    const f = formatters(locale);
    const today = dhakaDay();
    const presets: { label: string; from: string; to: string }[] = [
        { label: t.presets.today, from: today, to: today },
        { label: t.presets.yesterday, from: shiftDay(today, -1), to: shiftDay(today, -1) },
        { label: t.presets.week, from: shiftDay(today, -6), to: today },
        { label: t.presets.month, from: shiftDay(today, -29), to: today },
    ];
    const singleDay = filters.from === filters.to;
    const rangeLabel = singleDay
        ? f.day.format(noon(filters.from))
        : f.day.formatRange(noon(filters.from), noon(filters.to));

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl tracking-tight text-ink-900">{t.title}</h1>
                    <p className="mt-1.5 max-w-2xl text-sm text-ink-500">{t.intro}</p>
                </div>
                {result.ok && (
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={`/admin/cases/export?${caseQuery(filters)}`}
                            className={buttonVariants({ variant: "outline" })}
                        >
                            <Download aria-hidden="true" />
                            {t.export}
                        </a>
                        <a
                            href={`/admin/cases/export?format=xlsx&${caseQuery(filters)}`}
                            className={buttonVariants({ variant: "outline" })}
                        >
                            <Download aria-hidden="true" />
                            {t.exportExcel}
                        </a>
                    </div>
                )}
            </div>

            <FilterBar filters={filters} presets={presets} today={today} t={t} locale={locale} />

            {!result.ok ? (
                <div className="rounded-xl border border-warning-line bg-warning-soft p-5 text-sm text-warning-strong">
                    {result.reason === "migration" ? (
                        <>
                            <p className="font-semibold">{t.migrationTitle}</p>
                            <p className="mt-1">{t.migrationBody}</p>
                        </>
                    ) : (
                        <p>{t.failed}</p>
                    )}
                </div>
            ) : (
                <Results
                    cases={result.cases}
                    truncated={result.truncated}
                    filters={filters}
                    rangeLabel={rangeLabel}
                    singleDay={singleDay}
                    locale={locale}
                    transcripts={transcripts}
                    summary={summary}
                    documents={documents}
                />
            )}
        </div>
    );
}

function FilterBar({
    filters,
    presets,
    today,
    t,
    locale,
}: {
    filters: CaseFilters;
    presets: { label: string; from: string; to: string }[];
    today: string;
    t: (typeof copy)[AdminLocale];
    locale: AdminLocale;
}) {
    return (
        <section className="rounded-xl border border-ink-200 bg-surface p-4 shadow-xs sm:p-5">
            <div className="flex flex-wrap gap-2">
                {presets.map((preset) => {
                    const active = preset.from === filters.from && preset.to === filters.to;
                    return (
                        <Link
                            key={preset.label}
                            href={`/admin/cases?${caseQuery(filters, { from: preset.from, to: preset.to })}`}
                            aria-current={active ? "true" : undefined}
                            className={cn(
                                "inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium transition-ui",
                                active
                                    ? "bg-brand-800 text-white"
                                    : "bg-surface-sunken text-ink-700 hover:bg-brand-50 hover:text-brand-800"
                            )}
                        >
                            {preset.label}
                        </Link>
                    );
                })}
            </div>

            {/* A plain GET form: the filters live in the URL, so a view can be
                bookmarked or sent to a colleague, and the CSV link matches it. */}
            <form
                action="/admin/cases"
                method="get"
                className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end"
            >
                <label className="text-sm font-medium text-ink-700">
                    {t.from}
                    <input type="date" name="from" defaultValue={filters.from} max={today} className={cn(fieldClass, "mt-1.5")} />
                </label>
                <label className="text-sm font-medium text-ink-700">
                    {t.to}
                    <input type="date" name="to" defaultValue={filters.to} max={today} className={cn(fieldClass, "mt-1.5")} />
                </label>
                <label className="col-span-2 text-sm font-medium text-ink-700 sm:col-span-1">
                    {t.category}
                    <select name="category" defaultValue={filters.category ?? ""} className={cn(fieldClass, "mt-1.5")}>
                        <option value="">{t.allCategories}</option>
                        {chatCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c[locale]}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="col-span-2 text-sm font-medium text-ink-700 sm:col-span-1">
                    {t.view}
                    <select name="view" defaultValue={filters.view} className={cn(fieldClass, "mt-1.5")}>
                        <option value="all">{t.viewAll}</option>
                        <option value="flagged">{t.viewFlagged}</option>
                    </select>
                </label>
                <button type="submit" className={buttonVariants({ className: "col-span-2 lg:col-span-1" })}>
                    {t.apply}
                </button>
            </form>
        </section>
    );
}

function Results({
    cases,
    truncated,
    filters,
    rangeLabel,
    singleDay,
    locale,
    transcripts,
    summary,
    documents,
}: {
    cases: ChatCase[];
    truncated: boolean;
    filters: CaseFilters;
    rangeLabel: string;
    singleDay: boolean;
    locale: AdminLocale;
    transcripts: Record<string, ChatHistoryMessage[]>;
    summary: CachedSummary | null;
    documents: Record<string, ChatDocument[]>;
}) {
    const t = copy[locale];
    const f = formatters(locale);
    const stats = caseStats(cases);
    const listed = filterCases(cases, filters);
    const shown = listed.slice(0, CASES_SHOWN);

    const label = (id: string | null) => chatCategoryLabel(id, locale) ?? t.notRecorded;
    const top = stats.byCategory[0];

    const tiles = [
        { title: t.stats.total, value: f.number.format(stats.total), icon: MessagesSquare },
        {
            title: t.stats.people,
            value: f.number.format(stats.people),
            hint: t.peopleHint,
            icon: Users,
        },
        { title: t.stats.top, value: top ? label(top.id) : t.none, small: true, icon: Sparkles },
        {
            title: t.stats.flagged,
            value: f.number.format(stats.flagged),
            icon: ShieldAlert,
            href: `/admin/cases?${caseQuery(filters, { view: "flagged" })}`,
        },
    ];

    return (
        <>
            <section aria-label={rangeLabel}>
                <p className="mb-3 text-sm font-semibold text-ink-700">{rangeLabel}</p>
                {truncated && (
                    <p className="mb-3 rounded-lg bg-warning-soft px-4 py-2.5 text-sm text-warning-strong">
                        {t.truncated}
                    </p>
                )}
                {stats.total > 0 && (
                    // Keyed by range so a new date range starts its own summary.
                    <div className="mb-4">
                        <RangeSummary
                            key={`${filters.from}:${filters.to}`}
                            from={filters.from}
                            to={filters.to}
                            initial={summary}
                            count={stats.total}
                        />
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                    {tiles.map((tile) => {
                        const Icon = tile.icon;
                        const body = (
                            <>
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-medium text-ink-500">{tile.title}</p>
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                                        <Icon className="size-[18px]" aria-hidden="true" />
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        "mt-2 font-semibold tracking-tight text-ink-900",
                                        tile.small ? "text-base leading-6" : "text-3xl leading-none"
                                    )}
                                >
                                    {tile.value}
                                </p>
                                {tile.hint && <p className="mt-2 text-xs text-ink-500">{tile.hint}</p>}
                            </>
                        );
                        const card = "block rounded-xl border border-ink-200 bg-surface p-4 shadow-xs sm:p-5";
                        return tile.href ? (
                            <Link
                                key={tile.title}
                                href={tile.href}
                                className={cn(card, "transition-ui hover:border-ink-300 hover:shadow-md")}
                            >
                                {body}
                            </Link>
                        ) : (
                            <div key={tile.title} className={card}>
                                {body}
                            </div>
                        );
                    })}
                </div>
            </section>

            <section
                aria-labelledby="by-category"
                className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6"
            >
                <h2 id="by-category" className="text-base font-semibold text-ink-900">
                    {t.byCategory}
                </h2>
                <p className="mt-1 text-sm text-ink-500">{t.byCategoryHint}</p>

                {stats.total === 0 ? (
                    <p className="mt-5 text-sm text-ink-500">{t.nothingToCount}</p>
                ) : (
                    <ul className="mt-5 space-y-1">
                        {stats.byCategory.map((row) => {
                            const share = row.count / stats.total;
                            const active = filters.category !== null && filters.category === row.id;
                            return (
                                <li key={row.id ?? "none"}>
                                    <Link
                                        href={`/admin/cases?${caseQuery(filters, { category: active ? null : row.id })}`}
                                        aria-current={active ? "true" : undefined}
                                        className={cn(
                                            "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-lg px-3 py-2.5 transition-ui hover:bg-surface-sunken sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_5.5rem]",
                                            active && "bg-brand-50 hover:bg-brand-50"
                                        )}
                                    >
                                        <span className="text-sm font-medium text-ink-800">
                                            {label(row.id)}
                                        </span>
                                        <span className="text-end text-sm tabular-nums text-ink-600 sm:order-last">
                                            <span className="font-semibold text-ink-900">{f.number.format(row.count)}</span>{" "}
                                            · {f.percent.format(share)}
                                        </span>
                                        <span className="col-span-2 h-2 overflow-hidden rounded-full bg-ink-100 sm:col-span-1">
                                            <span
                                                className="block h-full rounded-full bg-brand-600"
                                                style={{ width: `${Math.max(2, share * 100)}%` }}
                                            />
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section
                aria-labelledby="case-list"
                className="rounded-xl border border-ink-200 bg-surface shadow-xs"
            >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-5 py-4 sm:px-6">
                    <h2 id="case-list" className="text-base font-semibold text-ink-900">
                        {t.conversations}{" "}
                        <span className="font-normal text-ink-500">({f.number.format(listed.length)})</span>
                    </h2>
                    {filters.category && (
                        <Link
                            href={`/admin/cases?${caseQuery(filters, { category: null })}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-50 px-3.5 text-sm font-medium text-brand-800 transition-ui hover:bg-brand-100"
                        >
                            {label(filters.category)}
                            <X className="size-4" aria-hidden="true" />
                            <span className="sr-only">{t.clearCategory}</span>
                        </Link>
                    )}
                </div>

                {listed.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Inbox className="mx-auto size-8 text-ink-300" aria-hidden="true" />
                        <p className="mt-3 text-sm font-medium text-ink-700">{t.emptyTitle}</p>
                        <p className="mt-1 text-xs text-ink-500">{t.emptyBody}</p>
                    </div>
                ) : (
                    <>
                        <ul className="divide-y divide-ink-200">
                            {shown.map((c) => (
                                <CaseItem
                                    key={c.id}
                                    item={c}
                                    singleDay={singleDay}
                                    locale={locale}
                                    transcript={transcripts[c.id] ?? []}
                                    documents={documents[c.id] ?? []}
                                />
                            ))}
                        </ul>
                        {listed.length > shown.length && (
                            <p className="border-t border-ink-200 px-6 py-4 text-sm text-ink-500">
                                {t.showingFirst(f.number.format(shown.length), f.number.format(listed.length))}
                            </p>
                        )}
                    </>
                )}
            </section>
        </>
    );
}

function CaseItem({
    item,
    singleDay,
    locale,
    transcript,
    documents,
}: {
    item: ChatCase;
    singleDay: boolean;
    locale: AdminLocale;
    transcript: ChatHistoryMessage[];
    documents: ChatDocument[];
}) {
    const t = copy[locale];
    const f = formatters(locale);
    const flagged = isFlagged(item);
    const category = item.category;
    // The admin's language first, then the other one, then the old summary.
    const summary =
        (locale === "en" ? item.ai_summary_en || item.ai_summary : item.ai_summary || item.ai_summary_en) ||
        item.summary;
    const occupation =
        item.occupation ||
        (item.occupation_group !== "unknown" ? occupationGroupLabel(item.occupation_group, locale) : null);
    const started = new Date(item.created_at);

    return (
        <li>
            <details className="group">
                <summary className="cursor-pointer list-none px-5 py-4 transition-ui hover:bg-surface-sunken sm:px-6 [&::-webkit-details-marker]:hidden">
                    <div className="flex items-start gap-3">
                        <span
                            className={cn(
                                "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                                flagged ? "bg-warning-soft text-warning-strong" : "bg-brand-50 text-brand-800"
                            )}
                        >
                            {flagged ? (
                                <ShieldAlert className="size-4" aria-hidden="true" />
                            ) : (
                                <UserRound className="size-4" aria-hidden="true" />
                            )}
                        </span>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                                <span className="font-semibold text-ink-900">{item.visitor_name}</span>
                                {category && (
                                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                                        {chatCategoryLabel(category, locale)}
                                    </span>
                                )}
                                {flagged && (
                                    <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning-strong">
                                        {t.needsReview}
                                    </span>
                                )}
                                {!flagged && item.is_suspicious && item.suspicious_override === false && (
                                    <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
                                        {t.reviewedGenuine}
                                    </span>
                                )}
                            </div>

                            <p className={cn("mt-1.5 text-sm leading-6", summary ? "text-ink-700" : "text-ink-400")}>
                                {summary || t.notTagged}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                                <time dateTime={item.created_at} className="inline-flex items-center gap-1.5">
                                    <CalendarClock className="size-3.5" aria-hidden="true" />
                                    {singleDay ? f.time.format(started) : f.dateTime.format(started)}
                                </time>
                                <span className="inline-flex items-center gap-1.5">
                                    <Phone className="size-3.5" aria-hidden="true" />
                                    {item.phone}
                                </span>
                                {item.age !== null && <span>{t.age(f.number.format(item.age))}</span>}
                                {occupation && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <BriefcaseBusiness className="size-3.5" aria-hidden="true" />
                                        {occupation}
                                    </span>
                                )}
                                <span>{t.messages(f.number.format(item.message_count))}</span>
                                {documents.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 font-medium text-brand-800">
                                        <Paperclip className="size-3.5" aria-hidden="true" />
                                        {t.documents(f.number.format(documents.length))}
                                    </span>
                                )}
                            </div>
                        </div>

                        <ChevronDown
                            className="mt-2 size-4 shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                            aria-hidden="true"
                        />
                    </div>
                </summary>

                <div className="space-y-4 border-t border-ink-100 bg-surface-sunken px-4 py-5 sm:px-6">
                    {item.is_suspicious && item.suspicious_reason && (
                        <p className="mx-auto max-w-2xl rounded-lg border border-warning-line bg-warning-soft px-4 py-3 text-sm text-warning-strong">
                            <span className="font-semibold">{t.flagReason}:</span> {item.suspicious_reason}
                        </p>
                    )}
                    {documents.length > 0 && (
                        <div className="mx-auto max-w-2xl">
                            <h3 className="text-sm font-semibold text-ink-800">{t.documentsHeading}</h3>
                            <ul className="mt-2 space-y-2">
                                {documents.map((doc) => (
                                    <li key={doc.id}>
                                        <a
                                            href={doc.url ?? undefined}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-disabled={!doc.url}
                                            className="flex min-h-11 items-center gap-3 rounded-lg border border-ink-200 bg-surface px-3.5 py-2 text-sm transition-ui hover:border-brand-300 hover:bg-brand-50"
                                        >
                                            <FileText className="size-5 shrink-0 text-brand-700" aria-hidden="true" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-medium text-ink-900">
                                                    {doc.file_name || "document.pdf"}
                                                </span>
                                                <span className="block text-xs text-ink-500">
                                                    {[
                                                        doc.pages ? t.pages(f.number.format(doc.pages)) : null,
                                                        doc.bytes ? `${f.number.format(Math.max(0.1, Math.round(doc.bytes / 104857.6) / 10))} MB` : null,
                                                        f.dateTime.format(new Date(doc.created_at)),
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </span>
                                            </span>
                                            <ExternalLink className="size-4 shrink-0 text-ink-400" aria-hidden="true" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-1.5 text-xs text-ink-500">{t.linkExpiry}</p>
                        </div>
                    )}
                    <div className="mx-auto max-w-2xl">
                        <CaseReviewButton
                            id={item.id}
                            flagged={flagged}
                            overridden={item.suspicious_override !== null}
                        />
                    </div>
                    <div className="mx-auto max-w-2xl">
                        <ChatTranscript messages={transcript} locale={locale} />
                    </div>
                </div>
            </details>
        </li>
    );
}
