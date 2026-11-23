import Link from "next/link";
import {
    FileText,
    MessagesSquare,
    ShieldAlert,
    UserCheck,
    Users,
    Download,
    ShieldCheck,
} from "lucide-react";

import { PrintButton } from "@/components/admin/PrintButton";
import { RangeSummary } from "@/components/admin/RangeSummary";
import { BarList, ColumnChart, GrowthLine, HeatTable } from "@/components/admin/ReportCharts";
import { buttonVariants } from "@/components/ui/button";
import { dhakaDay, getChatCases, parseCaseFilters, shiftDay } from "@/lib/content/chat-cases";
import {
    ageBands,
    breakdown,
    categoryRows,
    countDocuments,
    getRangeSummary,
    occupationRows,
    yearSeries,
} from "@/lib/content/chat-reports";
import { getAdminLocale } from "@/lib/i18n/admin-server";
import { createClient } from "@/lib/supabase/server";
import { chatCategoryLabel, occupationGroupLabel } from "@/lib/types/chatbot";
import { cn } from "@/lib/utils";

const copy = {
    bn: {
        title: "রিপোর্ট",
        intro: "বছরজুড়ে চ্যাটে আসা সমস্যার হিসাব, প্রবৃদ্ধি ও ধরন। সন্দেহজনক চ্যাট সব হিসাবের বাইরে।",
        year: "বছর",
        show: "দেখুন",
        excel: "Excel ডাউনলোড",
        research: "গবেষণার জন্য (পরিচয়হীন)",
        print: "প্রিন্ট / PDF",
        soFar: (date: string) => `${date} পর্যন্ত`,
        tiles: {
            chats: "চ্যাট",
            people: "আলাদা নম্বর",
            documents: "জমা পড়া নথি",
            flagged: "সন্দেহজনক (বাদ)",
            members: "সদস্য",
        },
        peopleHint: "নম্বর যাচাই করা নয়",
        documentsPending: "ডেটাবেস আপডেটের পর",
        membersPending: "পেমেন্ট চালু হলে",
        monthly: "মাসে কতজন যোগাযোগ করেছেন",
        monthlyHint: "কোনো মাসে ক্লিক করলে সেই মাসের সমস্যার তালিকা খুলবে।",
        growth: "প্রবৃদ্ধি: মোট আলাদা নম্বর",
        growthHint: "বছরের শুরু থেকে প্রতি মাসের শেষ পর্যন্ত কতগুলো আলাদা নম্বর যোগাযোগ করেছে।",
        byMonth: "মাস অনুযায়ী সমস্যার ধরন",
        byAge: "বয়স অনুযায়ী",
        byAgeType: "কোন বয়সে কোন সমস্যা",
        byOccupation: "পেশা অনুযায়ী",
        byOccupationType: "কোন পেশায় কোন সমস্যা",
        ageNote: "বয়স ও পেশা শুধু তখনই জানা যায় যখন দর্শনার্থী নিজে উল্লেখ করেন।",
        notClear: "এখনো বোঝা যায়নি",
        chatsUnit: () => "টি চ্যাট",
        numbersUnit: () => "টি নম্বর",
        table: "সংখ্যায় দেখুন",
        less: "কম",
        more: "বেশি",
        empty: "এই বছরে এখনো কোনো চ্যাট নেই।",
        migration:
            "ডেটাবেস আপডেট প্রয়োজন: Supabase-এ supabase/migrations/0020_chat_intake.sql চালান।",
        failed: "তথ্য আনা যায়নি। পেজটি আবার লোড করুন।",
    },
    en: {
        title: "Reports",
        intro: "The year's chats: how many, how it is growing, and what about. Suspicious chats are left out of every figure.",
        year: "Year",
        show: "Show",
        excel: "Download Excel",
        research: "For research (anonymous)",
        print: "Print / PDF",
        soFar: (date: string) => `up to ${date}`,
        tiles: {
            chats: "Chats",
            people: "Different numbers",
            documents: "Documents received",
            flagged: "Suspicious (left out)",
            members: "Members",
        },
        peopleHint: "Numbers are not verified",
        documentsPending: "After the database update",
        membersPending: "Once payments are set up",
        monthly: "People in touch each month",
        monthlyHint: "Click a month to open its Problem feed.",
        growth: "Growth: different numbers so far",
        growthHint: "How many different numbers had been in touch from 1 January to the end of each month.",
        byMonth: "Problem types by month",
        byAge: "By age",
        byAgeType: "Which problems at which age",
        byOccupation: "By occupation",
        byOccupationType: "Which problems in which occupation",
        ageNote: "Age and occupation are known only when the visitor mentions them.",
        notClear: "Not clear yet",
        chatsUnit: (n: number) => (n === 1 ? "chat" : "chats"),
        numbersUnit: (n: number) => (n === 1 ? "number" : "numbers"),
        table: "Show as a table",
        less: "Fewer",
        more: "More",
        empty: "No chats yet this year.",
        migration:
            "Database update needed: run supabase/migrations/0020_chat_intake.sql in Supabase.",
        failed: "Couldn't load the figures. Reload the page.",
    },
};

const intl = { bn: "bn-BD", en: "en-GB" } as const;

function Card({
    title,
    hint,
    children,
    className,
}: {
    title: string;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            data-print-keep
            className={cn("rounded-xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6", className)}
        >
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {hint && <p className="mt-1 text-sm text-ink-500">{hint}</p>}
            <div className="mt-5">{children}</div>
        </section>
    );
}

async function firstChatYear(fallback: number) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("chat_conversations")
        .select("created_at")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    return data?.created_at ? Number(dhakaDay(new Date(data.created_at)).slice(0, 4)) : fallback;
}

export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [params, locale] = await Promise.all([searchParams, getAdminLocale()]);
    const t = copy[locale];
    const today = dhakaDay();
    const thisYear = Number(today.slice(0, 4));
    const firstYear = Math.min(thisYear, await firstChatYear(thisYear));
    const asked = Number(Array.isArray(params.year) ? params.year[0] : params.year);
    const year = Number.isInteger(asked) && asked >= firstYear && asked <= thisYear ? asked : thisYear;

    // The current year runs to today, so its summary is "the year so far".
    const from = `${year}-01-01`;
    const to = year === thisYear ? today : `${year}-12-31`;
    const filters = parseCaseFilters({ from, to });

    const [result, documents, summary] = await Promise.all([
        getChatCases(filters),
        countDocuments(from, to),
        getRangeSummary(from, to),
    ]);

    const number = new Intl.NumberFormat(intl[locale]);
    const format = (n: number) => number.format(n);
    const percent = (share: number) =>
        new Intl.NumberFormat(intl[locale], { style: "percent", maximumFractionDigits: 0 }).format(share);
    const monthShort = new Intl.DateTimeFormat(intl[locale], { month: "short", timeZone: "Asia/Dhaka" });
    const monthLong = new Intl.DateTimeFormat(intl[locale], { month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
    const dayLong = new Intl.DateTimeFormat(intl[locale], { dateStyle: "long", timeZone: "Asia/Dhaka" });
    const query = `from=${from}&to=${to}`;

    const header = (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">
                    {t.title} · {format(year).replace(/[,٬]/g, "")}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-ink-500">{t.intro}</p>
                {year === thisYear && (
                    <p className="mt-1 text-xs text-ink-500">
                        {t.soFar(dayLong.format(new Date(`${today}T12:00:00+06:00`)))}
                    </p>
                )}
            </div>
            {result.ok && (
                <div className="flex flex-wrap gap-2" data-print-hide>
                    <a href={`/admin/cases/export?format=xlsx&${query}`} className={buttonVariants({ variant: "outline" })}>
                        <Download aria-hidden="true" />
                        {t.excel}
                    </a>
                    <a href={`/admin/cases/research?${query}`} className={buttonVariants({ variant: "outline" })}>
                        <ShieldCheck aria-hidden="true" />
                        {t.research}
                    </a>
                    <PrintButton label={t.print} />
                </div>
            )}
        </div>
    );

    const yearPicker = (
        <form
            action="/admin/reports"
            method="get"
            data-print-hide
            className="flex flex-wrap items-end gap-3 rounded-xl border border-ink-200 bg-surface p-4 shadow-xs"
        >
            <label className="text-sm font-medium text-ink-700">
                {t.year}
                <select
                    name="year"
                    defaultValue={year}
                    className="mt-1.5 block h-11 w-36 rounded-lg border border-input bg-surface px-3 text-sm text-foreground outline-none transition-ui hover:border-ink-400 focus:border-brand-600"
                >
                    {Array.from({ length: thisYear - firstYear + 1 }, (_, i) => thisYear - i).map((y) => (
                        <option key={y} value={y}>
                            {format(y).replace(/[,٬]/g, "")}
                        </option>
                    ))}
                </select>
            </label>
            <button type="submit" className={buttonVariants()}>
                {t.show}
            </button>
        </form>
    );

    if (!result.ok) {
        return (
            <div className="mx-auto max-w-6xl space-y-6">
                {header}
                <p className="rounded-xl border border-warning-line bg-warning-soft p-5 text-sm text-warning-strong">
                    {result.reason === "migration" ? t.migration : t.failed}
                </p>
            </div>
        );
    }

    const stats = breakdown(result.cases);
    const series = yearSeries(result.cases);
    const lastMonth = year === thisYear ? Number(today.slice(5, 7)) - 1 : 11;
    const monthDate = (m: number) => new Date(Date.UTC(year, m, 15));
    const pad = (m: number) => String(m).padStart(2, "0");
    const monthEnd = (m: number) => {
        const next = m === 11 ? `${year + 1}-01-01` : `${year}-${pad(m + 2)}-01`;
        const end = shiftDay(next, -1);
        return end > today ? today : end;
    };
    const months = Array.from({ length: 12 }, (_, m) => m);
    const label = (id: (typeof categoryRows)[number]) => chatCategoryLabel(id, locale) ?? t.notClear;

    const tiles = [
        { title: t.tiles.chats, value: format(stats.total), icon: MessagesSquare },
        { title: t.tiles.people, value: format(stats.people), hint: t.peopleHint, icon: Users },
        {
            title: t.tiles.documents,
            value: documents === null ? "—" : format(documents),
            hint: documents === null ? t.documentsPending : undefined,
            icon: FileText,
        },
        { title: t.tiles.flagged, value: format(stats.flagged), icon: ShieldAlert },
        { title: t.tiles.members, value: "—", hint: t.membersPending, icon: UserCheck },
    ];

    const typeRows = categoryRows.filter((id) => (stats.byCategory.get(id) ?? 0) > 0);
    const ageColumns = ageBands.filter((b) => (stats.byAge.get(b.id) ?? 0) > 0);
    const occupationColumns = occupationRows
        .filter((id) => (stats.byOccupation.get(id) ?? 0) > 0)
        .sort((a, b) => (stats.byOccupation.get(b) ?? 0) - (stats.byOccupation.get(a) ?? 0));

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {header}
            {yearPicker}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                {tiles.map((tile) => {
                    const Icon = tile.icon;
                    return (
                        <div
                            key={tile.title}
                            data-print-keep
                            className="rounded-xl border border-ink-200 bg-surface p-4 shadow-xs sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-ink-500">{tile.title}</p>
                                <Icon className="size-[18px] shrink-0 text-brand-700" aria-hidden="true" />
                            </div>
                            <p className="mt-2 text-3xl font-semibold leading-none tracking-tight text-ink-900">
                                {tile.value}
                            </p>
                            {tile.hint && <p className="mt-2 text-xs text-ink-500">{tile.hint}</p>}
                        </div>
                    );
                })}
            </div>

            {stats.total === 0 ? (
                <p className="rounded-xl border border-ink-200 bg-surface p-8 text-center text-sm text-ink-500">{t.empty}</p>
            ) : (
                <>
                    <RangeSummary from={from} to={to} initial={summary} count={stats.total} />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card title={t.monthly} hint={t.monthlyHint}>
                            <ColumnChart
                                points={months.map((m) => ({
                                    label: monthShort.format(monthDate(m)),
                                    name: monthLong.format(monthDate(m)),
                                    value: m > lastMonth ? null : series.chats[m],
                                    href: `/admin/cases?from=${year}-${pad(m + 1)}-01&to=${monthEnd(m)}`,
                                }))}
                                format={format}
                                unit={t.chatsUnit}
                                tableLabel={t.table}
                            />
                        </Card>
                        <Card title={t.growth} hint={t.growthHint}>
                            <GrowthLine
                                points={months.map((m) => ({
                                    label: monthShort.format(monthDate(m)),
                                    name: monthLong.format(monthDate(m)),
                                    value: m > lastMonth ? null : series.cumulativePeople[m],
                                }))}
                                format={format}
                                unit={t.numbersUnit}
                                tableLabel={t.table}
                            />
                        </Card>
                    </div>

                    <Card title={t.byMonth}>
                        <HeatTable
                            caption={t.byMonth}
                            columns={months.map((m) => monthShort.format(monthDate(m)))}
                            rows={typeRows.map((id) => ({
                                label: label(id),
                                values: series.categoryByMonth.get(id) ?? Array(12).fill(0),
                            }))}
                            format={format}
                            less={t.less}
                            more={t.more}
                        />
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                        <Card title={t.byAge} hint={t.ageNote}>
                            <BarList
                                rows={ageBands.map((b) => ({ label: b[locale], value: stats.byAge.get(b.id) ?? 0 }))}
                                total={stats.total}
                                format={format}
                                percent={percent}
                            />
                        </Card>
                        <Card title={t.byAgeType}>
                            <HeatTable
                                caption={t.byAgeType}
                                columns={ageColumns.map((b) => b[locale])}
                                rows={typeRows.map((id) => ({
                                    label: label(id),
                                    values: ageColumns.map((b) => stats.categoryByAge.get(id)?.get(b.id) ?? 0),
                                }))}
                                format={format}
                                less={t.less}
                                more={t.more}
                            />
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                        <Card title={t.byOccupation} hint={t.ageNote}>
                            <BarList
                                rows={occupationColumns.map((id) => ({
                                    label: occupationGroupLabel(id, locale) ?? id,
                                    value: stats.byOccupation.get(id) ?? 0,
                                }))}
                                total={stats.total}
                                format={format}
                                percent={percent}
                            />
                        </Card>
                        <Card title={t.byOccupationType}>
                            <HeatTable
                                caption={t.byOccupationType}
                                columns={occupationColumns.map((id) => occupationGroupLabel(id, locale) ?? id)}
                                rows={typeRows.map((id) => ({
                                    label: label(id),
                                    values: occupationColumns.map(
                                        (o) => stats.categoryByOccupation.get(id)?.get(o) ?? 0
                                    ),
                                }))}
                                format={format}
                                less={t.less}
                                more={t.more}
                            />
                        </Card>
                    </div>

                    <p className="text-xs text-ink-500" data-print-hide>
                        <Link href={`/admin/cases?${query}`} className="text-brand-700 underline underline-offset-4">
                            {locale === "en" ? "Open every chat of this period in the Problem feed" : "এই সময়ের সব চ্যাট সমস্যার তালিকায় দেখুন"}
                        </Link>
                    </p>
                </>
            )}
        </div>
    );
}

