import Link from "next/link";
import { Building2, ChevronRight, UserRoundPlus } from "lucide-react";

import HeroSlider from "@/components/HeroSlider";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getCarouselImages, getHeroContent } from "@/lib/content/queries";
import { localizeHref, pick, type Locale } from "@/lib/i18n/config";

type HeroCopyProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

function HeroCopy({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: HeroCopyProps) {
  return (
    // Sits below the photograph and is lifted by 3% of its own height (a
    // translate percentage resolves against the element, not the parent), so
    // it only just overlaps the photo at any breakpoint. Mostly over the page
    // background now, so the fill is opaque rather than frosted. On laptops
    // the copy sits beside the actions to keep the band low. Full Container
    // width, so its edges line up with the sections below.
    <div className="w-full -translate-y-[3%] rounded-2xl bg-brand-950 p-5 text-white shadow-xl ring-1 ring-white/5 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_14.5rem] lg:items-center lg:gap-8 lg:px-7">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.12em] text-brand-100">
            {eyebrow}
          </p>
        )}

        <h1 className="text-2xl text-white lg:text-3xl">{title}</h1>

        {description && (
          <p className="mt-2 text-sm leading-6 text-brand-50 sm:line-clamp-2">
            {description}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
        <Link
          href={primaryHref}
          className={buttonVariants({
            variant: "onDark",
            size: "md",
            className:
              "h-auto min-h-11 w-full justify-between whitespace-normal rounded-xl border border-white/90 bg-white px-4 py-2 text-left text-sm font-semibold shadow-lg hover:-translate-y-0.5 hover:bg-white",
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
              "h-auto min-h-11 w-full justify-between whitespace-normal rounded-xl border-brand-200/50 bg-brand-700/90 px-4 py-2 text-left text-sm font-semibold shadow-lg hover:-translate-y-0.5 hover:bg-brand-700",
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

/** Earlier labels for the button that now leads to "Our Journey". */
const staleAboutLabels = new Set([
  "আমাদের সম্পর্কে জানুন",
  "আমাদের সম্পর্কে",
  "know about us",
  "learn about us",
  "about us",
  // Same name, earlier capitalisation.
  "our journey",
]);

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
  // The About page is now "Our Journey". The stored button text still reads
  // "About us" until it is edited in /admin/hero (or migration 0018 runs), so
  // those old wordings — and only those — give way to the page's new name.
  const journeyLabel = locale === "en" ? "Our Journey" : "আমাদের পথচলা";
  const storedPrimary = pick(locale, hero?.primary_cta_label, hero?.primary_cta_label_en);
  const primaryLabel =
    !storedPrimary || staleAboutLabels.has(storedPrimary.trim().toLowerCase())
      ? journeyLabel
      : storedPrimary;
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
    secondaryHref: localizeHref(locale, hero?.secondary_cta_href, "/contact"),
  };

  return (
    <>
      {/* Desktop and laptop deliberately stop at 480px so the next section is
          visible in the first viewport. Phones retain the photograph's natural
          3:2 presentation. Nothing sits on the photo but its caption. */}
      <section className="relative aspect-3/2 overflow-hidden bg-brand-900 sm:aspect-auto sm:h-[480px]">
        <HeroSlider images={images} locale={locale} />
      </section>

      {/* A sibling, not a child: the section's overflow-hidden clips the
          slider's zoom and would clip anything straddling its bottom edge.
          bg-surface matches HomeAboutSection below, so the band behind the
          panel doesn't read as a separate stripe. */}
      <section className="relative z-20 bg-surface">
        <Container>
          <HeroCopy {...copyProps} />
        </Container>
      </section>
    </>
  );
}
