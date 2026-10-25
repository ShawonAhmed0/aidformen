import Link from "next/link";
import { Building2, ChevronRight, UserRoundPlus } from "lucide-react";

import HeroSlider from "@/components/HeroSlider";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getCarouselImages, getHeroContent } from "@/lib/content/queries";
import { localizeHref, pick, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type HeroCopyProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  mobile?: boolean;
};

function HeroCopy({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  mobile = false,
}: HeroCopyProps) {
  return (
    <div
      className={cn(
        "border-white/15 bg-brand-950/78 text-white shadow-2xl ring-1 ring-white/5 backdrop-blur-xl",
        mobile
          ? "rounded-2xl p-5"
          : "max-w-2xl rounded-2xl p-7 lg:w-[56%] lg:max-w-none",
      )}
    >
      {eyebrow && (
        <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-brand-100">
          {eyebrow}
        </p>
      )}

      <h1 className={cn("text-white", mobile ? "text-2xl" : "text-4xl xl:text-5xl")}>
        {title}
      </h1>

      {description && (
        <p
          className={cn(
            "mt-3 max-w-2xl text-brand-50",
            mobile ? "text-sm leading-6" : "line-clamp-2 text-base leading-7 xl:text-lg",
          )}
        >
          {description}
        </p>
      )}

      <div className={cn("grid gap-3", mobile ? "mt-5" : "mt-6 sm:grid-cols-2")}>
        <Link
          href={primaryHref}
          className={buttonVariants({
            variant: "onDark",
            size: "md",
            className:
              "h-auto min-h-12 w-full justify-between whitespace-normal rounded-xl border border-white/90 bg-white px-4 py-2.5 text-left font-semibold shadow-lg hover:-translate-y-0.5 hover:bg-white",
          })}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Building2 className="size-5 shrink-0 text-brand-700" aria-hidden="true" />
            <span className="leading-snug">{primaryLabel}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-brand-700" aria-hidden="true" />
        </Link>

        <Link
          href={secondaryHref}
          className={buttonVariants({
            variant: "outlineOnDark",
            size: "md",
            className:
              "h-auto min-h-12 w-full justify-between whitespace-normal rounded-xl border-brand-200/50 bg-brand-700/90 px-4 py-2.5 text-left font-semibold shadow-lg hover:-translate-y-0.5 hover:bg-brand-700",
          })}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <UserRoundPlus className="size-5 shrink-0 text-brand-100" aria-hidden="true" />
            <span className="leading-snug">{secondaryLabel}</span>
          </span>
          <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export default async function Hero({ locale }: { locale: Locale }) {
  const [images, hero] = await Promise.all([
    getCarouselImages(),
    getHeroContent(),
  ]);

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

  const copyProps: HeroCopyProps = {
    eyebrow,
    title,
    description,
    primaryLabel,
    primaryHref: localizeHref(locale, hero?.primary_cta_href, "/about"),
    secondaryLabel,
    secondaryHref: localizeHref(locale, hero?.secondary_cta_href, "/register"),
  };

  return (
    <>
      {/* Desktop and laptop deliberately stop at 480px so the next section is
          visible in the first viewport. Phones retain the photograph's natural
          3:2 presentation and receive the copy immediately below it. */}
      <section className="relative aspect-3/2 overflow-hidden bg-brand-900 sm:aspect-auto sm:h-[480px]">
        <HeroSlider images={images} locale={locale} />

        <Container className="relative z-20 hidden h-full items-end pb-7 sm:flex">
          <HeroCopy {...copyProps} />
        </Container>
      </section>

      <section className="relative z-20 -mt-4 sm:hidden">
        <Container>
          <HeroCopy {...copyProps} mobile />
        </Container>
      </section>
    </>
  );
}
