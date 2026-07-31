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
        <section className="relative flex min-h-[38rem] items-center overflow-hidden bg-brand-900 lg:min-h-[min(85dvh,44rem)]">
            <div className="absolute inset-0">
                {/* With no slides configured the brand background shows through
                    rather than the section collapsing entirely. */}
                <HeroSlider images={images} locale={locale} />

                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-r from-brand-950/92 via-brand-950/70 to-brand-950/25"
                />
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-950/50 to-transparent"
                />
            </div>

            <Container className="relative py-20 sm:py-24">
                <div className="max-w-2xl">
                    {eyebrow && (
                        <p className="mb-4 text-2xs font-semibold uppercase text-brand-200">
                            {eyebrow}
                        </p>
                    )}

                    <h1 className="text-4xl text-white sm:text-5xl">{title}</h1>

                    {description && (
                        <p className="mt-6 text-lg text-brand-50/85 sm:text-xl">
                            {description}
                        </p>
                    )}

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
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
