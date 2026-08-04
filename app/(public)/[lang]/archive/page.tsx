import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive } from "lucide-react";

import { getDictionary } from "@/lib/i18n/dictionary";
import { formatYear, isLocale } from "@/lib/i18n/config";
import { getArchiveEntries } from "@/lib/content/archive";
import { resolveArchiveEntry } from "@/lib/types/archive";
import { ArchiveExplorer } from "@/components/archive/ArchiveExplorer";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui/section";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    if (!isLocale(lang)) return {};
    const t = await getDictionary(lang);
    return { title: t.archive.title, description: t.archive.description };
}

export default async function ArchivePage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();

    const [t, entries] = await Promise.all([
        getDictionary(lang),
        getArchiveEntries(),
    ]);

    // Resolved on the server so the client filter only handles display strings.
    const items = entries.map((entry) => resolveArchiveEntry(lang, entry));

    // Facets come from what is actually published rather than a fixed list, so a
    // category nobody has used never appears as a dead-end filter.
    const categories = Array.from(
        new Set(items.map((item) => item.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, lang));

    const years = Array.from(
        new Set(items.map((item) => item.year).filter((y): y is string => Boolean(y)))
    )
        .sort((a, b) => b.localeCompare(a))
        .map((year) => ({ value: year, label: formatYear(lang, year) }));

    return (
        <main>
            <PageHero
                eyebrow={t.archive.eyebrow}
                title={t.archive.title}
                description={t.archive.description}
            />

            <Section space="lg">
                {items.length === 0 ? (
                    <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-ink-300 bg-surface px-6 py-16 text-center">
                        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                            <Archive className="size-7" aria-hidden="true" />
                        </span>

                        <h2 className="mt-6 text-2xl text-brand-800">
                            {t.archive.emptyTitle}
                        </h2>

                        <p className="mx-auto mt-3 max-w-md text-base text-ink-600">
                            {t.archive.emptyBody}
                        </p>

                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <Link href={`/${lang}`} className={buttonVariants()}>
                                {t.archive.viewRecent}
                            </Link>
                            <Link
                                href={`/${lang}/contact`}
                                className={buttonVariants({ variant: "outline" })}
                            >
                                {t.nav.contact}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <ArchiveExplorer
                        items={items}
                        categories={categories}
                        years={years}
                        t={t.archive}
                        locale={lang}
                    />
                )}
            </Section>
        </main>
    );
}
