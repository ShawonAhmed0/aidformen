"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Shield } from "lucide-react";

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
        <section className="pb-20 sm:pb-28 lg:pb-32">
            <Container>
                <div className="relative overflow-hidden rounded-3xl bg-brand-800 text-white">
                    {/* Watermark, cropped by the container so it reads as a
                        deliberate graphic rather than a floating icon. */}
                    <Shield
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-10 top-1/2 size-72 -translate-y-1/2 text-white/6 lg:right-16 lg:size-80"
                    />

                    <div className="relative max-w-xl p-8 sm:p-12 lg:p-16">
                        <h2 className="text-3xl text-white sm:text-4xl">
                            {t.home.newsletterTitle}
                        </h2>

                        <p className="mt-5 text-lg text-brand-100">
                            {t.home.newsletterBody}
                        </p>

                        {done ? (
                            <p
                                role="status"
                                className="mt-8 flex items-center gap-2.5 rounded-xl bg-white/10 px-5 py-4 text-base font-medium text-white"
                            >
                                <CheckCircle2 className="size-5" aria-hidden="true" />
                                {t.home.newsletterSuccess}
                            </p>
                        ) : (
                            <form
                                onSubmit={handleSubmit}
                                noValidate
                                className="mt-8 flex flex-col gap-3 sm:flex-row"
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

                        <p className="mt-4 text-xs text-brand-200">
                            {t.home.newsletterPrivacy}
                        </p>
                    </div>
                </div>
            </Container>
        </section>
    );
}
