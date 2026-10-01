"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { validateNewPassword } from "@/lib/auth/recovery.mjs";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type View = "ready" | "updating" | "success" | "invalid";

export function ResetPasswordForm({
  canReset,
  locale,
  t,
}: {
  canReset: boolean;
  locale: Locale;
  t: Dictionary;
}) {
  const supabase = createClient();
  const stateHeadingRef = useRef<HTMLHeadingElement>(null);
  const [view, setView] = useState<View>(canReset ? "ready" : "invalid");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (view === "success" || view === "invalid") {
      stateHeadingRef.current?.focus({ preventScroll: true });
    }
  }, [view]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setPasswordError(null);
    setConfirmationError(null);

    const validationError = validateNewPassword(password, confirmation);

    if (validationError) {
      if (validationError === "required") {
        if (!password) setPasswordError(t.auth.errPasswordRequired);
        if (!confirmation) setConfirmationError(t.auth.errPasswordRequired);
      } else if (validationError === "too-short") {
        setPasswordError(t.auth.errRecoveryPasswordShort);
      } else {
        setConfirmationError(t.auth.errPasswordMatch);
      }

      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
      return;
    }

    setView("updating");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await fetch(`/${locale}/auth/recovery-complete`, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
      }).catch(() => undefined);

      const { error: signOutError } = await supabase.auth.signOut({
        scope: "global",
      });

      if (signOutError) {
        await supabase.auth.signOut({ scope: "local" });
      }

      setPassword("");
      setConfirmation("");
      setView("success");
    } catch {
      setView("ready");
      setFormError(t.auth.passwordUpdateFailed);
      toast.error(t.auth.passwordUpdateFailed);
    }
  };

  return (
    <main className="bg-surface-sunken">
      <Container className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center py-10 sm:py-14">
        <Card padded="lg" elevation="md" className="w-full max-w-md overflow-hidden">
          {view === "invalid" ? (
            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-warning-line bg-warning-soft text-warning-strong">
                <TriangleAlert className="size-8" aria-hidden="true" />
              </div>
              <h1
                ref={stateHeadingRef}
                tabIndex={-1}
                className="mt-5 text-3xl text-brand-800 outline-none"
              >
                {t.auth.resetLinkInvalidTitle}
              </h1>
              <p className="mt-3 text-sm text-ink-600">
                {t.auth.resetLinkInvalidBody}
              </p>

              <div className="mt-7 space-y-3">
                <Link
                  href={`/${locale}/forgot-password`}
                  className={cn(
                    buttonVariants({ variant: "primary", size: "lg" }),
                    "w-full",
                  )}
                >
                  {t.auth.requestNewResetLink}
                  <ArrowRight aria-hidden="true" />
                </Link>
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
          ) : view === "success" ? (
            <div role="status" aria-live="polite" className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-success-line bg-success-soft text-success">
                <CheckCircle2 className="size-8" aria-hidden="true" />
              </div>
              <h1
                ref={stateHeadingRef}
                tabIndex={-1}
                className="mt-5 text-3xl text-brand-800 outline-none"
              >
                {t.auth.passwordUpdatedTitle}
              </h1>
              <p className="mt-3 text-sm text-ink-600">
                {t.auth.passwordUpdatedBody}
              </p>
              <Link
                href={`/${locale}/login`}
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "mt-7 w-full",
                )}
              >
                {t.auth.loginCta}
                <ArrowRight aria-hidden="true" />
              </Link>
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
                  {t.auth.resetPasswordTitle}
                </h1>
                <p className="mt-3 text-sm text-ink-600">
                  {t.auth.resetPasswordSubtitle}
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
                  label={t.auth.newPassword}
                  icon={Lock}
                  helper={t.auth.recoveryPasswordHelper}
                  error={passwordError}
                  required
                >
                  {(props) => (
                    <div className="relative">
                      <Input
                        {...props}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        disabled={view === "updating"}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        className={`${props.className} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-800"
                        aria-label={
                          showPassword
                            ? t.auth.hidePassword
                            : t.auth.showPassword
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-[18px]" aria-hidden="true" />
                        ) : (
                          <Eye className="size-[18px]" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  )}
                </Field>

                <Field
                  label={t.auth.confirmNewPassword}
                  icon={Lock}
                  error={confirmationError}
                  required
                >
                  {(props) => (
                    <div className="relative">
                      <Input
                        {...props}
                        name="confirmPassword"
                        type={showConfirmation ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmation}
                        disabled={view === "updating"}
                        onChange={(event) => {
                          setConfirmation(event.target.value);
                          if (confirmationError) setConfirmationError(null);
                        }}
                        className={`${props.className} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmation((visible) => !visible)
                        }
                        className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-800"
                        aria-label={
                          showConfirmation
                            ? t.auth.hidePassword
                            : t.auth.showPassword
                        }
                      >
                        {showConfirmation ? (
                          <EyeOff className="size-[18px]" aria-hidden="true" />
                        ) : (
                          <Eye className="size-[18px]" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  )}
                </Field>

                <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
                  <ShieldCheck
                    className="mt-0.5 size-5 shrink-0 text-brand-700"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-brand-900">
                    {t.auth.recoverySecurityNote}
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={view === "updating"}
                >
                  {view === "updating" ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      {t.auth.updatingPassword}
                    </>
                  ) : (
                    <>
                      {t.auth.updatePassword}
                      <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </Card>
      </Container>
    </main>
  );
}
