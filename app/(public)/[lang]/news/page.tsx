import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Cloud, ShieldCheck } from "lucide-react";

import { ArchiveExplorer } from "@/components/archive/ArchiveExplorer";
import { PageHero } from "@/components/PageHero";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { getArchiveEntries } from "@/lib/content/archive";
import { formatYear, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { resolveArchiveEntry } from "@/lib/types/archive";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);

  return {
    title: t.archive.title,
    description: t.archive.description,
    alternates: {
      canonical: `/${lang}/news`,
      languages: { bn: "/bn/news", en: "/en/news" },
    },
    openGraph: {
      type: "website",
      url: `/${lang}/news`,
      title: t.archive.title,
      description: t.archive.description,
    },
  };
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const requestedSection = (await searchParams).section;
  const initialSection =
    requestedSection === "news_archive" ? "news_archive" : "press_media";

  const [t, entries] = await Promise.all([
    getDictionary(lang),
    getArchiveEntries(),
  ]);

  const items = entries.map((entry) => resolveArchiveEntry(lang, entry));
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, lang));
  const years = Array.from(
    new Set(items.map((item) => item.year).filter((value): value is string => Boolean(value)))
  )
    .sort((a, b) => b.localeCompare(a))
    .map((year) => ({ value: year, label: formatYear(lang, year) }));

  return (
    <main data-print-document>
      <PageHero
        eyebrow={t.archive.eyebrow}
        title={t.archive.title}
        description={t.archive.description}
      />

      <Section space="lg">
        <div className="mb-10 grid gap-4 lg:grid-cols-2" data-print-keep>
          <div className="flex gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
              <Cloud className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg text-brand-900">{t.archive.lightweightTitle}</h2>
              <p className="mt-1.5 text-sm text-ink-600">
                {t.archive.lightweightBody}
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-success-line bg-success-soft p-5 sm:p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success text-white">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg text-success-strong">{t.archive.usageTitle}</h2>
              <p className="mt-1.5 text-sm text-ink-700">{t.archive.usageBody}</p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-ink-300 bg-surface px-6 py-16 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Archive className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-2xl text-brand-800">{t.archive.emptyTitle}</h2>
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
            key={initialSection}
            items={items}
            categories={categories}
            years={years}
            t={t.archive}
            locale={lang}
            initialSection={initialSection}
          />
        )}
      </Section>
    </main>
  );
}
