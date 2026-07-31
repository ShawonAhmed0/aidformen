import Link from "next/link";

import { getVideos } from "@/lib/content/queries";
import { pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import VideoCard from "./VideoCard";
import { Section } from "./ui/section";
import { SectionHeading } from "./ui/section-heading";
import { buttonVariants } from "./ui/button";

export default async function MediaSection({
    locale,
    t,
}: {
    locale: Locale;
    t: Dictionary;
}) {
    const videos = await getVideos();

    if (videos.length === 0) return null;

    return (
        <Section space="lg">
            <SectionHeading
                eyebrow={t.home.mediaEyebrow}
                title={t.home.mediaTitle}
                description={t.home.mediaBody}
                action={
                    <Link
                        href={`/${locale}/archive`}
                        className={buttonVariants({ variant: "outline" })}
                    >
                        {t.home.allVideos}
                    </Link>
                }
            />

            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                    <VideoCard
                        key={video.id}
                        image={video.thumbnail_url}
                        title={pick(locale, video.title, video.title_en)}
                        duration={video.duration}
                        year={video.year}
                        href={video.video_url || `/${locale}/archive`}
                        durationLabel={t.home.duration}
                    />
                ))}
            </div>
        </Section>
    );
}
