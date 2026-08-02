import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowRight,
    Flag,
    Handshake,
    Languages,
    Mail,
    Megaphone,
    Quote,
    Scale,
    ShieldCheck,
    Stamp,
    Users,
    type LucideIcon,
} from "lucide-react";

import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { isLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import {
    aboutPhotos,
    getAboutContent,
    type MilestoneId,
    type ObjectiveId,
} from "./content";

/** Icons live here rather than in content.ts so the copy stays serialisable. */
const milestoneIcons: Record<MilestoneId, LucideIcon> = {
    language: Languages,
    liberation: Flag,
    democracy: Users,
    uprising: Megaphone,
};

const objectiveIcons: Record<ObjectiveId, LucideIcon> = {
    legal: Scale,
    litigation: ShieldCheck,
    equity: Handshake,
    awareness: Megaphone,
};

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

export default async function AboutPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();

    const t = getAboutContent(lang);

    return (
        <main>
            <PageHero
                eyebrow={t.hero.eyebrow}
                title={t.hero.title}
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
                description={<p>{t.hero.description}</p>}
            >
                {/* The three facts a visitor most often wants to verify about a
                    foundation, answered before they scroll. */}
                <dl className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
                    {t.hero.facts.map((fact) => (
                        <div
                            key={fact.label}
                            className="rounded-xl border border-brand-100 bg-surface/70 px-5 py-4 text-center backdrop-blur-sm"
                        >
                            <dt className="text-2xs font-semibold uppercase text-ochre-700">
                                {fact.label}
                            </dt>
                            <dd
                                className="mt-1.5 font-display text-lg font-semibold text-brand-800"
                                data-numeric
                            >
                                {fact.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </PageHero>

            {/* Background & reality */}
            <Section space="lg">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <SectionHeading
                            eyebrow={t.background.eyebrow}
                            title={t.background.title}
                            className="mb-7"
                        />

                        <div className="space-y-5 text-base text-ink-600">
                            {t.background.paragraphs.map((paragraph, index) => (
                                <p
                                    key={index}
                                    className={cn(
                                        // The opening paragraph carries the argument;
                                        // give it the weight of a standfirst.
                                        index === 0 && "text-lg text-ink-700"
                                    )}
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </div>

                    <figure className="relative">
                        {/* Offset accent block — the only decorative shape on the
                            page, kept inside the container gutter so it can never
                            push a horizontal scrollbar. It sits behind the photo by
                            paint order (both are positioned, this one comes first),
                            not by a negative z-index, which would drop it behind the
                            section background entirely. */}
                        <div
                            aria-hidden="true"
                            className="absolute -right-3 -top-3 size-32 rounded-2xl bg-ochre-100 sm:-right-5 sm:-top-5"
                        />

                        <div className="relative aspect-3/2 overflow-hidden rounded-2xl shadow-lg">
                            <Image
                                src={aboutPhotos.rally}
                                alt={t.photos.rally.alt}
                                fill
                                sizes="(min-width: 1024px) 48vw, 100vw"
                                priority
                                className="object-cover"
                            />
                        </div>

                        <figcaption className="mt-4 text-sm text-ink-500">
                            {t.photos.rally.caption}
                        </figcaption>
                    </figure>
                </div>
            </Section>

            {/* Historical record */}
            <Section tone="sunken" space="lg">
                <SectionHeading
                    align="center"
                    eyebrow={t.history.eyebrow}
                    title={t.history.title}
                    description={t.history.description}
                />

                <ol className="mx-auto max-w-4xl">
                    {t.history.milestones.map((milestone, index) => {
                        const Icon = milestoneIcons[milestone.id];
                        const isLast = index === t.history.milestones.length - 1;

                        return (
                            <li
                                key={milestone.id}
                                className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-7"
                            >
                                {/* Rail: marker, then a line that stretches to the
                                    next marker. Flexbox does the measuring, so the
                                    rail never needs a hard-coded height. */}
                                <div className="flex flex-col items-center">
                                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-ochre-200 bg-ochre-50 text-ochre-700">
                                        <Icon className="size-5" aria-hidden="true" />
                                    </span>

                                    {!isLast && (
                                        <span
                                            aria-hidden="true"
                                            className="mt-2 w-px flex-1 bg-ink-300"
                                        />
                                    )}
                                </div>

                                <div className={cn(!isLast && "pb-6 sm:pb-8")}>
                                    <Card padded="lg" elevation="sm">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                                            <div className="min-w-0">
                                                <Badge tone="accent" size="sm">
                                                    {milestone.period}
                                                </Badge>

                                                <h3 className="mt-3 text-xl text-brand-800">
                                                    {milestone.title}
                                                </h3>
                                            </div>

                                            <div className="shrink-0 sm:max-w-52 sm:text-right">
                                                <p
                                                    className="font-display text-3xl font-semibold text-ochre-700"
                                                    data-numeric
                                                >
                                                    {milestone.stat}
                                                </p>

                                                <p className="mt-1 text-xs text-ink-500">
                                                    {milestone.statLabel}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-5 text-base text-ink-600">
                                            {milestone.body}
                                        </p>
                                    </Card>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </Section>

            {/* Pull quote over a full-bleed photograph */}
            <section className="relative isolate overflow-hidden bg-brand-950">
                <Image
                    src={aboutPhotos.humanChain}
                    alt={t.photos.humanChain.alt}
                    fill
                    sizes="100vw"
                    className="object-cover opacity-45"
                />

                {/* The quote sits on the left, so the scrim is heaviest there and
                    lets the photograph breathe on the right. */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/85 to-brand-950/45"
                />

                <Container className="relative py-20 sm:py-24 lg:py-28">
                    <figure className="max-w-2xl">
                        <Quote
                            aria-hidden="true"
                            className="size-9 text-ochre-300"
                        />

                        <blockquote className="mt-5 font-display text-3xl font-semibold text-balance text-white sm:text-4xl">
                            {t.quote.text}
                        </blockquote>

                        <figcaption className="mt-6 text-sm text-brand-100">
                            {t.quote.source}
                        </figcaption>
                    </figure>
                </Container>
            </section>

            {/* Legal void & inception */}
            <Section space="lg">
                <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <SectionHeading
                            eyebrow={t.inception.eyebrow}
                            title={t.inception.title}
                            className="mb-7"
                        />

                        <div className="space-y-5 text-base text-ink-600">
                            {t.inception.paragraphs.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>

                        <Card tone="sunken" padded="lg" className="mt-8">
                            <h3 className="font-sans text-2xs font-semibold uppercase text-ochre-700">
                                {t.inception.void.title}
                            </h3>

                            <dl className="mt-5 space-y-5">
                                {[
                                    {
                                        ...t.inception.void.women,
                                        rule: "border-brand-400",
                                        tone: "text-brand-800",
                                    },
                                    {
                                        ...t.inception.void.men,
                                        rule: "border-ochre-500",
                                        tone: "text-ochre-800",
                                    },
                                ].map((row) => (
                                    <div
                                        key={row.label}
                                        className={cn("border-l-2 pl-4", row.rule)}
                                    >
                                        <dt
                                            className={cn(
                                                "text-sm font-semibold",
                                                row.tone
                                            )}
                                        >
                                            {row.label}
                                        </dt>

                                        <dd className="mt-1 text-base text-ink-600">
                                            {row.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <figure>
                            <div className="relative aspect-9/4 overflow-hidden rounded-2xl shadow-md">
                                <Image
                                    src={aboutPhotos.roundtable}
                                    alt={t.photos.roundtable.alt}
                                    fill
                                    sizes="(min-width: 1024px) 48vw, 100vw"
                                    className="object-cover"
                                />
                            </div>

                            <figcaption className="mt-4 text-sm text-ink-500">
                                {t.photos.roundtable.caption}
                            </figcaption>
                        </figure>

                        <Card tone="brand" elevation="md" padded="lg">
                            <div className="flex items-center gap-3">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-100">
                                    <Stamp className="size-5" aria-hidden="true" />
                                </span>

                                <h3 className="text-lg text-white">
                                    {t.inception.credential.title}
                                </h3>
                            </div>

                            <dl className="mt-6 space-y-4">
                                {t.inception.credential.rows.map((row) => (
                                    <div
                                        key={row.label}
                                        className="border-t border-white/15 pt-4 first:border-0 first:pt-0"
                                    >
                                        <dt className="text-2xs font-semibold uppercase text-brand-200">
                                            {row.label}
                                        </dt>

                                        <dd
                                            className="mt-1 text-base text-white"
                                            data-numeric
                                        >
                                            {row.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </Card>
                    </div>
                </div>
            </Section>

            {/* Mission & objectives */}
            <Section tone="sunken" space="lg">
                <SectionHeading
                    align="center"
                    eyebrow={t.mission.eyebrow}
                    title={t.mission.title}
                    description={t.mission.description}
                />

                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {t.mission.objectives.map((objective) => {
                        const Icon = objectiveIcons[objective.id];

                        return (
                            <li key={objective.id}>
                                <Card padded="lg" className="h-full">
                                    <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                                        <Icon
                                            className="size-6"
                                            aria-hidden="true"
                                        />
                                    </span>

                                    <h3 className="mt-5 text-xl text-brand-800">
                                        {objective.title}
                                    </h3>

                                    <p className="mt-2.5 text-base text-ink-600">
                                        {objective.body}
                                    </p>
                                </Card>
                            </li>
                        );
                    })}
                </ul>
            </Section>

            {/* On the ground */}
            <Section space="lg">
                <SectionHeading
                    align="center"
                    eyebrow={t.gallery.eyebrow}
                    title={t.gallery.title}
                    description={t.gallery.description}
                />

                <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                    {(["seminar", "acidProtest"] as const).map((id) => (
                        <figure key={id}>
                            <div className="relative aspect-9/4 overflow-hidden rounded-2xl shadow-md">
                                <Image
                                    src={aboutPhotos[id]}
                                    alt={t.photos[id].alt}
                                    fill
                                    sizes="(min-width: 768px) 48vw, 100vw"
                                    className="object-cover"
                                />
                            </div>

                            <figcaption className="mt-4 text-sm text-ink-500">
                                {t.photos[id].caption}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </Section>

            {/* CTA */}
            <section className="bg-brand-800 py-16 text-white sm:py-20">
                <Container width="prose" className="text-center">
                    <h2 className="text-3xl text-white sm:text-4xl">
                        {t.cta.title}
                    </h2>

                    <p className="mx-auto mt-4 max-w-lg text-lg text-brand-100">
                        {t.cta.body}
                    </p>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href={`/${lang}/register`}
                            className={buttonVariants({
                                variant: "onDark",
                                size: "lg",
                            })}
                        >
                            {t.cta.primary}
                            <ArrowRight aria-hidden="true" />
                        </Link>

                        <Link
                            href={`/${lang}/contact`}
                            className={buttonVariants({
                                variant: "outlineOnDark",
                                size: "lg",
                            })}
                        >
                            <Mail aria-hidden="true" />
                            {t.cta.secondary}
                        </Link>
                    </div>
                </Container>
            </section>
        </main>
    );
}
