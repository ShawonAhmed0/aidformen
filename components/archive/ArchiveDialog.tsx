"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ImageOff,
    MapPin,
    X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCount } from "@/lib/i18n/config";
import type { ArchiveItem } from "@/lib/types/archive";
import type { ArchiveLabels } from "./labels";
import { cn } from "@/lib/utils";

/**
 * Detail view for one archive entry: heading, paragraph, and either the gallery
 * or the video.
 *
 * Keyboard handling matches the team dialog — Escape closes, Tab is kept inside,
 * body scroll is locked, focus returns to the card that opened it. Arrow keys
 * additionally step through a gallery, which is how anyone expects a lightbox to
 * behave once it is open.
 */
export function ArchiveDialog({
    item,
    t,
    locale,
    onClose,
}: {
    item: ArchiveItem;
    t: ArchiveLabels;
    locale: "bn" | "en";
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);

    const photos = item.photos;
    const total = photos.length;
    const active = photos[Math.min(index, Math.max(total - 1, 0))];

    const step = useCallback(
        (direction: -1 | 1) => {
            if (total < 2) return;
            setIndex((current) => (current + direction + total) % total);
        },
        [total]
    );

    useEffect(() => {
        const node = dialogRef.current;
        const focusables = node?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusables?.[0]?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
                return;
            }

            if (event.key === "ArrowLeft") {
                step(-1);
                return;
            }

            if (event.key === "ArrowRight") {
                step(1);
                return;
            }

            if (event.key === "Tab" && focusables && focusables.length > 0) {
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onClose, step]);

    return (
        <div
            className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-ink-950/70 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="archive-entry-heading"
                className="relative my-6 w-full max-w-3xl overflow-hidden rounded-2xl bg-surface shadow-xl"
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-surface/90 text-ink-600 shadow-sm transition-ui hover:bg-surface hover:text-ink-900"
                    aria-label={t.close}
                >
                    <X className="size-5" />
                </button>

                {item.kind === "video" ? (
                    <VideoStage item={item} t={t} />
                ) : (
                    <div className="relative aspect-3/2 w-full bg-ink-950">
                        {active ? (
                            <Image
                                key={active.id}
                                src={active.url}
                                alt={active.caption || ""}
                                fill
                                sizes="(min-width: 768px) 768px, 100vw"
                                className="object-contain"
                                priority
                            />
                        ) : item.cover ? (
                            <Image
                                src={item.cover}
                                alt=""
                                fill
                                sizes="(min-width: 768px) 768px, 100vw"
                                className="object-contain"
                            />
                        ) : (
                            <span className="flex size-full flex-col items-center justify-center gap-2 text-sm text-ink-400">
                                <ImageOff className="size-8" aria-hidden="true" />
                                {t.noPhotos}
                            </span>
                        )}

                        {total > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => step(-1)}
                                    aria-label={t.previousPhoto}
                                    className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink-700 shadow-sm transition-ui hover:bg-surface hover:text-ink-900"
                                >
                                    <ChevronLeft className="size-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => step(1)}
                                    aria-label={t.nextPhoto}
                                    className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink-700 shadow-sm transition-ui hover:bg-surface hover:text-ink-900"
                                >
                                    <ChevronRight className="size-5" />
                                </button>

                                {/* Counter over its own scrim: the photo behind it
                                    is arbitrary, so nothing else guarantees the
                                    text stays readable. */}
                                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-950/75 px-3 py-1 text-xs font-medium text-white">
                                    {formatCount(locale, Math.min(index, total - 1) + 1)} /{" "}
                                    {formatCount(locale, total)}
                                </span>
                            </>
                        )}
                    </div>
                )}

                <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-500">
                        <Badge tone="brand" size="sm">
                            {item.kind === "video" ? t.videoKind : t.photoKind}
                        </Badge>

                        {item.category && (
                            <span className="font-semibold text-brand-700">
                                {item.category}
                            </span>
                        )}

                        {item.date && (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-4" aria-hidden="true" />
                                {item.date}
                            </span>
                        )}

                        {item.location && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-4" aria-hidden="true" />
                                {item.location}
                            </span>
                        )}
                    </div>

                    <h2
                        id="archive-entry-heading"
                        className="mt-4 text-2xl text-brand-800 sm:text-3xl"
                    >
                        {item.heading}
                    </h2>

                    {/* whitespace-pre-line keeps the paragraph breaks the editor
                        typed in the admin textarea. */}
                    {item.body && (
                        <p className="mt-4 whitespace-pre-line text-base text-ink-600">
                            {item.body}
                        </p>
                    )}

                    {active?.caption && (
                        <p className="mt-5 border-l-2 border-ochre-600 pl-4 text-sm text-ink-600">
                            {active.caption}
                        </p>
                    )}

                    {item.kind === "video" && item.externalUrl && (
                        <a
                            href={item.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-brand-700 transition-ui hover:text-brand-800"
                        >
                            <ExternalLink className="size-4" aria-hidden="true" />
                            {t.openExternal}
                        </a>
                    )}

                    {/* Thumbnail strip, so a long gallery can be jumped through
                        rather than stepped through one photo at a time. */}
                    {total > 1 && (
                        <ul className="mt-6 flex flex-wrap gap-2">
                            {photos.map((photo, i) => (
                                <li key={photo.id}>
                                    <button
                                        type="button"
                                        onClick={() => setIndex(i)}
                                        aria-current={i === index}
                                        className={cn(
                                            "relative block size-16 overflow-hidden rounded-lg border-2 transition-ui",
                                            i === index
                                                ? "border-brand-700"
                                                : "border-transparent opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        <Image
                                            src={photo.url}
                                            alt=""
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                        />
                                        <span className="sr-only">
                                            {formatCount(locale, i + 1)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * The player. An uploaded file wins over a link — it is ours, so it needs no
 * third-party frame — and a link is only framed when `toEmbedUrl` recognised the
 * host, which is what stops an arbitrary origin ending up in an iframe.
 */
function VideoStage({ item, t }: { item: ArchiveItem; t: ArchiveLabels }) {
    if (item.fileUrl) {
        return (
            <video
                src={item.fileUrl}
                poster={item.cover ?? undefined}
                controls
                preload="metadata"
                playsInline
                className="aspect-video w-full bg-ink-950"
            />
        );
    }

    if (item.embedUrl) {
        return (
            <iframe
                src={item.embedUrl}
                title={item.heading}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="aspect-video w-full border-0 bg-ink-950"
            />
        );
    }

    return (
        <div className="relative flex aspect-video w-full items-center justify-center bg-ink-950 px-6 text-center">
            {item.cover && (
                <Image
                    src={item.cover}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 768px, 100vw"
                    className="object-cover opacity-40"
                />
            )}
            <p className="relative text-sm font-medium text-white">
                {t.videoUnavailable}
            </p>
        </div>
    );
}
