import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { ContentsNav } from "@/components/ContentsNav";
import { HomeAboutAudioPlayer } from "@/components/HomeAboutAudioPlayer";
import { PageHero } from "@/components/PageHero";
import { buttonVariants } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import {
    aboutPhotos,
    getAboutContent,
    type AboutContent,
    type PhotoId,
} from "@/lib/content/about";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * The narrated version of this page, one recording per language. Null until
 * the recordings are supplied; the player then shows its "coming soon" state
 * instead of a control that cannot play.
 */
const aboutPageVoiceOver: Record<Locale, string | null> = {
    bn: null,
    en: null,
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

/**
 * One photograph in the article flow.
 *
 * Four of the five files are 9:4 panoramas and one is 3:2, so the ratio is
 * passed in rather than fixed — cropping a panorama to 3:2 throws away most of
 * the frame, which on a group photo means throwing away most of the people.
 */
function Figure({
    id,
    photo,
    ratio,
    priority = false,
}: {
    id: PhotoId;
    photo: AboutContent["photos"][PhotoId];
    ratio: string;
    priority?: boolean;
}) {
    return (
        <figure>
            <div className={cn("relative overflow-hidden rounded-2xl shadow-md", ratio)}>
                <Image
                    src={aboutPhotos[id]}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 768px, 100vw"
                    priority={priority}
                    className="object-cover"
                />
            </div>
            <figcaption className="mt-3 text-sm text-ink-500">{photo.caption}</figcaption>
        </figure>
    );
}

/** Section heading in the home essay's style, with the brand's ochre rule. */
function PartHeading({ id, title }: { id: string; title: string }) {
    return (
        <>
            <h2 id={id} className="text-2xl leading-snug text-brand-900 sm:text-3xl">
                {title}
            </h2>
            <div aria-hidden="true" className="mt-4 h-1 w-14 rounded-full bg-ochre-600" />
        </>
    );
}

const prose = "mt-5 text-base leading-8 text-ink-700";

/** Bold label, then the text — the document's "Label: text" lines. */
function LabelledList({
    items,
    numbered = false,
    locale,
}: {
    items: { label: string; text: string }[];
    numbered?: boolean;
    locale: Locale;
}) {
    const List = numbered ? "ol" : "ul";
    const number = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB");

    return (
        <List className="mt-5 space-y-4">
            {items.map((item, index) => (
                <li
                    key={item.label}
                    className={cn(
                        "relative text-base leading-8 text-ink-700",
                        numbered ? "ps-9" : "ps-5"
                    )}
                >
                    {numbered ? (
                        <span
                            aria-hidden="true"
                            className="absolute start-0 top-0 font-display font-semibold text-brand-700 tabular-nums"
                        >
                            {number.format(index + 1)}.
                        </span>
                    ) : (
                        <span
                            aria-hidden="true"
                            className="absolute start-0 top-[13px] size-1.5 rounded-full bg-ochre-400"
                        />
                    )}
                    <strong className="font-semibold text-ink-900">{item.label}:</strong>{" "}
                    {item.text}
                </li>
            ))}
        </List>
    );
}

export default async function AboutPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) notFound();

    const t = getAboutContent(lang);
    const ids = {
        journey: "journey",
        achievements: "achievements",
        demands: "demands",
        commitment: "commitment",
    } as const;
    const contents = [
        { id: ids.journey, title: t.journey.nav },
        { id: ids.achievements, title: t.achievements.nav },
        { id: ids.demands, title: t.demands.nav },
        { id: ids.commitment, title: t.commitment.nav },
    ];

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
            />

            {/* The home page's essay layout: a sticky contents list beside one
                reading column of prose, with the photographs set between the
                parts rather than boxed into cards. */}
            <Section space="md" followsHero>
                <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
                    <div className="hidden lg:block">
                        <ContentsNav
                            label={t.contentsLabel}
                            items={contents}
                            className="sticky top-24"
                        />
                    </div>

                    <article className="min-w-0 max-w-3xl">
                        <HomeAboutAudioPlayer src={aboutPageVoiceOver[lang]} locale={lang} />

                        {/* Phones have no sidebar, so the contents sit under the
                            player; the active highlight still follows along. */}
                        <ContentsNav
                            label={t.contentsLabel}
                            items={contents}
                            className="mt-6 rounded-2xl border border-ink-200 bg-surface p-5 lg:hidden"
                        />

                        <div className="mt-10 space-y-12 sm:space-y-14">
                            <Figure id="rally" photo={t.photos.rally} ratio="aspect-3/2" priority />

                            <section aria-labelledby={ids.journey}>
                                <PartHeading id={ids.journey} title={t.journey.title} />
                                {t.journey.paragraphs.map((paragraph, index) => (
                                    <p
                                        key={index}
                                        // The opening paragraph carries the argument, so
                                        // it gets the weight of a standfirst.
                                        className={cn(prose, index === 0 && "text-lg text-ink-800")}
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </section>

                            <Figure id="acidProtest" photo={t.photos.acidProtest} ratio="aspect-9/4" />

                            <section aria-labelledby={ids.achievements}>
                                <PartHeading id={ids.achievements} title={t.achievements.title} />
                                <p className={prose}>{t.achievements.intro}</p>
                                <LabelledList items={t.achievements.items} locale={lang} />
                            </section>

                            <Figure id="humanChain" photo={t.photos.humanChain} ratio="aspect-9/4" />

                            <section aria-labelledby={ids.demands}>
                                <PartHeading id={ids.demands} title={t.demands.title} />
                                <p className={prose}>{t.demands.intro}</p>
                                <LabelledList items={t.demands.items} numbered locale={lang} />
                            </section>

                            <Figure id="roundtable" photo={t.photos.roundtable} ratio="aspect-9/4" />

                            <section aria-labelledby={ids.commitment}>
                                <PartHeading id={ids.commitment} title={t.commitment.title} />
                                <p className={cn(prose, "text-lg text-ink-800")}>
                                    {t.commitment.body}
                                </p>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href={`/${lang}/contact`}
                                        className={buttonVariants({ className: "gap-2" })}
                                    >
                                        {t.commitment.contact}
                                        <ArrowRight aria-hidden="true" />
                                    </Link>
                                    <Link
                                        href={`/${lang}/news`}
                                        className={buttonVariants({ variant: "outline" })}
                                    >
                                        {t.commitment.mediaCenter}
                                    </Link>
                                </div>
                            </section>

                            <Figure id="seminar" photo={t.photos.seminar} ratio="aspect-9/4" />
                        </div>
                    </article>
                </div>
            </Section>
        </main>
    );
}
