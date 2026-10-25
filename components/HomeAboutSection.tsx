import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HomeAboutAudioPlayer } from "@/components/HomeAboutAudioPlayer";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getAboutContent } from "@/lib/content/about";
import type { Locale } from "@/lib/i18n/config";
import type { HeroContent } from "@/lib/types/content";

export function HomeAboutSection({
  locale,
  hero,
}: {
  locale: Locale;
  hero: HeroContent | null;
}) {
  const about = getAboutContent(locale);
  const copy =
    locale === "en"
      ? {
          eyebrow: "About us",
          history: "Our journey",
          link: "Read our full story",
        }
      : {
          eyebrow: "আমাদের সম্পর্কে",
          history: "আমাদের পথচলা",
          link: "সম্পূর্ণ ইতিহাস পড়ুন",
        };

  return (
    <section className="bg-surface py-10 sm:py-14" aria-labelledby="home-about-title">
      <Container>
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <HomeAboutAudioPlayer src={hero?.about_audio_url ?? null} locale={locale} />

          <article className="rounded-2xl border border-ink-200 bg-surface-sunken p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              {copy.eyebrow}
            </p>
            <h2 id="home-about-title" className="mt-3 text-2xl text-brand-950 sm:text-3xl">
              {about.hero.title}
            </h2>
            <p className="mt-4 text-base leading-8 text-ink-700">
              {about.intro[0]}
            </p>

            <div className="mt-5 border-s-2 border-ochre-400 ps-4">
              <h3 className="text-lg text-brand-900">{copy.history}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-600">
                {about.inception.paragraphs[1]}
              </p>
            </div>

            <Link
              href={`/${locale}/about`}
              className={buttonVariants({
                variant: "outline",
                size: "md",
                className: "mt-6 gap-2",
              })}
            >
              {copy.link}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </article>
        </div>
      </Container>
    </section>
  );
}
