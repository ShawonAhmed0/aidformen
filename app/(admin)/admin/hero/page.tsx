import { getAllCarouselImages, getHeroContent } from "@/lib/content/queries";
import { HeroEditor } from "@/components/admin/HeroEditor";
import { CarouselManager } from "@/components/admin/CarouselManager";

export default async function AdminHeroPage() {
    const [hero, slides] = await Promise.all([
        getHeroContent(),
        getAllCarouselImages(),
    ]);

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl tracking-tight text-ink-900">হিরো সেকশন</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                    হোমপেজের উপরের অংশের লেখা ও ব্যাকগ্রাউন্ড ছবিগুলো এখান থেকে
                    পরিবর্তন করুন।
                </p>
            </div>

            <CarouselManager slides={slides} />

            <HeroEditor hero={hero} />
        </div>
    );
}
