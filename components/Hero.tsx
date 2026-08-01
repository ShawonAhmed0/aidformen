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
        // items-end, not items-center: the panel sits low so the top of the
        // section is uninterrupted photo. Taller than before because the copy no
        // longer occupies the middle — the extra height is all image.
        <section className="relative flex min-h-[42rem] items-end overflow-hidden bg-brand-900 lg:min-h-[min(90dvh,48rem)]">
            <div className="absolute inset-0">
                {/* With no slides configured the brand background shows through
                    rather than the section collapsing entirely. Rendered at full
                    brightness — nothing is laid over the photo any more. */}
                <HeroSlider images={images} locale={locale} />

                {/* No scrim. Legibility is carried entirely by the frosted panel
                    the copy sits on, so the photo stays sharp and unmasked across
                    the whole section. */}
            </div>
            {/* From sm up the section's min-height wins and items-end does the
                positioning, so the top padding is only a floor. On phones the
                panel is tall enough that height becomes content-driven — there
                this padding *is* the band of photo above the card, which is why
                it is generous rather than tidy. */}
            <Container className="relative pb-14 pt-40 sm:pb-16">
                {/* The frosted panel is the only thing making this text legible,
                    so the tint is sized from the contrast maths rather than by
                    eye: at 70% over brand-950 a worst-case blown-out photo still
                    composites dark enough for white to clear 6:1. The blur is
                    what makes it read as glass; where backdrop-filter is
                    unsupported it degrades to the same flat tint, which is why
                    the tint alone has to carry the ratio. */}
                <div className="max-w-2xl rounded-3xl border border-white/15 bg-brand-950/70 p-7 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl sm:p-9">
                    {eyebrow && (
                        <p className="mb-4 text-2xs font-semibold uppercase text-brand-100">
                            {eyebrow}
                        </p>
                    )}

                    <h1 className="text-4xl text-white sm:text-5xl">{title}</h1>

                    {description && (
                        <p className="mt-5 text-lg text-brand-50 sm:text-xl">
                            {description}
                        </p>
                    )}

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <Link
                            href={localise(hero?.primary_cta_href, "/about")}
                            className={buttonVariants({ variant: "onDark", size: "lg" })}
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
    );
}
