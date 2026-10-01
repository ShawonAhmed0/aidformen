import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const t = await getDictionary(lang);

  return {
    title: t.auth.forgotPasswordTitle,
    description: t.auth.forgotPasswordSubtitle,
    alternates: {
      canonical: `/${lang}/forgot-password`,
      languages: {
        bn: "/bn/forgot-password",
        en: "/en/forgot-password",
      },
    },
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = await getDictionary(lang);

  return <ForgotPasswordForm locale={lang} t={t} />;
}
