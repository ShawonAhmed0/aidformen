import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";
import {
  isRecoverySessionForUser,
  RECOVERY_SESSION_COOKIE,
} from "@/lib/auth/recovery.mjs";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const t = await getDictionary(lang);

  return {
    title: t.auth.resetPasswordTitle,
    description: t.auth.resetPasswordSubtitle,
    alternates: {
      canonical: `/${lang}/reset-password`,
      languages: {
        bn: "/bn/reset-password",
        en: "/en/reset-password",
      },
    },
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [t, query, cookieStore] = await Promise.all([
    getDictionary(lang),
    searchParams,
    cookies(),
  ]);

  const recoveryMarker = cookieStore.get(RECOVERY_SESSION_COOKIE)?.value;
  const hasInvalidLinkError = query.error === "invalid_link";
  let verifiedUserId: string | undefined;

  if (recoveryMarker && !hasInvalidLinkError) {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error) verifiedUserId = user?.id;
  }

  return (
    <ResetPasswordForm
      canReset={
        !hasInvalidLinkError &&
        isRecoverySessionForUser(recoveryMarker, verifiedUserId)
      }
      locale={lang}
      t={t}
    />
  );
}
