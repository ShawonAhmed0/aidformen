import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, ArrowRight } from "lucide-react";

import { ArchiveExplorer } from "@/components/archive/ArchiveExplorer";
import { PageHero } from "@/components/PageHero";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { getArchiveEntries } from "@/lib/content/archive";
import { formatYear, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import {
  archiveSectionPath,
  archiveSubsections,
  isArchiveSubsection,
  resolveArchiveEntry,
  subsectionsBySection,
  toArchiveListingItem,
  type ArchiveContentType,
  type ArchiveSection,
  type ArchiveSubsection,
} from "@/lib/types/archive";

function copyFor(t: Awaited<ReturnType<typeof getDictionary>>, section: ArchiveSection) {
  return section === "news_archive"
    ? { title: t.archive.researchTitle, description: t.archive.researchDescription }
    : { title: t.archive.title, description: t.archive.description };
}

export async function archiveSectionMetadata(
  lang: Locale,
  section: ArchiveSection
): Promise<Metadata> {
  const t = await getDictionary(lang);
  const { title, description } = copyFor(t, section);
  const path = archiveSectionPath(section);

  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/${path}`,
      languages: { bn: `/bn/${path}`, en: `/en/${path}` },
    },
    openGraph: { type: "website", url: `/${lang}/${path}`, title, description },
  };
}

/**
 * Resolves a `?type=` value to a subsection. Accepts the subsection ids and,
 * for links shared before subsections existed, the raw content types
 * ("event" → News & Events).
 */
function subsectionFrom(value: string | undefined): ArchiveSubsection | null {
  if (!value) return null;
  if (isArchiveSubsection(value)) return value;

  const match = (Object.keys(archiveSubsections) as ArchiveSubsection[]).find(
    (key) =>
      (archiveSubsections[key] as readonly ArchiveContentType[]).includes(
        value as ArchiveContentType
      )
  );
  return match ?? null;
}

/**
 * One public archive section: the Media Center at /news or Research & Case
 * Studies at /research. Same explorer, different slice of the entries.
 */
export async function ArchiveSectionPage({
  lang,
  section,
  searchParams,
}: {
  lang: Locale;
  section: ArchiveSection;
  searchParams: { section?: string | string[]; type?: string | string[] };
}) {
  const rawType = Array.isArray(searchParams.type)
    ? searchParams.type[0]
    : searchParams.type;
  const requested = subsectionFrom(rawType);

  // Old /news?section=news_archive links, and any subsection that belongs to
  // the other section, go to the page that actually lists them.
  const legacySection = Array.isArray(searchParams.section)
    ? searchParams.section[0]
    : searchParams.section;
  const owner: ArchiveSection | null = requested
    ? subsectionsBySection.press_media.includes(requested)
      ? "press_media"
      : "news_archive"
    : legacySection === "news_archive" || legacySection === "press_media"
      ? legacySection
      : null;
  if (owner && owner !== section) {
    const target = `/${lang}/${archiveSectionPath(owner)}`;
    redirect(requested ? `${target}?type=${requested}` : target);
  }

  const [t, entries] = await Promise.all([getDictionary(lang), getArchiveEntries()]);
  const { title, description } = copyFor(t, section);

  const items = entries
    .map((entry) => toArchiveListingItem(resolveArchiveEntry(lang, entry)))
    .filter((item) => item.section === section);
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, lang));
  const years = Array.from(
    new Set(
      items.map((item) => item.year).filter((value): value is string => Boolean(value))
    )
  )
    .sort((a, b) => b.localeCompare(a))
    .map((year) => ({ value: year, label: formatYear(lang, year) }));

  const basePath = `/${lang}/${archiveSectionPath(section)}`;

  return (
    <main data-print-document>
      <PageHero eyebrow={t.archive.eyebrow} title={title} description={description} />

      <Section space="md" followsHero>
        {items.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-ink-300 bg-surface px-6 py-16 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Archive className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-2xl text-brand-800">{t.archive.emptyTitle}</h2>
            <p className="mx-auto mt-3 max-w-md text-base text-ink-600">
              {t.archive.sectionEmpty}
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
            key={requested ?? "all"}
            items={items}
            categories={categories}
            years={years}
            t={t.archive}
            locale={lang}
            section={section}
            basePath={basePath}
            subsection={requested}
          />
        )}

        {/* Research grows from cases people bring to the foundation, so the
            page ends by asking for them. */}
        {section === "news_archive" && (
          <div className="mt-14 flex flex-col gap-5 rounded-2xl bg-brand-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-2xl">
              <h2 className="text-xl text-white sm:text-2xl">{t.archive.researchCtaTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-brand-100 sm:text-base">
                {t.archive.researchCtaBody}
              </p>
            </div>
            <Link
              href={`/${lang}/contact`}
              className={buttonVariants({ variant: "onDark", className: "shrink-0 gap-2" })}
            >
              {t.archive.researchCtaButton}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        )}
      </Section>
    </main>
  );
}
