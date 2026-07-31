import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    ChevronLeft,
    HeartHandshake,
    AlertTriangle,
} from "lucide-react";

import { getActivities } from "@/lib/content/queries";
import { pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Activity } from "@/lib/types/content";
import { Section } from "./ui/section";
import { SectionHeading } from "./ui/section-heading";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";

/** Formats an ISO date in the locale's own numerals and month names. */
function formatDate(iso: string | null, locale: Locale) {
    if (!iso) return null;
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

export default async function LatestActivities({
    locale,
    t,
}: {
    locale: Locale;
    t: Dictionary;
}) {
    const [feature, advisory, secondary] = await Promise.all([
        getActivities("feature"),
        getActivities("advisory"),
        getActivities("secondary"),
    ]);

    const lead: Activity | undefined = feature[0];
    const note: Activity | undefined = advisory[0];

    // Nothing published in any slot — hide the whole section rather than
    // rendering an empty grid.
    if (!lead && !note && secondary.length === 0) return null;

    return (
        <Section space="lg">
            <SectionHeading
                eyebrow={t.home.activitiesEyebrow}
                title={t.home.activitiesTitle}
                action={
                    <Link
                        href={`/${locale}/archive`}
                        className={buttonVariants({ variant: "outline" })}
                    >
                        {t.home.viewAllActivities}
                        <ArrowLeft aria-hidden="true" className="rotate-180" />
                    </Link>
                }
            />

            <div className="grid gap-5 lg:grid-cols-3">
                {lead && (
                    <Link
                        href={lead.href || `/${locale}/archive`}
                        className="group relative col-span-full overflow-hidden rounded-xl lg:col-span-2"
                    >
                        <div className="relative aspect-16/10 bg-ink-200 sm:aspect-16/9">
                            {lead.image_url && (
                                <Image
                                    src={lead.image_url}
                                    alt=""
                                    fill
                                    sizes="(min-width: 1024px) 66vw, 100vw"
                                    className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]"
                                />
                            )}
                        </div>

                        <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-transparent"
                        />

                        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                            {pick(locale, lead.category, lead.category_en) && (
                                <Badge tone="solid" size="sm">
                                    {pick(locale, lead.category, lead.category_en)}
                                </Badge>
                            )}

                            <h3 className="mt-4 max-w-xl text-xl text-white sm:text-2xl">
                                {pick(locale, lead.title, lead.title_en)}
                            </h3>

                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
                                {lead.event_date && (
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="size-4" aria-hidden="true" />
                                        <time dateTime={lead.event_date}>
                                            {formatDate(lead.event_date, locale)}
                                        </time>
                                    </span>
                                )}
                                {pick(locale, lead.location, lead.location_en) && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="size-4" aria-hidden="true" />
                                        {pick(locale, lead.location, lead.location_en)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                )}

                {note && (
                    <Card className="flex flex-col justify-between" padded="lg">
                        <div>
                            {pick(locale, note.category, note.category_en) && (
                                <Badge tone="danger" size="sm">
                                    <AlertTriangle aria-hidden="true" />
                                    {pick(locale, note.category, note.category_en)}
                                </Badge>
                            )}

                            <h3 className="mt-4 text-lg text-brand-800">
                                {pick(locale, note.title, note.title_en)}
                            </h3>

                            {pick(locale, note.excerpt, note.excerpt_en) && (
                                <p className="mt-3 text-sm text-ink-600">
                                    {pick(locale, note.excerpt, note.excerpt_en)}
                                </p>
                            )}
                        </div>

                        <Link
                            href={note.href || `/${locale}/archive`}
                            className="group mt-6 inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                        >
                            {pick(locale, note.action_label, note.action_label_en) ||
                                t.home.readMore}
                            <ChevronLeft
                                aria-hidden="true"
                                className="size-4 rotate-180 transition-transform duration-200 group-hover:translate-x-0.5"
                            />
                        </Link>
                    </Card>
                )}

                <Card
                    tone="brand"
                    elevation="flat"
                    padded="lg"
                    className="flex flex-col items-center justify-center text-center"
                >
                    <div className="flex size-14 items-center justify-center rounded-full bg-white/10">
                        <HeartHandshake className="size-7" aria-hidden="true" />
                    </div>

                    <h3 className="mt-5 text-xl text-white">{t.home.legalHelpTitle}</h3>

                    <p className="mt-2.5 text-sm text-brand-100">
                        {t.home.legalHelpBody}
                    </p>

                    <Link
                        href={`/${locale}/contact`}
                        className={buttonVariants({
                            variant: "onDark",
                            className: "mt-6",
                        })}
                    >
                        {t.home.legalHelpCta}
                    </Link>
                </Card>
            </div>

            {secondary.length > 0 && (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {secondary.map((item) => (
                        <li key={item.id}>
                            <Link
                                href={item.href || `/${locale}/archive`}
                                className="group flex gap-4 rounded-xl p-4 transition-ui hover:bg-surface-sunken"
                            >
                                <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-ink-200">
                                    {item.image_url && (
                                        <Image
                                            src={item.image_url}
                                            alt=""
                                            fill
                                            sizes="96px"
                                            className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
                                        />
                                    )}
                                </div>

                                <div className="min-w-0">
                                    {pick(locale, item.category, item.category_en) && (
                                        <span className="text-2xs font-semibold uppercase text-ochre-700">
                                            {pick(locale, item.category, item.category_en)}
                                        </span>
                                    )}

                                    <h3 className="mt-1.5 text-base text-brand-800">
                                        {pick(locale, item.title, item.title_en)}
                                    </h3>

                                    {item.event_date && (
                                        <time
                                            dateTime={item.event_date}
                                            className="mt-2 block text-xs text-ink-500"
                                        >
                                            {formatDate(item.event_date, locale)}
                                        </time>
                                    )}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Section>
    );
}
