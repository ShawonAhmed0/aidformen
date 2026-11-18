"use client";

import Image from "next/image";
import { ExternalLink, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** One upload, with its date and view count already formatted on the server. */
export type GalleryVideo = {
    id: string;
    title: string;
    thumbnail: string;
    watchUrl: string;
    publishedAt: string;
    /** "3 days ago · 420 views" — formatted server-side so it can't drift on hydrate. */
    meta: string;
    dateLabel: string;
};

type Labels = {
    latest: string;
    play: string;
    close: string;
    watchOnYouTube: string;
};

/**
 * Clicks open the video in an in-page player instead of sending the reader to
 * YouTube. Each card is still a real link to the watch page, so a modified
 * click opens a new tab and the section works without JavaScript.
 */
function openHandler(video: GalleryVideo, open: (video: GalleryVideo) => void) {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
            return;
        }
        event.preventDefault();
        open(video);
    };
}

function PlayBadge({ size }: { size: "lg" | "sm" }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "flex items-center justify-center rounded-full bg-white/95 shadow-lg ring-4 ring-white/20 transition-transform duration-200 ease-standard group-hover:scale-110",
                size === "lg" ? "size-16" : "size-9 ring-2"
            )}
        >
            {/* Nudged right to optically centre the triangle. */}
            <Play
                className={cn(
                    "translate-x-px fill-brand-800 text-brand-800",
                    size === "lg" ? "size-6" : "size-3.5"
                )}
            />
        </span>
    );
}

export function YouTubeGallery({
    videos,
    labels,
}: {
    videos: GalleryVideo[];
    labels: Labels;
}) {
    const [playing, setPlaying] = useState<GalleryVideo | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [lead, ...rest] = videos;

    // showModal() gives the focus trap, Escape and the inert page for free.
    // The iframe is only rendered while open, so closing stops playback.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || !playing) return;

        if (!dialog.open) dialog.showModal();
        const previousOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";

        return () => {
            document.documentElement.style.overflow = previousOverflow;
        };
    }, [playing]);

    if (!lead) return null;

    return (
        <>
            <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
                {/* The newest upload, large. */}
                <a
                    href={lead.watchUrl}
                    onClick={openHandler(lead, setPlaying)}
                    aria-haspopup="dialog"
                    className="group block lg:col-span-7"
                >
                    <span className="relative block aspect-video overflow-hidden rounded-2xl bg-brand-900 shadow-md">
                        <Image
                            src={lead.thumbnail}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 640px, 100vw"
                            className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
                        />
                        <span
                            aria-hidden="true"
                            className="absolute inset-0 bg-ink-950/20 transition-ui group-hover:bg-ink-950/5"
                        />
                        <span className="absolute inset-0 flex items-center justify-center">
                            <PlayBadge size="lg" />
                        </span>
                        <span className="absolute start-4 top-4 rounded-full bg-ink-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                            {labels.latest}
                        </span>
                    </span>

                    <span className="mt-4 block text-xl leading-snug text-brand-900 transition-ui group-hover:text-brand-700 sm:text-2xl">
                        <span className="sr-only">{labels.play}: </span>
                        {lead.title}
                    </span>
                    <span className="mt-2 block text-sm text-ink-500">
                        <time dateTime={lead.publishedAt} title={lead.dateLabel}>
                            {lead.meta}
                        </time>
                    </span>
                </a>

                {/* The next few, as a compact playlist beside it. */}
                {rest.length > 0 && (
                    <ol className="flex flex-col gap-1 lg:col-span-5">
                        {rest.map((video) => (
                            <li key={video.id}>
                                <a
                                    href={video.watchUrl}
                                    onClick={openHandler(video, setPlaying)}
                                    aria-haspopup="dialog"
                                    className="group -mx-2 flex items-start gap-4 rounded-xl p-2 transition-ui hover:bg-surface-sunken"
                                >
                                    <span className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-brand-900 sm:w-44">
                                        <Image
                                            src={video.thumbnail}
                                            alt=""
                                            fill
                                            sizes="176px"
                                            className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center bg-ink-950/15">
                                            <PlayBadge size="sm" />
                                        </span>
                                    </span>
                                    <span className="min-w-0 pt-0.5">
                                        <span className="line-clamp-3 text-base leading-snug text-brand-900 transition-ui group-hover:text-brand-700">
                                            <span className="sr-only">{labels.play}: </span>
                                            {video.title}
                                        </span>
                                        <span className="mt-1.5 block text-xs text-ink-500">
                                            <time dateTime={video.publishedAt} title={video.dateLabel}>
                                                {video.meta}
                                            </time>
                                        </span>
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            <dialog
                ref={dialogRef}
                aria-label={playing?.title}
                onClose={() => setPlaying(null)}
                // A click on the backdrop lands on the <dialog> itself.
                onClick={(event) => {
                    if (event.target === event.currentTarget) event.currentTarget.close();
                }}
                className="m-auto w-[min(64rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-2xl bg-ink-950 p-0 text-white shadow-2xl backdrop:bg-ink-950/80 backdrop:backdrop-blur-sm"
            >
                {playing && (
                    <>
                        <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                            <p className="line-clamp-1 min-w-0 flex-1 text-sm font-semibold">
                                {playing.title}
                            </p>
                            <a
                                href={playing.watchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm text-white/80 transition-ui hover:bg-white/10 hover:text-white sm:inline-flex"
                            >
                                {labels.watchOnYouTube}
                                <ExternalLink className="size-4" aria-hidden="true" />
                            </a>
                            <button
                                type="button"
                                onClick={() => dialogRef.current?.close()}
                                aria-label={labels.close}
                                className="-me-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-white/80 transition-ui hover:bg-white/10 hover:text-white"
                            >
                                <X className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="aspect-video bg-black">
                            {/* youtube-nocookie: no tracking cookies until the
                                visitor actually plays. */}
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0&modestbranding=1`}
                                title={playing.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                referrerPolicy="strict-origin-when-cross-origin"
                                className="size-full"
                            />
                        </div>
                    </>
                )}
            </dialog>
        </>
    );
}
