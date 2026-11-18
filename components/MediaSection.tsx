import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getVideos } from "@/lib/content/queries";
import { pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import VideoCard from "./VideoCard";
import { Section } from "./ui/section";
import { SectionHeading } from "./ui/section-heading";
import { buttonVariants } from "./ui/button";

/** The homepage previews a few videos; "All videos" holds the rest. */
const PREVIEW_COUNT = 3;

// Same rule as ArchivePreview: columns follow the count, and a third card is
// dropped on tablets rather than left alone on a half-empty row.
const gridByCount: Record<number, string> = {
    1: "grid max-w-md",
    2: "grid gap-5 sm:grid-cols-2",
    3: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:max-lg:[&>*:nth-child(3)]:hidden",
};

export default async function MediaSection({
    locale,
    t,
}: {
    locale: Locale;
    t: Dictionary;
}) {
    const videos = (await getVideos()).slice(0, PREVIEW_COUNT);

    if (videos.length === 0) return null;

    return (
        <Section space="md">
            <SectionHeading
                eyebrow={t.home.mediaEyebrow}
                title={t.home.mediaTitle}
                description={t.home.mediaBody}
                action={
                    <Link
                        href={`/${locale}/news`}
                        className={buttonVariants({ variant: "outline", className: "gap-2" })}
                    >
                        {t.home.allVideos}
                        <ArrowRight aria-hidden="true" />
                    </Link>
                }
            />

            <div className={gridByCount[videos.length]}>
                {videos.map((video) => (
                    <VideoCard
                        key={video.id}
                        image={video.thumbnail_url}
                        title={pick(locale, video.title, video.title_en)}
                        duration={video.duration}
                        year={video.year}
                        href={video.video_url || `/${locale}/news`}
                        durationLabel={t.home.duration}
                    />
                ))}
            </div>
        </Section>
    );
}
