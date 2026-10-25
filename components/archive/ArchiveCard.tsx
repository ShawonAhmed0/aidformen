"use client";

import Image from "next/image";
import Link from "next/link";
import {
    CalendarDays,
    FileText,
    Images,
    ImageOff,
    Mic2,
    Play,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { editorialPlainText } from "@/lib/editorial/plain-text";
import { formatCount } from "@/lib/i18n/config";
import type { ArchiveListingItem } from "@/lib/types/archive";
import type { ArchiveLabels } from "./labels";
import { cn } from "@/lib/utils";

/**
 * One entry linking to its stable detail URL.
 */
export function ArchiveCard({
    item,
    t,
    locale,
    priority = false,
    className,
}: {
    item: ArchiveListingItem;
    t: ArchiveLabels;
    locale: "bn" | "en";
    priority?: boolean;
    className?: string;
}) {
    const isVideo = item.kind === "video";
    const isAudio = item.kind === "audio";
    const isArticle = item.kind === "article";
    const photoCount = item.photoCount;

    const kindLabel = isVideo
        ? t.videoKind
        : isAudio
          ? t.audioKind
          : isArticle
            ? t.articleKind
            : t.photoKind;

    const KindIcon = isVideo ? Play : isAudio ? Mic2 : isArticle ? FileText : Images;

    return (
        <Link
            href={`/${locale}/news/${item.slug}`}
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
                        priority={priority}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
                    />
                ) : (
                    <ImageOff className="size-8 text-brand-600" aria-hidden="true" />
                )}

                {/* Play affordance for a video entry. The scrim underneath is what
                    keeps the white glyph legible over an arbitrary photograph. */}
                {(isVideo || isAudio) && (
                    <span
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center bg-ink-950/35 transition-ui group-hover:bg-ink-950/25"
                    >
                        <span className="flex size-14 items-center justify-center rounded-full bg-white/95 text-brand-800 shadow-md transition-transform duration-200 group-hover:scale-105">
                            <KindIcon
                                className={cn(
                                    "size-6",
                                    isVideo && "translate-x-px fill-current"
                                )}
                            />
                        </span>
                    </span>
                )}

                <span className="absolute left-3 top-3">
                    <Badge tone={isVideo || isAudio ? "solid" : "onDark"} size="sm">
                        <KindIcon
                            aria-hidden="true"
                            className={cn(isVideo && "fill-current")}
                        />
                        {item.kind === "photo" && photoCount > 0
                            ? `${formatCount(locale, photoCount)} ${t.photosLabel}`
                            : kindLabel}
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
                        {editorialPlainText(item.body)}
                    </span>
                )}

                <span className="mt-auto pt-4 text-sm font-semibold text-brand-700">
                    {isVideo
                        ? t.watchVideo
                        : isAudio
                          ? t.listenAudio
                          : item.kind === "photo"
                            ? t.viewGallery
                            : t.readArticle}
                </span>
            </span>
        </Link>
    );
}
