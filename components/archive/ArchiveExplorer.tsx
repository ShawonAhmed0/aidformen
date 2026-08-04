"use client";

import { useMemo, useState } from "react";
import { Images, Play, Search, SlidersHorizontal, X } from "lucide-react";

import { formatCount } from "@/lib/i18n/config";
import { archiveKinds, type ArchiveItem, type ArchiveKind } from "@/lib/types/archive";
import type { ArchiveLabels } from "./labels";
import { ArchiveGrid } from "./ArchiveGrid";
import { cn } from "@/lib/utils";

type KindFilter = ArchiveKind | "all";

/**
 * Filters plus the results grid.
 *
 * All four filters run in the browser over the full published set. The archive
 * is tens of entries, not thousands, so filtering here costs one pass over an
 * array and keeps every change instant — a server round trip per chip would be
 * slower and would lose the reader's scroll position.
 */
export function ArchiveExplorer({
    items,
    categories,
    years,
    t,
    locale,
}: {
    items: ArchiveItem[];
    categories: string[];
    /** Raw year as the value, localised numerals as the label. */
    years: { value: string; label: string }[];
    t: ArchiveLabels;
    locale: "bn" | "en";
}) {
    const [kind, setKind] = useState<KindFilter>("all");
    const [category, setCategory] = useState<string | null>(null);
    const [year, setYear] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return items.filter((item) => {
            if (kind !== "all" && item.kind !== kind) return false;
            if (category && item.category !== category) return false;
            if (year && item.year !== year) return false;

            if (needle) {
                const haystack = `${item.heading} ${item.body} ${item.category} ${item.location}`;
                if (!haystack.toLowerCase().includes(needle)) return false;
            }

            return true;
        });
    }, [items, kind, category, year, query]);

    const filtered = kind !== "all" || category || year || query.trim();

    const reset = () => {
        setKind("all");
        setCategory(null);
        setYear(null);
        setQuery("");
    };

    const kindLabel: Record<ArchiveKind, string> = {
        photo: t.photoKind,
        video: t.videoKind,
    };

    const kindIcon = { photo: Images, video: Play } as const;

    return (
        <>
            <div className="mb-10 space-y-5">
                {/* Type is the primary split, so it gets the prominent control and
                    sits above the narrower facets. */}
                <div
                    role="tablist"
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
                                role="tab"
                                aria-selected={isActive}
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
                    {categories.length > 0 && (
                        <Facet
                            label={t.filterCategory}
                            allLabel={t.allCategories}
                            value={category}
                            options={categories.map((c) => ({ value: c, label: c }))}
                            onChange={setCategory}
                        />
                    )}

                    {years.length > 0 && (
                        <Facet
                            label={t.filterYear}
                            allLabel={t.allYears}
                            value={year}
                            options={years}
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

                    {filtered && (
                        <button
                            type="button"
                            onClick={reset}
                            className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                        >
                            <SlidersHorizontal className="size-4" aria-hidden="true" />
                            {t.clearFilters}
                        </button>
                    )}
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-300 bg-surface px-6 py-16 text-center">
                    <p className="text-base font-medium text-ink-700">{t.noMatches}</p>
                    <button
                        type="button"
                        onClick={reset}
                        className="mt-3 min-h-11 rounded-md text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                    >
                        {t.clearFilters}
                    </button>
                </div>
            ) : (
                <ArchiveGrid items={visible} t={t} locale={locale} />
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
