import { getAllCarouselImages, getHeroContent } from "@/lib/content/queries";
import { HeroEditor } from "@/components/admin/HeroEditor";
import { CarouselManager } from "@/components/admin/CarouselManager";
import { getAdminLocale } from "@/lib/i18n/admin-server";

const copy = {
    bn: {
        title: "হিরো সেকশন",
        intro: "হোমপেজের উপরের অংশের লেখা ও ব্যাকগ্রাউন্ড ছবিগুলো এখান থেকে পরিবর্তন করুন।",
    },
    en: {
        title: "Hero section",
        intro: "Change the text and background images at the top of the homepage from here.",
    },
};

export default async function AdminHeroPage() {
    const [hero, slides, locale] = await Promise.all([
        getHeroContent(),
        getAllCarouselImages(),
        getAdminLocale(),
    ]);
    const t = copy[locale];

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">{t.title}</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    {t.intro}
                </p>
            </div>

            <CarouselManager slides={slides} />

            <HeroEditor hero={hero} />
        </div>
    );
}
