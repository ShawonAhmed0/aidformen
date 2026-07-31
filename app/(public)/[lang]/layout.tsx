import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Document } from "@/app/document";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getSiteSettings } from "@/lib/content/queries";
import { isLocale, locales, localeHtmlLang, pick } from "@/lib/i18n/config";
import "@/app/globals.css";

/** Pre-render both locales at build time. */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const [t, settings] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(),
  ]);

  const name =
    pick(lang, settings?.organisation_name, settings?.organisation_name_en) ||
    t.meta.siteName;
  const description =
    pick(lang, settings?.tagline, settings?.tagline_en) || t.meta.description;

  return {
    metadataBase: new URL("https://aidformen.com"),
    title: { default: name, template: `%s | ${name}` },
    description,
    // Tells search engines the two language versions are equivalents rather
    // than duplicate content.
    alternates: {
      canonical: `/${lang}`,
      languages: { bn: "/bn", en: "/en" },
    },
    openGraph: {
      type: "website",
      locale: lang === "bn" ? "bn_BD" : "en_US",
      siteName: name,
      title: name,
      description,
    },
  };
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [t, settings] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(),
  ]);

  return (
    <Document lang={localeHtmlLang[lang]}>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100"
        >
          {t.nav.skipToContent}
        </a>

        <Navbar locale={lang} t={t} settings={settings} />

        <div id="main" className="flex-1">
          {children}
        </div>

        <Footer locale={lang} t={t} settings={settings} />
      </div>
    </Document>
  );
}
