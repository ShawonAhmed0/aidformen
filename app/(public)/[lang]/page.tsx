import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Announcement from "@/components/Announcement";
import ArchivePreview from "@/components/ArchivePreview";
import Hero from "@/components/Hero";
import { HomeAboutSection } from "@/components/HomeAboutSection";
import MediaSection from "@/components/MediaSection";
import NewsletterCTA from "@/components/Newsletter";
import { getAboutContent } from "@/lib/content/about";
import { getHomeAboutDoc } from "@/lib/content/home-about";
import { getHeroContent, getSiteSettings } from "@/lib/content/queries";
import { isLocale, pickBrand } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

type HomeProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ about?: string | string[] }>;
};

/** `?about=full` is the shared "About us" link; it opens the essay. */
const opensAbout = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) === "full";

/**
 * A shared About link previews as the About section — its own title, opening
 * line and photograph — rather than as the generic homepage card.
 */
export async function generateMetadata({ params, searchParams }: HomeProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang) || !opensAbout((await searchParams).about)) return {};

  const about = getAboutContent(lang);
  const [settings, t] = await Promise.all([getSiteSettings(), getDictionary(lang)]);
  const siteName = pickBrand(lang, settings?.organisation_name, settings?.organisation_name_en, {
    bn: t.meta.siteName,
    en: t.meta.siteName,
  });
  const [opening] = getHomeAboutDoc(lang).sections;
  const intro = opening?.blocks.find((block) => block.type === "p")?.text ?? "";
  const description = intro.length > 200 ? `${intro.slice(0, 197).trimEnd()}…` : intro;
  const title = lang === "en" ? "About us" : "আমাদের সম্পর্কে";
  // Crawlers drop the #fragment, so og:url carries only what they keep.
  const url = `/${lang}?about=full`;

  return {
    // Absolute: the layout's "%s | name" template doesn't reach a page in its
    // own segment, and a bare "About us" tab title says nothing about whose.
    title: { absolute: `${title} | ${siteName}` },
    description,
    // One canonical homepage; the query only changes what is open on arrival.
    alternates: { canonical: `/${lang}` },
    openGraph: {
      type: "website",
      url,
      title: `${title} — ${siteName}`,
      description,
      images: [{ url: "/about-section/1605975526.jpg", alt: about.photos.rally.alt }],
    },
  };
}

export default async function Home({ params, searchParams }: HomeProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const aboutExpanded = opensAbout((await searchParams).about);

  const [t, settings, hero] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(),
    getHeroContent(),
  ]);

  return (
    <main>
      <Hero locale={lang} />
      <HomeAboutSection locale={lang} hero={hero} expanded={aboutExpanded} />
      <Announcement locale={lang} settings={settings} />
      <ArchivePreview locale={lang} t={t} />
      <MediaSection locale={lang} t={t} />
      <NewsletterCTA t={t} />
    </main>
  );
}
