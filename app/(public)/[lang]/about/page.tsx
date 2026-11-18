import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowRight,
    Gavel,
    Landmark,
    Megaphone,
    Newspaper,
    Users,
    type LucideIcon,
} from "lucide-react";

import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import {
    aboutPhotos,
    getAboutContent,
    type AboutContent,
    type AboutStatus,
    type PhotoId,
} from "@/lib/content/about";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    if (!isLocale(lang)) return {};

    const { meta } = getAboutContent(lang);
    return { title: meta.title, description: meta.description };
}

/** "01", "০১" — section numbers in the locale's own digits. */
function sectionNumber(locale: Locale, value: number) {
    return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB", {
        minimumIntegerDigits: 2,
    }).format(value);
}

/**
 * One photograph with its caption.
 *
 * Four of the five files are 9:4 panoramas and one is 3:2, so the ratio is
 * passed in rather than fixed — cropping a panorama to 3:2 throws away most of
 * the frame, which on a group photo means throwing away most of the people.
 */
function Figure({
    id,
    photo,
    ratio,
    sizes,
    priority = false,
    onDark = false,
}: {
    id: PhotoId;
    photo: AboutContent["photos"][PhotoId];
    ratio: string;
    sizes: string;
    priority?: boolean;
    onDark?: boolean;
}) {
    return (
        <figure>
            <div className={cn("relative overflow-hidden rounded-2xl shadow-md", ratio)}>
                <Image
                    src={aboutPhotos[id]}
                    alt={photo.alt}
                    fill
                    sizes={sizes}
                    priority={priority}
                    className="object-cover"
                />
            </div>
            <figcaption
                className={cn("mt-3 text-sm", onDark ? "text-brand-200" : "text-ink-500")}
            >
                {photo.caption}
            </figcaption>
        </figure>
    );
}

function StatusBadge({ status, labels }: { status?: AboutStatus; labels: AboutContent["status"] }) {
    if (!status) return null;
    return (
        <Badge tone={status === "won" ? "success" : "warning"} size="sm">
            {labels[status]}
        </Badge>
    );
}

/** One icon per achievement, in the document's order. */
const achievementIcons: LucideIcon[] = [Users, Megaphone, Landmark, Gavel, Newspaper];

const sectionIds = {
    journey: "journey",
    achievements: "achievements",
    demands: "demands",
    commitment: "commitment",
} as const;

export default async function AboutPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();

    const t = getAboutContent(lang);
    const parts = [
        { id: sectionIds.journey, label: t.journey.nav },
        { id: sectionIds.achievements, label: t.achievements.nav },
        { id: sectionIds.demands, label: t.demands.nav },
        { id: sectionIds.commitment, label: t.commitment.nav },
    ];
    const eyebrow = (index: number, label: string) =>
        `${sectionNumber(lang, index)} · ${label}`;

    return (
        <main>
            <PageHero
                eyebrow={t.hero.eyebrow}
                title={t.hero.title}
                description={t.hero.subtitle}
                media={
                    <span className="flex size-20 items-center justify-center rounded-2xl bg-surface shadow-md">
                        <Image
                            src="/logo (1).png"
                            alt=""
                            width={56}
                            height={56}
                            className="size-14 object-contain"
                        />
                    </span>
                }
            >
                {/* The page is long; these let a reader jump straight to the
                    demands, which is what most visitors come for. */}
                <nav aria-label={t.sectionsLabel}>
                    <ul className="flex flex-wrap justify-center gap-2">
                        {parts.map((part, index) => (
                            <li key={part.id}>
                                <a
                                    href={`#${part.id}`}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-200 bg-surface/80 px-4 text-sm font-medium text-brand-800 transition-ui hover:border-brand-400 hover:bg-surface"
                                >
                                    <span className="text-xs tabular-nums text-ochre-700">
                                        {sectionNumber(lang, index + 1)}
                                    </span>
                                    {part.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </PageHero>

            {/* 01 — The journey: the story beside its first photograph, then
                the dates from that story as a scannable timeline. */}
            <Section id={sectionIds.journey} space="md" followsHero className="scroll-mt-18">
                <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
                    <div>
                        <SectionHeading
                            eyebrow={eyebrow(1, t.journey.nav)}
                            title={t.journey.title}
                            className="mb-7 sm:mb-8"
                        />
                        <div className="space-y-5 text-base text-ink-600">
                            {t.journey.paragraphs.map((paragraph, index) => (
                                <p
                                    key={index}
                                    className={index === 0 ? "text-lg text-ink-700" : undefined}
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Sticky so the photo keeps the text company instead of
                        leaving a tall empty column beside the second paragraph. */}
                    <div className="lg:sticky lg:top-28">
                        <Figure
                            id="rally"
                            photo={t.photos.rally}
                            ratio="aspect-3/2"
                            sizes="(min-width: 1024px) 560px, 100vw"
                            priority
                        />
                    </div>
                </div>

                <div className="mt-12 sm:mt-14">
                    <h3 className="text-2xs font-semibold uppercase text-ink-500">
                        {t.journey.timelineLabel}
                    </h3>
                    <ol className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                        {t.journey.timeline.map((step) => (
                            <li key={step.when} className="border-l-2 border-ochre-400 pl-4">
                                <p className="font-display text-xl text-brand-800">
                                    {step.when}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-ink-600">
                                    {step.text}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </Section>

            {/* 02 — Achievements as cards; the two court cases carry their
                outcome as a badge so it reads at a glance. */}
            <Section
                id={sectionIds.achievements}
                tone="sunken"
                space="md"
                className="scroll-mt-18"
            >
                <SectionHeading
                    eyebrow={eyebrow(2, t.achievements.nav)}
                    title={t.achievements.title}
                    description={t.achievements.intro}
                />

                <ul className="grid gap-5 sm:grid-cols-2">
                    {t.achievements.items.map((item, index) => {
                        const Icon = achievementIcons[index] ?? Users;
                        return (
                            <li
                                key={item.label}
                                // Five cards in two columns: the last spans both
                                // rather than leaving half a row empty.
                                className="flex flex-col rounded-2xl border border-ink-200 bg-surface p-6 shadow-xs sm:last:odd:col-span-2"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                                        <Icon className="size-5" aria-hidden="true" />
                                    </span>
                                    <StatusBadge status={item.status} labels={t.status} />
                                </div>
                                <h3 className="mt-4 text-lg leading-snug text-brand-900">
                                    {item.label}
                                </h3>
                                <p className="mt-2 text-base text-ink-600">{item.text}</p>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                    <Figure
                        id="acidProtest"
                        photo={t.photos.acidProtest}
                        ratio="aspect-9/4"
                        sizes="(min-width: 640px) 50vw, 100vw"
                    />
                    <Figure
                        id="humanChain"
                        photo={t.photos.humanChain}
                        ratio="aspect-9/4"
                        sizes="(min-width: 640px) 50vw, 100vw"
                    />
                </div>
            </Section>

            {/* 03 — The 13 demands. CSS columns rather than a grid, so the
                numbers run down the first column and then the second instead
                of zig-zagging across. */}
            <Section id={sectionIds.demands} space="md" className="scroll-mt-18">
                <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-14">
                    <SectionHeading
                        eyebrow={eyebrow(3, t.demands.nav)}
                        title={t.demands.title}
                        description={t.demands.intro}
                        className="mb-0 sm:mb-0"
                    />
                    <Figure
                        id="roundtable"
                        photo={t.photos.roundtable}
                        ratio="aspect-9/4"
                        sizes="(min-width: 1024px) 480px, 100vw"
                    />
                </div>

                <ol className="mt-12 gap-x-12 md:columns-2">
                    {t.demands.items.map((item, index) => (
                        <li
                            key={item.label}
                            className="flex break-inside-avoid gap-4 border-t border-ink-200 py-5"
                        >
                            <span
                                aria-hidden="true"
                                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-800 font-display text-base text-white tabular-nums"
                            >
                                {new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-GB").format(
                                    index + 1
                                )}
                            </span>
                            <div className="min-w-0">
                                <h3 className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-lg leading-snug text-brand-900">
                                    {item.label}
                                    <StatusBadge status={item.status} labels={t.status} />
                                </h3>
                                <p className="mt-1.5 text-base text-ink-600">{item.text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </Section>

            {/* 04 — The commitment closes the page on the brand band, with the
                two places a reader can go next. */}
            <Section
                id={sectionIds.commitment}
                tone="brand"
                space="md"
                className="scroll-mt-18"
            >
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
                    <div>
                        <SectionHeading
                            eyebrow={eyebrow(4, t.commitment.nav)}
                            title={t.commitment.title}
                            onDark
                            className="mb-7 sm:mb-8"
                        />
                        <p className="text-lg text-brand-100">{t.commitment.body}</p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={`/${lang}/contact`}
                                className={buttonVariants({
                                    variant: "onDark",
                                    size: "lg",
                                    className: "gap-2",
                                })}
                            >
                                {t.commitment.contact}
                                <ArrowRight aria-hidden="true" />
                            </Link>
                            <Link
                                href={`/${lang}/news`}
                                className={buttonVariants({ variant: "outlineOnDark", size: "lg" })}
                            >
                                {t.commitment.mediaCenter}
                            </Link>
                        </div>
                    </div>

                    <Figure
                        id="seminar"
                        photo={t.photos.seminar}
                        ratio="aspect-9/4"
                        sizes="(min-width: 1024px) 540px, 100vw"
                        onDark
                    />
                </div>
            </Section>
        </main>
    );
}
