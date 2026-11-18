"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ContentsItem = { id: string; title: string };

/**
 * In-page contents with a scroll-spy: the entry for the section being read is
 * highlighted, and choosing one slides the page there.
 *
 * The slide itself is the global `scroll-behavior: smooth` (and its
 * reduced-motion opt-out) in globals.css acting on a plain anchor, so the
 * links still work, and still share, without JavaScript.
 */
export function ContentsNav({
    label,
    items,
    className,
}: {
    label: string;
    items: ContentsItem[];
    className?: string;
}) {
    const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
    // While a click's smooth scroll is under way, the sections it passes over
    // would each light up in turn; hold the chosen one until it lands.
    const lockedUntil = useRef(0);

    // A string, not the array: callers build `items` inline, and a new array
    // each render must not tear down and re-attach the scroll listener.
    const idsKey = items.map((item) => item.id).join("|");

    useEffect(() => {
        const ids = idsKey.split("|").filter(Boolean);
        let frame = 0;

        const update = () => {
            if (Date.now() < lockedUntil.current) return;

            // A section counts as "being read" once its heading has passed a
            // line a third of the way down the screen.
            const line = Math.max(120, window.innerHeight * 0.3);
            let current = ids[0] ?? null;

            for (const id of ids) {
                const target = document.getElementById(id);
                if (!target) continue;
                if (target.getBoundingClientRect().top <= line) current = id;
                else break;
            }

            // A short final section can never reach the line; at the very
            // bottom of the page it is the one on screen.
            const atBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 4;
            if (atBottom && ids.length > 0) {
                const last = document.getElementById(ids[ids.length - 1]);
                if (last && last.getBoundingClientRect().top < window.innerHeight) {
                    current = ids[ids.length - 1];
                }
            }

            setActive(current);
        };

        // Scroll events already arrive at most once a frame, and the work is a
        // handful of rect reads, so they run it directly. Deferring to
        // requestAnimationFrame made the highlight stall whenever the browser
        // paused frames (a hidden or resizing tab).
        const onScroll = () => update();

        frame = requestAnimationFrame(update);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [idsKey]);

    return (
        <nav aria-label={label} className={className}>
            <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                {label}
            </p>
            <ol className="mt-3 border-s border-ink-200">
                {items.map((item) => {
                    const isActive = item.id === active;
                    return (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                aria-current={isActive ? "location" : undefined}
                                onClick={() => {
                                    setActive(item.id);
                                    lockedUntil.current = Date.now() + 900;
                                }}
                                className={cn(
                                    "-ms-px flex min-h-10 items-center border-s-2 py-1.5 ps-3 text-sm leading-snug transition-ui",
                                    isActive
                                        ? "border-brand-700 font-semibold text-brand-900"
                                        : "border-transparent text-ink-600 hover:border-ink-300 hover:text-brand-800"
                                )}
                            >
                                {item.title}
                            </a>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
