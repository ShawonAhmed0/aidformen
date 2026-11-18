"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { formatCount } from "@/lib/i18n/config";
import {
    archiveKinds,
    archiveSubsections,
    sortArchiveItemsNewestFirst,
    subsectionsBySection,
    type ArchiveContentType,
    type ArchiveListingItem,
    type ArchiveKind,
    type ArchiveSection,
    type ArchiveSubsection,
} from "@/lib/types/archive";
import type { ArchiveLabels } from "./labels";
import { ArchiveGrid } from "./ArchiveGrid";
import { cn } from "@/lib/utils";

type KindFilter = ArchiveKind | "all";

const inSubsection = (item: ArchiveListingItem, subsection: ArchiveSubsection) =>
    (archiveSubsections[subsection] as readonly ArchiveContentType[]).includes(
        item.contentType
    );

/**
 * Filters plus the results grid for one section (Media Center or Research &
 * Case Studies); the page hands over only that section's items.
 *
 * The subsection tabs are links so each view is shareable. The narrower
 * presentation, category, year, and text filters then run in the browser over
 * the published set so those quick refinements preserve scroll.
 */
export function ArchiveExplorer({
    items,
    categories,
    years,
    t,
    locale,
    section,
    basePath,
    subsection,
}: {
    items: ArchiveListingItem[];
    categories: string[];
    /** Raw year as the value, localised numerals as the label. */
    years: { value: string; label: string }[];
    t: ArchiveLabels;
    locale: "bn" | "en";
    section: ArchiveSection;
    /** The section's own page, e.g. /en/news; subsection links hang off it. */
    basePath: string;
    subsection: ArchiveSubsection | null;
}) {
    const [kind, setKind] = useState<KindFilter>("all");
    const [category, setCategory] = useState<string | null>(null);
    const [year, setYear] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return sortArchiveItemsNewestFirst(
            items.filter((item) => {
                if (subsection && !inSubsection(item, subsection)) return false;
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
    }, [items, subsection, kind, category, year, query]);

    const filtered =
        Boolean(subsection) || kind !== "all" || category || year || query.trim();

    const inView = (item: ArchiveListingItem) =>
        !subsection || inSubsection(item, subsection);
    const activeCategories = categories.filter((value) =>
        items.some((item) => inView(item) && item.category === value)
    );
    const activeKinds = archiveKinds.filter((value) =>
        items.some((item) => inView(item) && item.kind === value)
    );
    const activeYears = years.filter((option) =>
        items.some((item) => inView(item) && item.year === option.value)
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

    const subsectionLabel: Record<ArchiveSubsection, string> = {
        news_events: t.subNewsEvents,
        press_release: t.subPressRelease,
        media_coverage: t.subMediaCoverage,
        case_study: t.subCaseStudy,
        report: t.subReport,
    };

    const tabs: { value: ArchiveSubsection | null; label: string; count: number }[] = [
        { value: null, label: t.allContentTypes, count: items.length },
        ...subsectionsBySection[section].map((value) => ({
            value,
            label: subsectionLabel[value],
            count: items.filter((item) => inSubsection(item, value)).length,
        })),
    ];

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
                {/* The section's subsections, as tabs. Links rather than state
                    so a subsection can be shared and survives a reload. */}
                <nav aria-label={t.filterContentType}>
                    <ul className="-mx-5 flex gap-1 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                        <li className="flex min-w-max gap-1 rounded-2xl bg-surface-sunken p-1.5 ring-1 ring-ink-200/70">
                            {tabs.map((tab) => {
                                const active = subsection === tab.value;
                                return (
                                    <Link
                                        key={tab.value ?? "all"}
                                        href={tab.value ? `${basePath}?type=${tab.value}` : basePath}
                                        scroll={false}
                                        aria-current={active ? "page" : undefined}
                                        className={cn(
                                            "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-ui sm:px-5",
                                            active
                                                ? "bg-surface text-brand-900 shadow-sm ring-1 ring-ink-200"
                                                : "text-ink-600 hover:bg-surface/70 hover:text-brand-800"
                                        )}
                                    >
                                        {tab.label}
                                        <span
                                            className={cn(
                                                "rounded-full px-1.5 py-0.5 text-2xs leading-none tabular-nums",
                                                active
                                                    ? "bg-brand-800 text-white"
                                                    : "bg-ink-200/70 text-ink-600"
                                            )}
                                        >
                                            {formatCount(locale, tab.count)}
                                        </span>
                                    </Link>
                                );
                            })}
                        </li>
                    </ul>
                </nav>

                {/* Format joins category and year as a dropdown: as a second
                    row of chips it put two "All" rows directly under each
                    other and read as a duplicate of the subsection tabs. */}
                <div className="flex flex-wrap items-end gap-4">
                    {activeKinds.length > 1 && (
                        <Facet
                            label={t.filterFormat}
                            allLabel={t.allFormats}
                            value={kind === "all" ? null : kind}
                            options={activeKinds.map((value) => ({
                                value,
                                label: kindLabel[value],
                            }))}
                            onChange={(value) => setKind((value as ArchiveKind | null) ?? "all")}
                        />
                    )}

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
                        {formatCount(locale, visible.length)}{" "}
                        {visible.length === 1 ? t.resultLabel : t.resultsLabel}
                    </p>

                    {filtered && (subsection ? (
                        <Link
                            href={basePath}
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
                    <p className="text-base font-medium text-ink-700">
                        {filtered ? t.noMatches : t.sectionEmpty}
                    </p>
                    {!filtered ? null : subsection ? (
                        <Link
                            href={basePath}
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
                                className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
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
