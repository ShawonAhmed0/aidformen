"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { Container } from "@/components/ui/container";
import { pick, type Locale } from "@/lib/i18n/config";
import { focalPosition, type CarouselImage } from "@/lib/types/content";

export default function HeroSlider({
  images,
  locale,
}: {
  images: CarouselImage[];
  locale: Locale;
}) {
  const [index, setIndex] = useState(0);
  const [pauseOverride, setPauseOverride] = useState<boolean | null>(null);
  const reduceMotion = useReducedMotion();
  const paused = pauseOverride ?? Boolean(reduceMotion);

  useEffect(() => {
    if (images.length < 2 || paused) return;

    const timer = window.setInterval(() => {
      setIndex((previous) => (previous + 1) % images.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [images.length, paused]);

  if (!images.length) return null;

  const slide = images[index % images.length];
  const title = pick(locale, slide.title, slide.title_en);
  const subtitle = pick(locale, slide.subtitle, slide.subtitle_en);

  return (
    <>
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: reduceMotion ? 0 : 1 },
            scale: { duration: paused || reduceMotion ? 0 : 7, ease: "linear" },
          }}
          className="absolute inset-0 max-sm:transform-none!"
        >
          <Image
            src={slide.image_url}
            alt={pick(locale, slide.alt_text, slide.alt_text_en)}
            fill
            preload={index === 0}
            sizes="100vw"
            className="object-contain sm:object-cover"
            style={{ objectPosition: focalPosition(slide.focal_x, slide.focal_y) }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Photo caption in the bottom-left corner, aligned with the hero
          panel's left edge and bottom-aligned with the pause button. Up to two
          lines each for title and subtitle; max-w keeps it clear of the pause
          button on tablets. The fill is opaque enough for 13px white text over
          a blown-out sky. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 hidden sm:block">
        <Container>
          <AnimatePresence mode="wait">
            {(title || subtitle) && (
              <motion.aside
                key={`caption-${slide.id}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25 }}
                aria-label={locale === "en" ? "Current slide caption" : "বর্তমান স্লাইডের ক্যাপশন"}
                className="pointer-events-auto w-fit max-w-lg rounded-xl border border-white/10 bg-brand-950/80 px-4 py-3 text-white shadow-lg backdrop-blur-md lg:max-w-xl"
              >
                <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-brand-100">
                  {locale === "en" ? "From our history" : "আমাদের ইতিহাস থেকে"}
                </p>
                {title && (
                  <p className="mt-1 line-clamp-2 text-sm leading-snug font-medium text-white">
                    {title}
                  </p>
                )}
                {subtitle && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-brand-50">{subtitle}</p>
                )}
              </motion.aside>
            )}
          </AnimatePresence>
        </Container>
      </div>

      {images.length > 1 && (
        <button
          type="button"
          onClick={() => setPauseOverride(!paused)}
          aria-label={
            paused
              ? locale === "en"
                ? "Play hero slideshow"
                : "হিরো স্লাইডশো চালু করুন"
              : locale === "en"
                ? "Pause hero slideshow"
                : "হিরো স্লাইডশো বিরতি দিন"
          }
          aria-pressed={paused}
          className="absolute right-4 bottom-4 z-30 flex size-11 items-center justify-center rounded-full border border-white/30 bg-brand-950/80 text-white shadow-lg backdrop-blur-md transition-ui hover:bg-brand-900 focus-visible:outline-white sm:right-6 sm:bottom-6"
        >
          {paused ? (
            <Play className="size-4 fill-current" aria-hidden="true" />
          ) : (
            <Pause className="size-4 fill-current" aria-hidden="true" />
          )}
        </button>
      )}
    </>
  );
}
