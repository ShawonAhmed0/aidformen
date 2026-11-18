import { HomeAboutAudioPlayer } from "@/components/HomeAboutAudioPlayer";
import { HomeAboutBody } from "@/components/HomeAboutBody";
import { Container } from "@/components/ui/container";
import { getAboutContent } from "@/lib/content/about";
import { getHomeAboutDoc } from "@/lib/content/home-about";
import type { Locale } from "@/lib/i18n/config";
import type { HeroContent } from "@/lib/types/content";

/** The foundation's narrated introduction, one recording per language. */
const aboutVoiceOver: Record<Locale, string> = {
  bn: "/audio/about-bn.mp3",
  en: "/audio/about-en.mp3",
};

export function HomeAboutSection({
  locale,
  hero,
}: {
  locale: Locale;
  hero: HeroContent | null;
}) {
  const about = getAboutContent(locale);
  const doc = getHomeAboutDoc(locale);
  const copy =
    locale === "en"
      ? {
          history: "How we began",
          more: "Read our full story",
          less: "Show less",
          contents: "Contents",
        }
      : {
          history: "আমাদের সূচনা",
          more: "সম্পূর্ণ ইতিহাস পড়ুন",
          less: "কম দেখান",
          contents: "সূচিপত্র",
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
            doc={doc}
            journeyTitle={copy.history}
            moreLabel={copy.more}
            lessLabel={copy.less}
            contentsLabel={copy.contents}
          />

          <div className="mt-6 sm:mt-8">
            {/* An audio URL set in /admin replaces both voice-overs; until
                then each locale plays its own recording from /public. */}
            <HomeAboutAudioPlayer
              src={hero?.about_audio_url || aboutVoiceOver[locale]}
              locale={locale}
            />
          </div>
        </article>
      </Container>
    </section>
  );
}
