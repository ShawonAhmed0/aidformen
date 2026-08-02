import Link from "next/link";
import { CircleHelp, HandHeart } from "lucide-react";

import { getCarouselImages, getHeroContent } from "@/lib/content/queries";
import { pick, type Locale } from "@/lib/i18n/config";
import HeroSlider from "@/components/HeroSlider";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";

export default async function Hero({ locale }: { locale: Locale }) {
    const [images, hero] = await Promise.all([
        getCarouselImages(),
        getHeroContent(),
    ]);

    // Defaults keep the section presentable before any content is entered, and
    // if the database is briefly unreachable.
    const title =
        pick(locale, hero?.title, hero?.title_en) ||
        (locale === "en" ? "Aid For Men Foundation" : "এইড ফর মেন ফাউন্ডেশন");
    const eyebrow = pick(locale, hero?.eyebrow, hero?.eyebrow_en);
    const description = pick(locale, hero?.description, hero?.description_en);

    const primaryLabel =
        pick(locale, hero?.primary_cta_label, hero?.primary_cta_label_en) ||
        (locale === "en" ? "Learn about us" : "আমাদের সম্পর্কে জানুন");
    const secondaryLabel =
        pick(locale, hero?.secondary_cta_label, hero?.secondary_cta_label_en) ||
        (locale === "en" ? "Join as a volunteer" : "স্বেচ্ছাসেবী হিসেবে যোগ দিন");

    // Stored links are locale-agnostic paths like /about; prefix them here.
    const localise = (href: string | null | undefined, fallback: string) => {
        const value = href?.trim() || fallback;
        return value.startsWith("/") ? `/${locale}${value}` : value;
    };

    return (
        // Two siblings, not one section. The panel has to straddle the photo's
        // bottom edge, and the photo section's overflow-hidden is load-bearing —
        // it clips HeroSlider's 1.04 → 1 zoom, which would otherwise bleed over
        // the sections below. Anything inside it gets clipped with the image, so
        // the panel lives outside and is pulled up over the seam instead.
        <>
            {/* On a phone the section is shaped by the photo (~3:2) instead of a
                fixed height. A tall box would scale a landscape shot to fill it
                and show only the middle third — the slide has to fit the screen
                width, not be cropped to it. From sm up there is room for a
                proper hero, so height leads and the photo covers. */}
            <section className="relative aspect-3/2 overflow-hidden bg-brand-900 sm:aspect-auto sm:min-h-[42rem] lg:min-h-[min(90dvh,48rem)]">
                {/* With no slides configured the brand background shows through
                    rather than the section collapsing entirely. Rendered at full
                    brightness — nothing is laid over the photo any more. */}
                <HeroSlider images={images} locale={locale} />

                {/* No scrim. Legibility is carried entirely by the frosted panel
                    below, so the photo stays sharp and unmasked throughout. */}
            </section>

            {/* Full container width, overlapping the photo's bottom edge — the
                position the announcement card used to hold. The overlap is
                shallower on a phone: the same 56px bite out of a 250px photo
                would cover a fifth of it. */}
            <section className="relative z-20 -mt-6 sm:-mt-14">
                <Container>
                    {/* The frosted panel is the only thing making this text
                        legible, so the tint is sized from the contrast maths
                        rather than by eye: at 70% over brand-950 a worst-case
                        blown-out photo still composites dark enough for white to
                        clear 5.65:1. The blur is what makes it read as glass;
                        where backdrop-filter is unsupported it degrades to the
                        same flat tint, which is why the tint alone has to carry
                        the ratio. */}
                    {/* Tighter on a phone: the photo above it is only ~250px
                        tall now, so a panel at desktop proportions would dwarf
                        the image it is supposed to sit on. */}
                    <div className="rounded-2xl border border-white/15 bg-brand-950/70 p-5 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-8">
                        {eyebrow && (
                            <p className="mb-3 text-2xs font-semibold uppercase text-brand-100 sm:mb-4">
                                {eyebrow}
                            </p>
                        )}

                        <h1 className="text-2xl text-white sm:text-5xl">{title}</h1>

                        {description && (
                            <p className="mt-3 max-w-3xl text-base text-brand-50 sm:mt-5 sm:text-xl">
                                {description}
                            </p>
                        )}

                        <div className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                            <Link
                                href={localise(hero?.primary_cta_href, "/about")}
                                className={buttonVariants({
                                    variant: "onDark",
                                    size: "lg",
                                })}
                            >
                                <CircleHelp aria-hidden="true" />
                                {primaryLabel}
                            </Link>

                            <Link
                                href={localise(hero?.secondary_cta_href, "/register")}
                                className={buttonVariants({
                                    variant: "outlineOnDark",
                                    size: "lg",
                                })}
                            >
                                <HandHeart aria-hidden="true" />
                                {secondaryLabel}
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>
        </>
    );
}
