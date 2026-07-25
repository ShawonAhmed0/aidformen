"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export default function HeroSlider({ images }: { images: any[] }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 3000);

        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={images[index].id}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0"
            >
                <Image
                    src={images[index].image_url}
                    alt={images[index].title || "Hero"}
                    fill
                    className="object-cover"
                />
            </motion.div>
        </AnimatePresence>
    );
}