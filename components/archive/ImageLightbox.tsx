"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { formatCount, type Locale } from "@/lib/i18n/config";

type Slide = { src: string; caption: string };

type Labels = {
    open: string;
    close: string;
    previous: string;
    next: string;
};

/**
 * Elements that open the preview: a server-rendered `[data-zoom-src]` button
 * (cover, gallery), or a bare `<img>` inside `[data-zoom-body]` — the post's
 * rich text, whose markup comes from the editor and can't carry a button.
 * An image inside a link is left alone: the editor meant the link.
 */
const TRIGGER = "[data-zoom-src], [data-zoom-body] img";

function triggerOf(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) return null;
    const trigger = target.closest<HTMLElement>(TRIGGER);
    if (!trigger || (trigger.tagName === "IMG" && trigger.closest("a"))) return null;
    return trigger;
}

function slideOf(el: HTMLElement): Slide {
    if (el instanceof HTMLImageElement) {
        return { src: el.currentSrc || el.src, caption: el.alt.trim() };
    }
    return { src: el.dataset.zoomSrc ?? "", caption: el.dataset.zoomCaption ?? "" };
}

/**
 * Full-screen image preview for one post page.
 *
 * Collects every zoomable image in the nearest `[data-lightbox]` in reading
 * order, so arrows walk cover → body → gallery the way the page reads. The
 * cover is usually also the first gallery photo; it appears once.
 */
export function ImageLightbox({ labels, locale }: { labels: Labels; locale: Locale }) {
    const anchorRef = useRef<HTMLSpanElement>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const swipeRef = useRef<number | null>(null);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [index, setIndex] = useState<number | null>(null);

    const open = useCallback((trigger: HTMLElement, root: HTMLElement) => {
        const unique: Slide[] = [];
        for (const el of root.querySelectorAll<HTMLElement>(TRIGGER)) {
            if (triggerOf(el) !== el) continue;
            const slide = slideOf(el);
            if (slide.src && !unique.some((s) => s.src === slide.src)) unique.push(slide);
        }
        const at = unique.findIndex((s) => s.src === slideOf(trigger).src);
        if (at < 0) return;
        setSlides(unique);
        setIndex(at);
    }, []);

    useEffect(() => {
        const root = anchorRef.current?.closest<HTMLElement>("[data-lightbox]");
        if (!root) return;

        // Body images are plain <img>s; make them reachable and announced as
        // the buttons they now are.
        for (const img of root.querySelectorAll<HTMLImageElement>("[data-zoom-body] img")) {
            if (img.closest("a")) continue;
            img.tabIndex = 0;
            img.setAttribute("role", "button");
            img.setAttribute("aria-label", img.alt ? `${labels.open}: ${img.alt}` : labels.open);
            img.style.cursor = "zoom-in";
        }

        const onClick = (event: MouseEvent) => {
            const trigger = triggerOf(event.target);
            if (!trigger) return;
            event.preventDefault();
            open(trigger, root);
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            const trigger = triggerOf(event.target);
            // Buttons already turn Enter and Space into a click.
            if (!trigger || trigger.tagName !== "IMG") return;
            event.preventDefault();
            open(trigger, root);
        };

        root.addEventListener("click", onClick);
        root.addEventListener("keydown", onKey);
        return () => {
            root.removeEventListener("click", onClick);
            root.removeEventListener("keydown", onKey);
        };
    }, [labels.open, open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || index === null) return;
        if (!dialog.open) dialog.showModal();
        // A modal dialog makes the page inert but still lets it scroll.
        const html = document.documentElement;
        const previous = html.style.overflow;
        html.style.overflow = "hidden";
        return () => {
            html.style.overflow = previous;
        };
    }, [index]);

    const count = slides.length;
    const step = (delta: number) =>
        setIndex((i) => (i === null || count < 2 ? i : (i + delta + count) % count));
    const close = () => dialogRef.current?.close();

    const slide = index === null ? null : slides[index];

    return (
        <>
            <span ref={anchorRef} hidden />
            <dialog
                ref={dialogRef}
                aria-label={slide?.caption || labels.open}
                onClose={() => setIndex(null)}
                onKeyDown={(event) => {
                    if (event.key === "ArrowLeft") step(-1);
                    if (event.key === "ArrowRight") step(1);
                }}
                className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white backdrop:bg-ink-950/90 backdrop:backdrop-blur-sm"
            >
                {slide && (
                    <div className="flex h-full flex-col">
                        <div className="flex h-16 shrink-0 items-center justify-between px-3 sm:px-5">
                            <p className="ps-2 text-sm font-medium tabular-nums text-white/80">
                                {count > 1 &&
                                    `${formatCount(locale, (index ?? 0) + 1)} / ${formatCount(locale, count)}`}
                            </p>
                            <button
                                type="button"
                                onClick={close}
                                aria-label={labels.close}
                                className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-ui hover:bg-white/20"
                            >
                                <X className="size-5" aria-hidden="true" />
                            </button>
                        </div>

                        {/* The empty space around the photo closes it, the way a
                            click on a backdrop would. */}
                        <div
                            className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-20"
                            onClick={(event) => {
                                if (event.target === event.currentTarget) close();
                            }}
                            onPointerDown={(event) => {
                                swipeRef.current = event.clientX;
                            }}
                            onPointerUp={(event) => {
                                const start = swipeRef.current;
                                swipeRef.current = null;
                                if (start === null) return;
                                const dx = event.clientX - start;
                                if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
                            }}
                        >
                            {/* A plain <img>: the original file at its own
                                aspect ratio, which next/image's fixed boxes
                                would crop or need measuring first. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                key={slide.src}
                                src={slide.src}
                                alt={slide.caption}
                                draggable={false}
                                className="max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl"
                            />

                            {count > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => step(-1)}
                                        aria-label={labels.previous}
                                        className="absolute start-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/60 text-white backdrop-blur-sm transition-ui hover:bg-ink-950/80 sm:start-5"
                                    >
                                        <ChevronLeft className="size-6" aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => step(1)}
                                        aria-label={labels.next}
                                        className="absolute end-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/60 text-white backdrop-blur-sm transition-ui hover:bg-ink-950/80 sm:end-5"
                                    >
                                        <ChevronRight className="size-6" aria-hidden="true" />
                                    </button>
                                </>
                            )}
                        </div>

                        <p className="mx-auto min-h-16 max-w-3xl shrink-0 px-6 py-4 text-center text-sm leading-6 text-white/85">
                            {slide.caption}
                        </p>
                    </div>
                )}
            </dialog>
        </>
    );
}
