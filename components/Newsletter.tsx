"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Lock, Mail } from "lucide-react";

import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Container } from "./ui/container";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function NewsletterCTA({ t }: { t: Dictionary }) {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [pending, startTransition] = useTransition();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const body = new FormData();
        body.append("email", email);

        startTransition(async () => {
            const result = await subscribeToNewsletter(body);
            if (!result.ok) {
                setError(result.error);
                return;
            }
            setDone(true);
            setEmail("");
        });
    };

    return (
        <section className="pb-16 sm:pb-20 lg:pb-24">
            <Container>
                <div className="relative overflow-hidden rounded-3xl bg-brand-800 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                    {/* Soft light behind the copy and the form, in place of the
                        old watermark that sat alone in an empty right half. */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-brand-600/40 blur-3xl"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-24 -bottom-40 size-96 rounded-full bg-brand-950/60 blur-3xl"
                    />

                    <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
                        <div>
                            <span className="flex size-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                                <Mail className="size-6 text-brand-100" aria-hidden="true" />
                            </span>

                            <h2 className="mt-5 text-3xl text-white sm:text-4xl">
                                {t.home.newsletterTitle}
                            </h2>

                            <p className="mt-3 text-base leading-7 text-brand-100 sm:text-lg">
                                {t.home.newsletterBody}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/6 p-5 ring-1 ring-white/12 backdrop-blur-sm sm:p-6">
                            {done ? (
                                <p
                                    role="status"
                                    className="flex items-center gap-2.5 rounded-xl bg-white/10 px-5 py-4 text-base font-medium text-white"
                                >
                                    <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
                                    {t.home.newsletterSuccess}
                                </p>
                            ) : (
                                <form
                                    onSubmit={handleSubmit}
                                    noValidate
                                    className="flex flex-col gap-3 sm:flex-row"
                                >
                                    <div className="flex-1">
                                        <label htmlFor="newsletter-email" className="sr-only">
                                            {t.home.newsletterPlaceholder}
                                        </label>
                                        <Input
                                            id="newsletter-email"
                                            name="email"
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            required
                                            aria-invalid={error ? true : undefined}
                                            aria-describedby={
                                                error ? "newsletter-error" : undefined
                                            }
                                            placeholder={t.home.newsletterPlaceholder}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-13 border-transparent bg-white text-ink-900 placeholder:text-ink-400 hover:border-transparent focus:border-transparent"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="onDark"
                                        size="lg"
                                        disabled={pending}
                                    >
                                        {pending && (
                                            <Loader2
                                                className="animate-spin"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {t.home.newsletterCta}
                                    </Button>
                                </form>
                            )}

                            {error && (
                                <p
                                    id="newsletter-error"
                                    role="alert"
                                    className="mt-3 text-sm font-medium text-ochre-200"
                                >
                                    {error}
                                </p>
                            )}

                            <p className="mt-4 flex items-center gap-2 text-xs text-brand-100">
                                <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                                {t.home.newsletterPrivacy}
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
