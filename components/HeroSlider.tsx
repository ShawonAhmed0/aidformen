"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

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

      {(title || subtitle) && (
        <AnimatePresence mode="wait">
          <motion.aside
            key={`caption-${slide.id}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            aria-label={locale === "en" ? "Current slide caption" : "বর্তমান স্লাইডের ক্যাপশন"}
            className="absolute right-6 top-6 z-10 hidden max-w-sm rounded-xl border border-white/15 bg-brand-950/76 p-5 text-white shadow-xl backdrop-blur-lg lg:block xl:right-[max(1.5rem,calc((100vw-80rem)/2))]"
          >
            <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-brand-100">
              {locale === "en" ? "From our history" : "আমাদের ইতিহাস থেকে"}
            </p>
            {title && <h2 className="mt-2 text-xl text-white">{title}</h2>}
            {subtitle && <p className="mt-2 text-sm leading-6 text-brand-50">{subtitle}</p>}
          </motion.aside>
        </AnimatePresence>
      )}

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
