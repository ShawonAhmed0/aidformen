"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { pick, type Locale } from "@/lib/i18n/config";
import type { CarouselImage } from "@/lib/types/content";

export default function HeroSlider({
    images,
    locale,
}: {
    images: CarouselImage[];
    locale: Locale;
}) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (images.length < 2) return;

        // Respect the OS setting: with reduced motion on, hold the first frame
        // rather than cross-fading every few seconds.
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
        if (reduceMotion) return;

        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 6000);

        return () => clearInterval(timer);
    }, [images.length]);

    if (!images.length) return null;

    // Guards against the index outrunning the list when a slide is deleted.
    const slide = images[index % images.length];

    return (
        <AnimatePresence mode="sync">
            <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                    opacity: { duration: 1 },
                    scale: { duration: 7, ease: "linear" },
                }}
                className="absolute inset-0"
            >
                <Image
                    src={slide.image_url}
                    // Decorative unless the editor supplied alt text — the hero
                    // heading already carries the meaning.
                    alt={pick(locale, slide.alt_text, slide.alt_text_en)}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                />
            </motion.div>
        </AnimatePresence>
    );
}
