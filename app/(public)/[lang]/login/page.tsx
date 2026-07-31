import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LoginForm } from "@/components/forms/LoginForm";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isLocale } from "@/lib/i18n/config";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    if (!isLocale(lang)) return {};
    const t = await getDictionary(lang);
    return { title: t.auth.loginCta, robots: { index: false } };
}

export default async function LoginPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();

    const t = await getDictionary(lang);

    return <LoginForm locale={lang} t={t} />;
}
