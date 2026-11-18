import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactForm } from "@/components/forms/ContactForm";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getSiteSettings } from "@/lib/content/queries";
import { isLocale } from "@/lib/i18n/config";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    if (!isLocale(lang)) return {};
    const t = await getDictionary(lang);
    return { title: t.contact.title };
}

export default async function ContactPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();

    const [t, settings] = await Promise.all([getDictionary(lang), getSiteSettings()]);

    return <ContactForm locale={lang} t={t} settings={settings} />;
}
