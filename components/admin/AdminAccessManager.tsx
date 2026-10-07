"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  KeyRound,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  grantAdminAccess,
  reviewAdminCandidate,
} from "@/lib/actions/admin-access";
import {
  ADMIN_EMAIL_MAX_LENGTH,
  validateAdminEmail,
} from "@/lib/auth/admin-access.mjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Administrator = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  can_manage_admins: boolean;
  created_at: string | null;
};

type Candidate = {
  email: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  alreadyAdmin: boolean;
};

const actionErrors = {
  unauthorized: "Your account cannot manage administrator access.",
  required: "Enter the account email address.",
  invalid: "Enter a valid email address.",
  not_found:
    "No registered account was found for that email. Ask the person to register first, then try again.",
  failed: "Administrator access could not be updated. Please try again.",
} as const;

export function AdminAccessManager({
  currentUserId,
  currentUserEmail,
  administrators,
}: {
  currentUserId: string;
  currentUserEmail: string | null;
  administrators: Administrator[];
}) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const candidateRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [candidate, setCandidate] = useState<Candidate>();
  const [fieldError, setFieldError] = useState<string>();
  const [message, setMessage] = useState<
    { tone: "success" | "error"; text: string } | undefined
  >();

  const showError = (code: keyof typeof actionErrors) => {
    const text = actionErrors[code];

    if (code === "required" || code === "invalid") {
      setFieldError(text);
      setMessage(undefined);
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }

    setMessage({ tone: "error", text });
    requestAnimationFrame(() => messageRef.current?.focus());
  };

  const review = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(undefined);
    setCandidate(undefined);

    const validation = validateAdminEmail(email);
    if (validation) {
      showError(validation);
      return;
    }

    setFieldError(undefined);
    const formData = new FormData();
    formData.set("email", email);

    startTransition(async () => {
      const result = await reviewAdminCandidate(formData);

      if (!result.ok) {
        showError(result.code);
        return;
      }

      setCandidate(result.candidate);

      if (result.candidate.alreadyAdmin) {
        setMessage({
          tone: "success",
          text: "That account already has administrator access.",
        });
      }

      requestAnimationFrame(() => candidateRef.current?.focus());
    });
  };

  const grant = () => {
    if (!candidate || candidate.alreadyAdmin) return;

    const formData = new FormData();
    formData.set("email", candidate.email);
    formData.set("userId", candidate.userId);

    startTransition(async () => {
      const result = await grantAdminAccess(formData);

      if (!result.ok) {
        showError(result.code);
        if (result.code === "invalid" || result.code === "not_found") {
          setCandidate(undefined);
          requestAnimationFrame(() => emailRef.current?.focus());
        }
        return;
      }

      const text =
        result.status === "already_admin"
          ? "That account already has administrator access."
          : "Administrator access has been granted successfully.";

      setMessage({ tone: "success", text });
      setCandidate(undefined);
      setEmail("");
      router.refresh();
      requestAnimationFrame(() => messageRef.current?.focus());
    });
  };

  const changeEmail = () => {
    setCandidate(undefined);
    setMessage(undefined);
    requestAnimationFrame(() => emailRef.current?.focus());
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <Card padded="lg" elevation="sm">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-ink-900">
              Add an administrator
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              The person must already have a registered account. They will be
              able to manage site content, settings, members, media, and forum
              moderation, but cannot add further administrators.
            </p>
          </div>
        </div>

        <form onSubmit={review} noValidate className="mt-7 space-y-5">
          <Field
            label="Registered account email"
            icon={Mail}
            required
            error={fieldError}
          >
            {(props) => (
              <Input
                {...props}
                ref={emailRef}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                maxLength={ADMIN_EMAIL_MAX_LENGTH}
                placeholder="person@example.com"
                value={email}
                disabled={pending || Boolean(candidate)}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setCandidate(undefined);
                  if (fieldError) setFieldError(undefined);
                  if (message) setMessage(undefined);
                }}
              />
            )}
          </Field>

          {!candidate && (
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Search aria-hidden="true" />
              )}
              {pending ? "Checking account…" : "Review account"}
            </Button>
          )}
        </form>

        {candidate && (
          <div
            ref={candidateRef}
            tabIndex={-1}
            role="region"
            aria-labelledby="admin-candidate-heading"
            className="mt-6 rounded-xl border border-brand-200 bg-brand-50/60 p-4 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2 sm:p-5"
          >
            <h3
              id="admin-candidate-heading"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700"
            >
              {candidate.alreadyAdmin
                ? "Already an administrator"
                : "Confirm this account"}
            </h3>

            <div className="mt-3 flex items-center gap-3">
              <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-brand-700 shadow-xs">
                {candidate.avatarUrl ? (
                  <Image
                    src={candidate.avatarUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <User className="size-5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">
                  {candidate.fullName || "Unnamed account"}
                </p>
                <p className="truncate text-sm text-ink-600">{candidate.email}</p>
              </div>
            </div>

            {!candidate.alreadyAdmin && (
              <p className="mt-4 text-sm leading-6 text-ink-700">
                Confirming will give this account access to private administration
                tools and member information.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {!candidate.alreadyAdmin && (
                <Button type="button" disabled={pending} onClick={grant}>
                  {pending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ShieldCheck aria-hidden="true" />
                  )}
                  {pending ? "Granting access…" : "Confirm & grant access"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={changeEmail}
              >
                <ArrowLeft aria-hidden="true" />
                Change email
              </Button>
            </div>
          </div>
        )}

        {message && (
          <div
            ref={messageRef}
            tabIndex={-1}
            role={message.tone === "error" ? "alert" : "status"}
            className={
              message.tone === "success"
                ? "mt-5 flex items-start gap-2 rounded-lg border border-success-line bg-success-soft px-4 py-3 text-sm text-success focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
                : "mt-5 rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
            }
          >
            {message.tone === "success" && (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </Card>

      <div className="space-y-6">
        <Card padded="md" elevation="xs" className="overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-ochre-50 text-ochre-800">
              <Crown className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                Your account
              </p>
              <p className="truncate text-sm font-medium text-ink-900">
                {currentUserEmail ?? "Signed-in administrator"}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm leading-5 text-brand-900">
            You are an access manager. Only access managers can grant
            administrator permissions.
          </div>
        </Card>

        <Card padded="md" elevation="xs">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink-900">
              Current administrators
            </h2>
            <Badge tone="neutral" size="sm">
              {administrators.length}
            </Badge>
          </div>

          {administrators.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-ink-300 p-4 text-sm text-ink-600">
              Administrator accounts could not be loaded.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink-100">
              {administrators.map((administrator) => (
                <li
                  key={administrator.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50">
                    {administrator.avatar_url ? (
                      <Image
                        src={administrator.avatar_url}
                        alt=""
                        fill
                        unoptimized
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <User className="size-4 text-brand-700" aria-hidden="true" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {administrator.full_name || "Unnamed account"}
                      {administrator.id === currentUserId ? " (you)" : ""}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {administrator.email}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone="brand" size="sm">
                        Administrator
                      </Badge>
                      {administrator.can_manage_admins && (
                        <Badge tone="accent" size="sm">
                          Access manager
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
