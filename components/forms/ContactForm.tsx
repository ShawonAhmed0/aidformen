"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, ExternalLink } from "lucide-react";

import { PageHero } from "@/components/PageHero";
import { pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SiteSettings } from "@/lib/types/content";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";



type Errors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

export function ContactForm({
    locale,
    t,
    settings,
}: {
    locale: Locale;
    t: Dictionary;
    settings?: SiteSettings | null;
}) {
    // Contact details come from site settings, with the previous hardcoded
    // values as fallback so the page is never blank.
    const email = settings?.contact_email?.trim() || "info@aidformen.org";
    const emergency = settings?.emergency_phone?.trim() || "01404555999";
    const address =
        pick(locale, settings?.address, settings?.address_en) ||
        "১৯৩, মতিঝিল, ঢাকা-১০০০";
    const hours = pick(locale, settings?.office_hours, settings?.office_hours_en);
    const mapQuery = encodeURIComponent(address);

    const details = [
        {
            icon: Phone,
            label: t.contact.emergency,
            value: emergency,
            href: `tel:${emergency}`,
            urgent: true,
        },
        {
            icon: Mail,
            label: t.contact.email,
            value: email,
            href: `mailto:${email}`,
        },
        { icon: MapPin, label: t.contact.address, value: address },
        ...(hours ? [{ icon: Clock, label: t.contact.hours, value: hours }] : []),
    ];

    const [values, setValues] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [errors, setErrors] = useState<Errors>({});

    const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [key]: event.target.value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        // Always prevent the native submit. With no action attribute the browser
        // would GET this same page with the sender's name, email and message in
        // the query string — those land in history, logs and the Referer header.
        event.preventDefault();

        const next: Errors = {};
        if (!values.name.trim()) next.name = t.contact.errName;
        if (!values.email.trim()) {
            next.email = t.contact.errEmail;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            next.email = t.contact.errEmailFormat;
        }
        if (!values.subject.trim()) next.subject = t.contact.errSubject;
        if (!values.message.trim()) next.message = t.contact.errMessage;

        setErrors(next);

        if (Object.keys(next).length > 0) {
            // Move focus to the first invalid field so keyboard and screen
            // reader users are taken straight to the problem.
            const firstInvalid = document.querySelector<HTMLElement>(
                "[aria-invalid='true']"
            );
            firstInvalid?.focus();
            return;
        }

        // No submission backend exists yet, so hand the message to the user's
        // mail client rather than dropping it.
        const body = `${values.message}\n\n—\n${values.name}\n${values.email}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(
            values.subject
        )}&body=${encodeURIComponent(body)}`;
    };

    return (
        <main>
            <PageHero
                eyebrow={t.contact.title}
                title={t.contact.title}
                description={t.contact.description}
            />

            <Section space="lg">
                <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
                    {/* Details */}
                    <div className="space-y-4 lg:col-span-2">
                        {details.map(({ icon: Icon, label, value, href, urgent }) => {
                            const inner = (
                                <>
                                    <span
                                        className={
                                            urgent
                                                ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger"
                                                : "flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"
                                        }
                                    >
                                        <Icon className="size-5" aria-hidden="true" />
                                    </span>

                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-ink-500">
                                            {label}
                                        </span>
                                        <span className="mt-1 block text-base font-medium text-ink-900">
                                            {value}
                                        </span>
                                    </span>
                                </>
                            );

                            return (
                                <Card key={label} padded="none">
                                    {href ? (
                                        <a
                                            href={href}
                                            className="flex items-start gap-4 rounded-xl p-5 transition-ui hover:bg-surface-sunken"
                                        >
                                            {inner}
                                        </a>
                                    ) : (
                                        <div className="flex items-start gap-4 p-5">
                                            {inner}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}

                        {/* The previous embed pointed at an empty ?pb= parameter and
                            rendered a broken 450px frame. A direct link is honest
                            and costs no third-party script. */}
                        <Card padded="none">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-4 rounded-xl p-5 transition-ui hover:bg-surface-sunken"
                            >
                                <span className="flex items-start gap-4">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ochre-50 text-ochre-700">
                                        <MapPin className="size-5" aria-hidden="true" />
                                    </span>
                                    <span>
                                        <span className="block text-sm font-medium text-ink-500">
                                            {t.contact.viewOnMap}
                                        </span>
                                        <span className="mt-1 block text-base font-medium text-ink-900">
                                            Google Maps
                                        </span>
                                    </span>
                                </span>
                                <ExternalLink
                                    className="size-4 shrink-0 text-ink-400"
                                    aria-hidden="true"
                                />
                                <span className="sr-only">{t.common.openInNewTab}</span>
                            </a>
                        </Card>
                    </div>

                    {/* Form */}
                    <Card padded="lg" elevation="sm" className="lg:col-span-3">
                        <h2 className="text-2xl text-brand-800">{t.contact.formTitle}</h2>
                        <p className="mt-2 text-sm text-ink-600">
                            ফর্মটি পূরণ করলে আপনার ইমেইল অ্যাপে বার্তাটি প্রস্তুত হয়ে
                            যাবে।
                        </p>

                        <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
                            <Field label={t.contact.name} required error={errors.name}>
                                {(props) => (
                                    <Input
                                        {...props}
                                        name="name"
                                        autoComplete="name"
                                        value={values.name}
                                        onChange={set("name")}
                                    />
                                )}
                            </Field>

                            <Field label={t.contact.email} required error={errors.email}>
                                {(props) => (
                                    <Input
                                        {...props}
                                        name="email"
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        placeholder="example@email.com"
                                        value={values.email}
                                        onChange={set("email")}
                                    />
                                )}
                            </Field>

                            <Field label={t.contact.subject} required error={errors.subject}>
                                {(props) => (
                                    <Input
                                        {...props}
                                        name="subject"
                                        value={values.subject}
                                        onChange={set("subject")}
                                    />
                                )}
                            </Field>

                            <Field
                                label={t.contact.message}
                                required
                                error={errors.message}
                                helper={t.contact.messageHelper}
                            >
                                {(props) => (
                                    <Textarea
                                        {...props}
                                        name="message"
                                        rows={6}
                                        value={values.message}
                                        onChange={set("message")}
                                    />
                                )}
                            </Field>

                            <Button type="submit" size="lg" className="w-full">
                                <Send aria-hidden="true" />
                                {t.contact.send}
                            </Button>
                        </form>
                    </Card>
                </div>
            </Section>
        </main>
    );
}
