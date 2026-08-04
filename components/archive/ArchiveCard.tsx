"use client";

import Image from "next/image";
import { CalendarDays, Images, ImageOff, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCount } from "@/lib/i18n/config";
import type { ArchiveItem } from "@/lib/types/archive";
import type { ArchiveLabels } from "./labels";
import { cn } from "@/lib/utils";

/**
 * One archive entry as a card that opens the detail dialog.
 *
 * A button rather than a link: the heading, paragraph and media all live in the
 * dialog, so there is no separate page for a link to point at.
 */
export function ArchiveCard({
    item,
    t,
    locale,
    onOpen,
    className,
}: {
    item: ArchiveItem;
    t: ArchiveLabels;
    locale: "bn" | "en";
    onOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
}) {
    const isVideo = item.kind === "video";
    const photoCount = item.photos.length;

    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                "group flex h-full w-full flex-col overflow-hidden rounded-xl border border-ink-200 bg-surface text-left shadow-xs transition-ui hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md",
                className
            )}
        >
            <span className="relative flex aspect-3/2 w-full items-center justify-center overflow-hidden bg-brand-50">
                {item.cover ? (
                    <Image
                        src={item.cover}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
                    />
                ) : (
                    <ImageOff className="size-8 text-brand-600" aria-hidden="true" />
                )}

                {/* Play affordance for a video entry. The scrim underneath is what
                    keeps the white glyph legible over an arbitrary photograph. */}
                {isVideo && (
                    <span
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center bg-ink-950/35 transition-ui group-hover:bg-ink-950/25"
                    >
                        <span className="flex size-14 items-center justify-center rounded-full bg-white/95 text-brand-800 shadow-md transition-transform duration-200 group-hover:scale-105">
                            <Play className="size-6 translate-x-px fill-current" />
                        </span>
                    </span>
                )}

                <span className="absolute left-3 top-3">
                    <Badge tone={isVideo ? "solid" : "onDark"} size="sm">
                        {isVideo ? (
                            <>
                                <Play aria-hidden="true" className="fill-current" />
                                {t.videoKind}
                            </>
                        ) : (
                            <>
                                <Images aria-hidden="true" />
                                {photoCount > 0
                                    ? `${formatCount(locale, photoCount)} ${t.photosLabel}`
                                    : t.photoKind}
                            </>
                        )}
                    </Badge>
                </span>
            </span>

            <span className="flex flex-1 flex-col p-5">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                    {item.category && (
                        <span className="font-semibold text-brand-700">{item.category}</span>
                    )}
                    {item.date && (
                        <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3.5" aria-hidden="true" />
                            {item.date}
                        </span>
                    )}
                </span>

                <span className="mt-2 font-display text-lg leading-snug text-brand-800">
                    {item.heading}
                </span>

                {item.body && (
                    <span className="mt-2 line-clamp-2 text-sm text-ink-600">
                        {item.body}
                    </span>
                )}

                <span className="mt-auto pt-4 text-sm font-semibold text-brand-700">
                    {isVideo ? t.watchVideo : t.viewGallery}
                </span>
            </span>
        </button>
    );
}
