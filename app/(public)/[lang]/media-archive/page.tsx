import type { Metadata } from "next";
import { Images } from "lucide-react";
import { notFound } from "next/navigation";

import { MediaLibraryGallery } from "@/components/media-library/MediaLibraryGallery";
import { getMediaLibraryLabels } from "@/components/media-library/labels";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui/section";
import { getMediaAssets } from "@/lib/content/media-library";
import { isLocale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const labels = getMediaLibraryLabels(lang);

  return {
    title: labels.title,
    description: labels.description,
    alternates: {
      canonical: `/${lang}/media-archive`,
      languages: {
        bn: "/bn/media-archive",
        en: "/en/media-archive",
      },
    },
    openGraph: {
      type: "website",
      url: `/${lang}/media-archive`,
      title: labels.title,
      description: labels.description,
    },
  };
}

export default async function MediaArchivePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const labels = getMediaLibraryLabels(lang);
  const assets = await getMediaAssets();

  return (
    <main>
      <PageHero
        eyebrow={labels.eyebrow}
        title={labels.title}
        description={labels.description}
        media={
          <span className="flex size-16 items-center justify-center rounded-2xl bg-surface text-brand-700 shadow-sm">
            <Images className="size-8" aria-hidden="true" />
          </span>
        }
      />

      <Section space="md" containerWidth="wide">
        <MediaLibraryGallery assets={assets} locale={lang} />
      </Section>
    </main>
  );
}
