import Image from "next/image";
import Link from "next/link";
import { getCarouselImages } from "@/lib/carousel";
import HeroSlider from "@/components/HeroSlider";
import { getHeroContent } from "@/lib/hero";

export default async function Hero() {
    const images = await getCarouselImages();
    const hero = await getHeroContent();

    if (!images.length) {
        return null; // or your own loading/fallback component
    }

    return (
        <section className="relative h-[85vh] flex items-center overflow-hidden">

            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <HeroSlider images={images} />

                {/* 🔥 GRADIENT FIX (THIS WAS YOUR MAIN ISSUE) */}

                <div className="absolute inset-0 bg-gradient-to-r from-[#004d65]/90 via-[#004d65]/60 to-transparent z-10" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full px-6 md:px-12 max-w-6xl mx-auto">
                <div className="max-w-3xl">

                    <div className="max-w-2xl">
                        <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight">
                            {hero.heading}
                        </h1>
                    </div>

                    <p className="mt-6 text-white/90 text-xl leading-relaxed">
                        {hero.description}
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Link
                                href="/about"
                                className="bg-white text-primary px-6 py-3 rounded-lg font-bold shadow-sm hover:shadow-md hover:bg-gray-50 transition flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    info
                                </span>
                                আমাদের সম্পর্কে জানুন
                            </Link>

                            <Link
                                href="/login"
                                className="border border-white/40 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    volunteer_activism
                                </span>
                                স্বেচ্ছাসেবী হিসেবে যোগ দিন
                            </Link>

                        </div>

                    </div>

                </div>
            </div>


        </section>
    );
}