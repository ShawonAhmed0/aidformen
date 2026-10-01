"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Loader2,
  Mail,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  normalizeRecoveryEmail,
  recoveryCallbackUrl,
  validateRecoveryEmail,
} from "@/lib/auth/recovery.mjs";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary;
}) {
  const supabase = createClient();
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (sent) successHeadingRef.current?.focus({ preventScroll: true });
  }, [sent]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validationError = validateRecoveryEmail(email);
    if (validationError) {
      setEmailError(
        validationError === "required"
          ? t.auth.errEmailRequired
          : t.auth.errEmailFormat,
      );
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
      return;
    }

    setEmailError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizeRecoveryEmail(email),
        {
          redirectTo: recoveryCallbackUrl(window.location.origin, locale),
        },
      );

      if (error) throw error;

      setSent(true);
    } catch {
      setFormError(t.auth.resetRequestFailed);
      toast.error(t.auth.resetRequestFailed);
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setSent(false);
    setEmail("");
    setEmailError(null);
    setFormError(null);
  };

  return (
    <main className="bg-surface-sunken">
      <Container className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center py-10 sm:py-14">
        <Card padded="lg" elevation="md" className="w-full max-w-md overflow-hidden">
          {sent ? (
            <div role="status" aria-live="polite" className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-success-line bg-success-soft text-success">
                <MailCheck className="size-8" aria-hidden="true" />
              </div>

              <h1
                ref={successHeadingRef}
                tabIndex={-1}
                className="mt-5 text-3xl text-brand-800 outline-none"
              >
                {t.auth.resetLinkSentTitle}
              </h1>
              <p className="mt-3 text-sm text-ink-600">
                {t.auth.resetLinkSentBody}
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left">
                <ShieldCheck
                  className="mt-0.5 size-5 shrink-0 text-brand-700"
                  aria-hidden="true"
                />
                <p className="text-xs text-brand-900">
                  {t.auth.recoverySecurityNote}
                </p>
              </div>

              <div className="mt-7 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={startOver}
                >
                  {t.auth.tryAnotherEmail}
                </Button>
                <Link
                  href={`/${locale}/login`}
                  className={cn(
                    buttonVariants({ variant: "link", size: "md" }),
                    "w-full",
                  )}
                >
                  <ArrowLeft aria-hidden="true" />
                  {t.auth.backToLogin}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/logo (1).png"
                  alt="Aid For Men Foundation"
                  width={60}
                  height={60}
                  priority
                  className="size-15 object-contain"
                />

                <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                  <KeyRound className="size-4" aria-hidden="true" />
                  <span>{t.auth.recoveryEyebrow}</span>
                </div>
                <h1 className="mt-3 text-3xl text-brand-800">
                  {t.auth.forgotPasswordTitle}
                </h1>
                <p className="mt-3 text-sm text-ink-600">
                  {t.auth.forgotPasswordSubtitle}
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                {formError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger"
                  >
                    {formError}
                  </div>
                )}

                <Field
                  label={t.auth.email}
                  icon={Mail}
                  error={emailError}
                  required
                >
                  {(props) => (
                    <Input
                      {...props}
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="example@email.com"
                      value={email}
                      disabled={loading}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (emailError) setEmailError(null);
                      }}
                    />
                  )}
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      {t.auth.sendingResetLink}
                    </>
                  ) : (
                    <>
                      {t.auth.sendResetLink}
                      <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-7 border-t border-ink-200 pt-5 text-center">
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800 hover:underline"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  {t.auth.backToLogin}
                </Link>
              </div>
            </>
          )}
        </Card>
      </Container>
    </main>
  );
}
