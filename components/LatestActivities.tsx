import Link from "next/link";
import Image from "next/image";
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    ChevronRight,
    HeartHandshake,
    MapPin,
} from "lucide-react";

import { getActivities } from "@/lib/content/queries";
import { localizeHref, pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Activity } from "@/lib/types/content";
import { cn } from "@/lib/utils";
import { Section } from "./ui/section";
import { SectionHeading } from "./ui/section-heading";
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

    const leadCategory = lead && pick(locale, lead.category, lead.category_en);
    const leadLocation = lead && pick(locale, lead.location, lead.location_en);
    const noteCategory = note && pick(locale, note.category, note.category_en);
    const noteExcerpt = note && pick(locale, note.excerpt, note.excerpt_en);

    return (
        <Section space="md">
            <SectionHeading
                eyebrow={t.home.activitiesEyebrow}
                title={t.home.activitiesTitle}
                action={
                    <Link
                        href={`/${locale}/news`}
                        className={buttonVariants({ variant: "outline", className: "gap-2" })}
                    >
                        {t.home.viewAllActivities}
                        <ArrowRight aria-hidden="true" />
                    </Link>
                }
            />

            {/* Feature on the left, the advisory and the legal-help prompt
                stacked on the right at the same height. The prompt used to
                wrap onto a row of its own and leave two thirds of it empty. */}
            <div className="grid gap-5 lg:grid-cols-3">
                {lead && (
                    <Link
                        href={localizeHref(locale, lead.href, "/news")}
                        className="group relative block aspect-4/3 overflow-hidden rounded-2xl bg-ink-200 shadow-sm sm:aspect-16/9 lg:col-span-2 lg:aspect-auto lg:min-h-[28rem]"
                    >
                        {lead.image_url && (
                            <Image
                                src={lead.image_url}
                                alt=""
                                fill
                                sizes="(min-width: 1024px) 66vw, 100vw"
                                className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]"
                            />
                        )}

                        <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/35 to-transparent"
                        />

                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                            {leadCategory && (
                                <Badge tone="solid" size="sm">
                                    {leadCategory}
                                </Badge>
                            )}

                            <h3 className="mt-3 line-clamp-3 max-w-2xl text-xl leading-snug text-white sm:mt-4 sm:text-2xl lg:text-3xl">
                                {pick(locale, lead.title, lead.title_en)}
                            </h3>

                            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/85 sm:mt-4">
                                {lead.event_date && (
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="size-4" aria-hidden="true" />
                                        <time dateTime={lead.event_date}>
                                            {formatDate(lead.event_date, locale)}
                                        </time>
                                    </span>
                                )}
                                {leadLocation && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="size-4" aria-hidden="true" />
                                        {leadLocation}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                )}

                <div
                    className={cn(
                        // Side by side on tablets, stacked beside the feature
                        // on laptops; without a feature they share the row.
                        "grid gap-5",
                        note && "sm:grid-cols-2",
                        lead ? "lg:flex lg:flex-col" : "lg:col-span-3",
                    )}
                >
                    {note && (
                        <article className="flex flex-1 flex-col rounded-2xl border border-ink-200 bg-surface p-6 shadow-xs">
                            {noteCategory && (
                                <Badge tone="danger" size="sm" className="self-start">
                                    <AlertTriangle aria-hidden="true" />
                                    {noteCategory}
                                </Badge>
                            )}

                            <h3 className="mt-4 text-lg leading-snug text-brand-800">
                                {pick(locale, note.title, note.title_en)}
                            </h3>

                            {noteExcerpt && (
                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-600">
                                    {noteExcerpt}
                                </p>
                            )}

                            <Link
                                href={localizeHref(locale, note.href, "/news")}
                                className="group -ms-2 mt-auto inline-flex h-11 items-center gap-1 self-start rounded-lg px-2 pt-1 text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                            >
                                {pick(locale, note.action_label, note.action_label_en) ||
                                    t.home.readMore}
                                <ChevronRight
                                    aria-hidden="true"
                                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                />
                            </Link>
                        </article>
                    )}

                    <div
                        className={cn(
                            "relative flex flex-col overflow-hidden rounded-2xl bg-brand-800 p-6 text-brand-50 shadow-sm",
                            !note && "flex-1 justify-center",
                        )}
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-12 -bottom-16 size-48 rounded-full bg-white/5"
                        />

                        <div className="relative flex items-center gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                                <HeartHandshake className="size-5" aria-hidden="true" />
                            </span>
                            <h3 className="text-lg leading-snug text-white">
                                {t.home.legalHelpTitle}
                            </h3>
                        </div>

                        <p className="relative mt-3 text-sm leading-6 text-brand-100">
                            {t.home.legalHelpBody}
                        </p>

                        <Link
                            href={`/${locale}/contact`}
                            className={buttonVariants({
                                variant: "onDark",
                                className: "relative mt-5 gap-2 self-start",
                            })}
                        >
                            {t.home.legalHelpCta}
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>

            {secondary.length > 0 && (
                // Two columns of equal cards; an odd last card spans both so
                // the grid never ends on a half-empty row.
                <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                    {secondary.map((item) => {
                        const category = pick(locale, item.category, item.category_en);

                        return (
                            <li key={item.id} className="sm:last:odd:col-span-2">
                                <Link
                                    href={localizeHref(locale, item.href, "/news")}
                                    className="group flex h-full items-center gap-4 rounded-2xl border border-ink-200 bg-surface p-3 pe-5 shadow-xs transition-ui hover:border-ink-300 hover:shadow-md"
                                >
                                    <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-ink-200 sm:size-28">
                                        {item.image_url && (
                                            <Image
                                                src={item.image_url}
                                                alt=""
                                                fill
                                                sizes="112px"
                                                className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        {category && (
                                            <span className="text-2xs font-semibold uppercase text-ochre-700">
                                                {category}
                                            </span>
                                        )}

                                        <h3 className="mt-1 line-clamp-2 text-base leading-snug text-brand-800 transition-ui group-hover:text-brand-700">
                                            {pick(locale, item.title, item.title_en)}
                                        </h3>

                                        {item.event_date && (
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                                                <Calendar className="size-3.5" aria-hidden="true" />
                                                <time dateTime={item.event_date}>
                                                    {formatDate(item.event_date, locale)}
                                                </time>
                                            </p>
                                        )}
                                    </div>

                                    <ArrowRight
                                        aria-hidden="true"
                                        className="hidden size-4 shrink-0 text-ink-400 transition-ui group-hover:translate-x-0.5 group-hover:text-brand-700 sm:block"
                                    />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Section>
    );
}
