"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    FileText,
    Images,
    Mic2,
    Newspaper,
    Play,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";

import { formatCount } from "@/lib/i18n/config";
import {
    archiveKinds,
    sortArchiveItemsNewestFirst,
    type ArchiveContentType,
    type ArchiveListingItem,
    type ArchiveKind,
    type ArchiveSection,
} from "@/lib/types/archive";
import type { ArchiveLabels } from "./labels";
import { ArchiveGrid } from "./ArchiveGrid";
import { cn } from "@/lib/utils";

type KindFilter = ArchiveKind | "all";

const contentTypesBySection: Record<
    ArchiveSection,
    readonly ArchiveContentType[]
> = {
    press_media: ["event", "press_release"],
    news_archive: [
        "media_coverage",
        "mens_rights_news",
        "case_study",
        "report",
    ],
};

/**
 * Filters plus the results grid.
 *
 * The section and content-type links make the primary view shareable. The
 * narrower presentation, category, year, and text filters then run in the
 * browser over the published set so those quick refinements preserve scroll.
 */
export function ArchiveExplorer({
    items,
    categories,
    years,
    t,
    locale,
    initialSection,
    initialContentType,
}: {
    items: ArchiveListingItem[];
    categories: string[];
    /** Raw year as the value, localised numerals as the label. */
    years: { value: string; label: string }[];
    t: ArchiveLabels;
    locale: "bn" | "en";
    initialSection: ArchiveSection;
    initialContentType: ArchiveContentType | null;
}) {
    const [kind, setKind] = useState<KindFilter>("all");
    const section = initialSection;
    const [category, setCategory] = useState<string | null>(null);
    const [year, setYear] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return sortArchiveItemsNewestFirst(
            items.filter((item) => {
                if (item.section !== section) return false;
                if (initialContentType && item.contentType !== initialContentType) {
                    return false;
                }
                if (kind !== "all" && item.kind !== kind) return false;
                if (category && item.category !== category) return false;
                if (year && item.year !== year) return false;

                if (needle) {
                    const haystack = `${item.heading} ${item.body} ${item.category} ${item.location}`;
                    if (!haystack.toLowerCase().includes(needle)) return false;
                }

                return true;
            })
        );
    }, [items, section, initialContentType, kind, category, year, query]);

    const filtered =
        Boolean(initialContentType) || kind !== "all" || category || year || query.trim();

    const activeCategories = categories.filter((value) =>
        items.some(
            (item) =>
                item.section === section &&
                (!initialContentType || item.contentType === initialContentType) &&
                item.category === value
        )
    );
    const activeYears = years.filter((option) =>
        items.some(
            (item) =>
                item.section === section &&
                (!initialContentType || item.contentType === initialContentType) &&
                item.year === option.value
        )
    );

    const reset = () => {
        setKind("all");
        setCategory(null);
        setYear(null);
        setQuery("");
    };

    const kindLabel: Record<ArchiveKind, string> = {
        article: t.articleKind,
        photo: t.photoKind,
        video: t.videoKind,
        audio: t.audioKind,
    };

    const contentTypeLabel: Record<ArchiveContentType, string> = {
        event: t.typeEvent,
        press_release: t.typePressRelease,
        media_coverage: t.typeMediaCoverage,
        mens_rights_news: t.typeMensRightsNews,
        case_study: t.typeCaseStudy,
        report: t.typeReport,
    };

    const kindIcon = {
        article: FileText,
        photo: Images,
        video: Play,
        audio: Mic2,
    } as const;

    const yearLabels = new Map(years.map((item) => [item.value, item.label]));
    const groups = Array.from(
        visible.reduce((map, item) => {
            const key = item.year ?? "undated";
            const list = map.get(key);
            if (list) list.push(item);
            else map.set(key, [item]);
            return map;
        }, new Map<string, ArchiveListingItem[]>())
    ).sort(([a], [b]) => {
        if (a === "undated") return 1;
        if (b === "undated") return -1;
        return b.localeCompare(a);
    });

    return (
        <>
            <div className="mb-10 space-y-5">
                <div
                    aria-label={t.filterSection}
                    className="grid gap-3 rounded-2xl bg-surface-sunken p-2 sm:grid-cols-2"
                >
                    {(
                        [
                            {
                                value: "press_media" as const,
                                label: t.pressMediaTab,
                                description: t.pressMediaTabDescription,
                                icon: Newspaper,
                            },
                            {
                                value: "news_archive" as const,
                                label: t.newsArchiveTab,
                                description: t.newsArchiveTabDescription,
                                icon: FileText,
                            },
                        ]
                    ).map((option) => {
                        const active = section === option.value;
                        const Icon = option.icon;
                        return (
                            <Link
                                key={option.value}
                                href={`/${locale}/news?section=${option.value}`}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "flex min-h-24 items-start gap-3 rounded-xl border p-4 text-left transition-ui",
                                    active
                                        ? "border-brand-700 bg-surface text-brand-900 shadow-sm"
                                        : "border-transparent text-ink-600 hover:border-ink-200 hover:bg-surface"
                                )}
                            >
                                <span
                                    className={cn(
                                        "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg",
                                        active
                                            ? "bg-brand-800 text-white"
                                            : "bg-brand-50 text-brand-700"
                                    )}
                                >
                                    <Icon className="size-5" aria-hidden="true" />
                                </span>
                                <span>
                                    <span className="block font-semibold">{option.label}</span>
                                    <span className="mt-1 block text-xs leading-relaxed">
                                        {option.description}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>

                <nav aria-label={t.filterContentType} className="space-y-2">
                    <span className="block text-xs font-semibold uppercase text-ink-500">
                        {t.filterContentType}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={`/${locale}/news?section=${section}`}
                            aria-current={!initialContentType ? "page" : undefined}
                            className={cn(
                                "inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-medium transition-ui",
                                !initialContentType
                                    ? "border-brand-800 bg-brand-800 text-white"
                                    : "border-ink-200 bg-surface text-ink-600 hover:border-brand-400 hover:text-brand-800"
                            )}
                        >
                            {t.allContentTypes}
                        </Link>

                        {contentTypesBySection[section].map((contentType) => {
                            const active = initialContentType === contentType;
                            return (
                                <Link
                                    key={contentType}
                                    href={`/${locale}/news?section=${section}&type=${contentType}`}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-medium transition-ui",
                                        active
                                            ? "border-brand-800 bg-brand-800 text-white"
                                            : "border-ink-200 bg-surface text-ink-600 hover:border-brand-400 hover:text-brand-800"
                                    )}
                                >
                                    {contentTypeLabel[contentType]}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Presentation kind is the first in-page refinement, above the
                    unbounded category and year facets. */}
                <div
                    aria-label={t.filterKind}
                    className="flex flex-wrap gap-2"
                >
                    {(["all", ...archiveKinds] as const).map((value) => {
                        const isActive = kind === value;
                        const Icon = value === "all" ? null : kindIcon[value];

                        return (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => setKind(value)}
                                className={cn(
                                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-ui",
                                    isActive
                                        ? "border-brand-800 bg-brand-800 text-white"
                                        : "border-ink-200 bg-surface text-ink-600 hover:border-brand-400 hover:text-brand-800"
                                )}
                            >
                                {Icon && (
                                    <Icon
                                        aria-hidden="true"
                                        className={cn(
                                            "size-4",
                                            value === "video" && "fill-current"
                                        )}
                                    />
                                )}
                                {value === "all" ? t.all : kindLabel[value]}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-end gap-4">
                    {activeCategories.length > 0 && (
                        <Facet
                            label={t.filterCategory}
                            allLabel={t.allCategories}
                            value={category}
                            options={activeCategories.map((c) => ({ value: c, label: c }))}
                            onChange={setCategory}
                        />
                    )}

                    {activeYears.length > 0 && (
                        <Facet
                            label={t.filterYear}
                            allLabel={t.allYears}
                            value={year}
                            options={activeYears}
                            onChange={setYear}
                        />
                    )}

                    <div className="min-w-56 flex-1">
                        <label
                            htmlFor="archive-search"
                            className="flex text-xs font-semibold uppercase text-ink-500"
                        >
                            {t.searchLabel}
                        </label>

                        <div className="relative mt-1.5">
                            <Search
                                aria-hidden="true"
                                className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-400"
                            />
                            <input
                                id="archive-search"
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={t.searchPlaceholder}
                                className="h-11 w-full rounded-lg border border-input bg-surface pl-11 pr-10 text-base text-foreground transition-ui outline-none hover:border-ink-400 focus:border-brand-600"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    aria-label={t.clearSearch}
                                    className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-4">
                    <p className="text-sm text-ink-500" aria-live="polite">
                        {formatCount(locale, visible.length)} {t.resultsLabel}
                    </p>

                    {filtered && (initialContentType ? (
                        <Link
                            href={`/${locale}/news?section=${section}`}
                            className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                        >
                            <SlidersHorizontal className="size-4" aria-hidden="true" />
                            {t.clearFilters}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={reset}
                            className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                        >
                            <SlidersHorizontal className="size-4" aria-hidden="true" />
                            {t.clearFilters}
                        </button>
                    ))}
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-300 bg-surface px-6 py-16 text-center">
                    <p className="text-base font-medium text-ink-700">{t.noMatches}</p>
                    {initialContentType ? (
                        <Link
                            href={`/${locale}/news?section=${section}`}
                            className="mt-3 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                        >
                            {t.clearFilters}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={reset}
                            className="mt-3 min-h-11 rounded-md text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                        >
                            {t.clearFilters}
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-12">
                    {groups.map(([groupYear, groupItems], groupIndex) => (
                        <section
                            key={groupYear}
                            aria-labelledby={`archive-year-${groupYear}`}
                            className="relative pl-5 sm:pl-8"
                        >
                            <span
                                aria-hidden="true"
                                className="absolute bottom-0 left-0 top-2 w-px bg-brand-200"
                            />
                            <span
                                aria-hidden="true"
                                className="absolute left-[-5px] top-2 size-[11px] rounded-full border-2 border-brand-700 bg-surface"
                            />
                            <h2
                                id={`archive-year-${groupYear}`}
                                className="mb-5 text-xl text-brand-800"
                            >
                                {groupYear === "undated"
                                    ? t.undated
                                    : yearLabels.get(groupYear) ?? groupYear}
                            </h2>
                            <ArchiveGrid
                                items={groupItems}
                                t={t}
                                locale={locale}
                                priorityFirst={groupIndex === 0}
                                className="grid gap-5 sm:grid-cols-2"
                            />
                        </section>
                    ))}
                </div>
            )}
        </>
    );
}

/**
 * One dropdown facet. A `<select>` rather than another row of chips: category
 * and year both grow without bound as the archive fills up, and two more
 * wrapping chip rows would bury the grid below the fold.
 */
function Facet({
    label,
    allLabel,
    value,
    options,
    onChange,
}: {
    label: string;
    allLabel: string;
    value: string | null;
    options: { value: string; label: string }[];
    onChange: (value: string | null) => void;
}) {
    const id = `archive-facet-${label}`;

    return (
        <div>
            <label
                htmlFor={id}
                className="flex text-xs font-semibold uppercase text-ink-500"
            >
                {label}
            </label>

            <select
                id={id}
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value || null)}
                className="mt-1.5 h-11 rounded-lg border border-input bg-surface px-3.5 text-base text-foreground transition-ui outline-none hover:border-ink-400 focus:border-brand-600"
            >
                <option value="">{allLabel}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
