import { notFound } from "next/navigation";

import Announcement from "@/components/Announcement";
import ArchivePreview from "@/components/ArchivePreview";
import Hero from "@/components/Hero";
import LatestActivities from "@/components/LatestActivities";
import MediaSection from "@/components/MediaSection";
import NewsletterCTA from "@/components/Newsletter";
import { getSiteSettings } from "@/lib/content/queries";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/config";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [t, settings] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(),
  ]);

  return (
    <main>
      <Hero locale={lang} />
      <Announcement locale={lang} settings={settings} />
      <LatestActivities locale={lang} t={t} />
      <ArchivePreview locale={lang} t={t} />
      <MediaSection locale={lang} t={t} />
      <NewsletterCTA t={t} />
    </main>
  );
}
