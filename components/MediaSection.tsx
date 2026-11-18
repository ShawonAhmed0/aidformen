import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { FaYoutube } from "react-icons/fa6";

import { getVideos } from "@/lib/content/queries";
import { getYouTubeUploads, youtubeChannel, type YouTubeVideo } from "@/lib/content/youtube";
import { pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import VideoCard from "./VideoCard";
import { YouTubeGallery, type GalleryVideo } from "./YouTubeGallery";
import { Section } from "./ui/section";
import { SectionHeading } from "./ui/section-heading";
import { buttonVariants } from "./ui/button";

/** The admin-managed fallback previews a few videos; "All videos" holds the rest. */
const PREVIEW_COUNT = 3;
/** From YouTube: the newest upload large, the next four beside it. */
const YOUTUBE_COUNT = 5;

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
];

/** "3 days ago · 420 views", in the locale's words and digits. */
function toGalleryVideo(video: YouTubeVideo, locale: Locale, t: Dictionary): GalleryVideo {
    const intlLocale = locale === "bn" ? "bn-BD" : "en-GB";
    const seconds = (Date.parse(video.publishedAt) - Date.now()) / 1000;
    const [unit, size] =
        relativeUnits.find(([, length]) => Math.abs(seconds) >= length) ?? ["minute", 60];
    const when = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto" }).format(
        Math.round(seconds / size),
        unit
    );
    const views =
        video.views === null
            ? null
            : `${new Intl.NumberFormat(intlLocale, { notation: "compact" }).format(video.views)} ${
                  video.views === 1 ? t.home.viewOne : t.home.views
              }`;

    return {
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        watchUrl: video.watchUrl,
        publishedAt: video.publishedAt,
        meta: views ? `${when} · ${views}` : when,
        dateLabel: new Intl.DateTimeFormat(intlLocale, { dateStyle: "long" }).format(
            new Date(video.publishedAt)
        ),
    };
}

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
    // The channel is the source of truth; the admin list only stands in when
    // YouTube can't be reached, so the section never disappears with it.
    const uploads = await getYouTubeUploads(YOUTUBE_COUNT);

    if (uploads.length > 0) {
        return (
            <Section space="md">
                <SectionHeading
                    eyebrow={t.home.mediaEyebrow}
                    title={t.home.mediaTitle}
                    description={t.home.youtubeBody}
                    action={
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={youtubeChannel.subscribeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({ className: "gap-2" })}
                            >
                                <FaYoutube className="size-5" aria-hidden="true" />
                                {t.home.subscribe}
                            </a>
                            <a
                                href={youtubeChannel.videosUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({ variant: "outline", className: "gap-2" })}
                            >
                                {t.home.allVideos}
                                <ExternalLink className="size-4" aria-hidden="true" />
                            </a>
                        </div>
                    }
                />

                <YouTubeGallery
                    videos={uploads.map((video) => toGalleryVideo(video, locale, t))}
                    labels={{
                        latest: t.home.latestVideo,
                        play: t.home.playVideo,
                        close: t.home.closeVideo,
                        watchOnYouTube: t.home.watchOnYouTube,
                    }}
                />
            </Section>
        );
    }

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
