import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ArchiveSectionPage,
  archiveSectionMetadata,
} from "@/components/archive/ArchiveSectionPage";
import { isLocale } from "@/lib/i18n/config";

/** Research & Case Studies: case studies and statistics/research reports. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return archiveSectionMetadata(lang, "news_archive");
}

export default async function ResearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ section?: string | string[]; type?: string | string[] }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <ArchiveSectionPage
      lang={lang}
      section="news_archive"
      searchParams={await searchParams}
    />
  );
}
