"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
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
                // The zoom is suppressed on phones rather than conditioned in
                // JS: an effect-driven flag would still render the first frame
                // at 1.04 before hydration, and the point on a phone is that the
                // whole photo is visible — a 4% scale would crop it again.
                // !important is what lets a class beat motion's inline style.
                className="absolute inset-0 max-sm:transform-none!"
            >
                <Image
                    src={slide.image_url}
                    // Decorative unless the editor supplied alt text — the hero
                    // heading already carries the meaning.
                    alt={pick(locale, slide.alt_text, slide.alt_text_en)}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    // contain on phones so a slide whose ratio is not the 3:2 the
                    // section assumes is letterboxed against the brand background
                    // rather than cropped.
                    className="object-contain sm:object-cover"
                    // Framing chosen per slide in the admin; see migration 0004.
                    style={{ objectPosition: focalPosition(slide.focal_x, slide.focal_y) }}
                />
            </motion.div>
        </AnimatePresence>
    );
}
