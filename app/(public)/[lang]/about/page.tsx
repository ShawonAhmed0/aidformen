import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { isLocale } from "@/lib/i18n/config";
import { aboutPhotos, getAboutContent, type PhotoId } from "./content";

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
 * Four of the five files are ~9:4 panoramas and one is 3:2, so the ratio is
 * passed in rather than fixed — cropping a panorama to 3:2 throws away most of
 * the frame, which on a group photo means throwing away most of the people.
 */
function Figure({
    id,
    alt,
    caption,
    ratio,
    priority = false,
}: {
    id: PhotoId;
    alt: string;
    caption: string;
    ratio: string;
    priority?: boolean;
}) {
    return (
        <figure>
            <div
                className={`relative overflow-hidden rounded-2xl shadow-md ${ratio}`}
            >
                <Image
                    src={aboutPhotos[id]}
                    alt={alt}
                    fill
                    sizes="(min-width: 768px) 704px, 100vw"
                    priority={priority}
                    className="object-cover"
                />
            </div>

            <figcaption className="mt-3 text-sm text-ink-500">
                {caption}
            </figcaption>
        </figure>
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
            />

            {/* One reading column for the whole page: heading, prose, photograph,
                repeat. Nothing here is a card, a stat or a callout — the copy is
                the design. */}
            <Section space="lg" containerWidth="prose">
                <div className="space-y-12 sm:space-y-16">
                    <Figure
                        id="rally"
                        alt={t.photos.rally.alt}
                        caption={t.photos.rally.caption}
                        ratio="aspect-3/2"
                        priority
                    />

                    <div className="space-y-5 text-base text-ink-600">
                        {t.intro.map((paragraph, index) => (
                            <p
                                key={index}
                                // The opening paragraph carries the argument, so it
                                // gets the weight of a standfirst.
                                className={index === 0 ? "text-lg text-ink-700" : undefined}
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <Figure
                        id="acidProtest"
                        alt={t.photos.acidProtest.alt}
                        caption={t.photos.acidProtest.caption}
                        ratio="aspect-9/4"
                    />

                    <section>
                        <SectionHeading
                            as="h2"
                            title={t.history.title}
                            className="mb-7"
                        />

                        <dl className="space-y-6">
                            {t.history.items.map((item) => (
                                <div
                                    key={item.term}
                                    className="border-l-2 border-ochre-300 pl-5"
                                >
                                    <dt className="font-display text-lg font-semibold text-brand-800">
                                        {item.term}
                                    </dt>

                                    <dd className="mt-1.5 text-base text-ink-600">
                                        {item.detail}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <Figure
                        id="humanChain"
                        alt={t.photos.humanChain.alt}
                        caption={t.photos.humanChain.caption}
                        ratio="aspect-9/4"
                    />

                    <section>
                        <SectionHeading
                            as="h2"
                            title={t.inception.title}
                            className="mb-7"
                        />

                        <div className="space-y-5 text-base text-ink-600">
                            {t.inception.paragraphs.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </section>

                    <Figure
                        id="roundtable"
                        alt={t.photos.roundtable.alt}
                        caption={t.photos.roundtable.caption}
                        ratio="aspect-9/4"
                    />

                    <section>
                        <SectionHeading
                            as="h2"
                            title={t.mission.title}
                            className="mb-7"
                        />

                        <p className="text-base text-ink-600">{t.mission.intro}</p>

                        <ul className="mt-6 space-y-3.5">
                            {t.mission.points.map((point) => (
                                <li
                                    key={point}
                                    className="flex gap-3.5 text-base text-ink-600"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ochre-600"
                                    />

                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <Figure
                        id="seminar"
                        alt={t.photos.seminar.alt}
                        caption={t.photos.seminar.caption}
                        ratio="aspect-9/4"
                    />

                    <p className="border-t border-ink-200 pt-8 font-display text-xl text-balance text-brand-800 sm:text-2xl">
                        {t.closing}
                    </p>
                </div>
            </Section>
        </main>
    );
}
