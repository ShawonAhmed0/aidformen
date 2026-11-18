import { HomeAboutAudioPlayer } from "@/components/HomeAboutAudioPlayer";
import { HomeAboutBody } from "@/components/HomeAboutBody";
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
          history: "Our journey",
          more: "Read more",
          less: "Show less",
          link: "Read our full story",
        }
      : {
          history: "আমাদের পথচলা",
          more: "আরও পড়ুন",
          less: "কম দেখান",
          link: "সম্পূর্ণ ইতিহাস পড়ুন",
        };

  return (
    <section className="bg-surface py-10 sm:py-14" aria-labelledby="home-about-title">
      <Container>
        {/* One full-width card: copy on top, clamped until expanded, and the
            audio story as a player bar along the bottom. The audio used to
            be a half-width column that sat mostly empty beside the text. */}
        <article className="rounded-2xl border border-ink-200 bg-surface-sunken p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            {about.hero.eyebrow}
          </p>
          <h2 id="home-about-title" className="mt-2 text-2xl text-brand-950 sm:text-3xl">
            {about.hero.title}
          </h2>

          <HomeAboutBody
            intro={about.intro[0]}
            journeyTitle={copy.history}
            journey={about.inception.paragraphs[1]}
            moreLabel={copy.more}
            lessLabel={copy.less}
            storyHref={`/${locale}/about`}
            storyLabel={copy.link}
          />

          <div className="mt-6 sm:mt-8">
            <HomeAboutAudioPlayer src={hero?.about_audio_url || null} locale={locale} />
          </div>
        </article>
      </Container>
    </section>
  );
}
