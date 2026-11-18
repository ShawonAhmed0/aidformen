import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ArchiveSectionPage,
  archiveSectionMetadata,
} from "@/components/archive/ArchiveSectionPage";
import { isLocale } from "@/lib/i18n/config";

/** Media Center: News & Events, Press Release and Media Coverage. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return archiveSectionMetadata(lang, "press_media");
}

export default async function MediaCenterPage({
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
      section="press_media"
      searchParams={await searchParams}
    />
  );
}
