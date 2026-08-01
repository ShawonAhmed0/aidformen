"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Move, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

type FocalPointPickerProps = {
    url: string;
    x: number;
    y: number;
    onChange: (x: number, y: number) => void;
    /** Shape of the container the photo will actually be cropped to. */
    aspect?: "video" | "wide" | "card";
    label?: string;
    helper?: string;
};

const aspects = {
    video: "aspect-video",
    wide: "aspect-3/1",
    card: "aspect-4/3",
} as const;

/**
 * Chooses which part of a photo survives the crop.
 *
 * Nothing is done to the file: the picked point is stored as percentages and
 * applied as object-position at render. That means framing stays adjustable
 * forever and works on photos uploaded before this existed — a destructive
 * crop would have forced a re-upload to change your mind.
 *
 * The preview crops to the same aspect the live site uses, so what you line up
 * here is what visitors get.
 */
export function FocalPointPicker({
    url,
    x,
    y,
    onChange,
    aspect = "card",
    label = "ছবির অবস্থান",
    helper = "মুখ বা গুরুত্বপূর্ণ অংশে ক্লিক করুন বা টেনে আনুন — কার্ডে ঐ অংশটিই থাকবে।",
}: FocalPointPickerProps) {
    const boxRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);

    const applyFromEvent = (clientX: number, clientY: number) => {
        const box = boxRef.current?.getBoundingClientRect();
        if (!box) return;

        const nx = Math.round(((clientX - box.left) / box.width) * 100);
        const ny = Math.round(((clientY - box.top) / box.height) * 100);
        onChange(Math.min(100, Math.max(0, nx)), Math.min(100, Math.max(0, ny)));
    };

    // Keyboard support: the picker is a real control, not a mouse-only toy.
    const nudge = (event: React.KeyboardEvent) => {
        const step = event.shiftKey ? 10 : 2;
        const moves: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step],
        };
        const move = moves[event.key];
        if (!move) return;

        event.preventDefault();
        onChange(
            Math.min(100, Math.max(0, x + move[0])),
            Math.min(100, Math.max(0, y + move[1]))
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink-700">{label}</span>
                <button
                    type="button"
                    onClick={() => onChange(50, 50)}
                    className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    মাঝখানে
                </button>
            </div>

            <div
                ref={boxRef}
                role="slider"
                tabIndex={0}
                aria-label={label}
                aria-valuetext={`অনুভূমিক ${x}%, উল্লম্ব ${y}%`}
                aria-valuenow={y}
                aria-valuemin={0}
                aria-valuemax={100}
                onKeyDown={nudge}
                onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDragging(true);
                    applyFromEvent(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                    if (dragging) applyFromEvent(e.clientX, e.clientY);
                }}
                onPointerUp={(e) => {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    setDragging(false);
                }}
                className={cn(
                    "relative cursor-crosshair touch-none overflow-hidden rounded-xl border border-ink-300 bg-ink-100 select-none",
                    aspects[aspect],
                    dragging && "border-brand-600"
                )}
            >
                <Image
                    src={url}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 480px, 100vw"
                    className="pointer-events-none object-cover"
                    style={{ objectPosition: `${x}% ${y}%` }}
                />

                {/* Crosshair sits where the chosen point lands in the cropped
                    frame, which is not the same as its position in the original
                    once the image overflows — so it is drawn at the point the
                    crop keeps centred, clamped into view. */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-brand-800/70 text-white shadow-lg"
                    style={{ left: `${x}%`, top: `${y}%` }}
                >
                    <Move className="size-4" />
                </span>
            </div>

            <p className="text-xs text-ink-500">{helper}</p>
        </div>
    );
}
