"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Crop, Loader2, Minus, Plus, RotateCcw, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAdminLocale } from "./AdminLocale";

const copy = {
    bn: {
        title: "ছবি ঠিক করুন",
        hint: "টেনে সরান, স্লাইডার, মাউসের চাকা বা দুই আঙুল দিয়ে বড়-ছোট করুন।",
        frameLabel:
            "ছবির ফ্রেম। তীরচিহ্ন দিয়ে সরান, + ও − দিয়ে বড়-ছোট করুন, ০ চাপলে শুরুর অবস্থায় ফিরবে।",
        shape: "আকার",
        zoom: "জুম",
        zoomIn: "বড় করুন",
        zoomOut: "ছোট করুন",
        reset: "আগের মতো",
        cancel: "বাতিল",
        useOriginal: "যেমন আছে তেমন রাখুন",
        apply: "এভাবে রাখুন",
        working: "তৈরি হচ্ছে…",
        loadFailed: "ছবিটি খোলা যায়নি।",
        close: "বন্ধ করুন",
        aspects: {
            wide: "১৬:৯ · পোস্টের কভার",
            standard: "৩:২ · কার্ড ও গ্যালারি",
            classic: "৪:৩",
            square: "১:১ · বর্গ",
            original: "আসল আকার",
        },
    },
    en: {
        title: "Adjust image",
        hint: "Drag to position. Zoom with the slider, the mouse wheel or two fingers.",
        frameLabel:
            "Image frame. Move with the arrow keys, zoom with + and −, press 0 to reset.",
        shape: "Shape",
        zoom: "Zoom",
        zoomIn: "Zoom in",
        zoomOut: "Zoom out",
        reset: "Reset",
        cancel: "Cancel",
        useOriginal: "Keep as it is",
        apply: "Use this crop",
        working: "Preparing…",
        loadFailed: "Couldn't open this image.",
        close: "Close",
        aspects: {
            wide: "16:9 · Post cover",
            standard: "3:2 · Cards & gallery",
            classic: "4:3",
            square: "1:1 · Square",
            original: "Original shape",
        },
    },
};

export type AspectId = "wide" | "standard" | "classic" | "square" | "original";

const ASPECTS: { id: AspectId; ratio: number | null }[] = [
    { id: "wide", ratio: 16 / 9 },
    { id: "standard", ratio: 3 / 2 },
    { id: "classic", ratio: 4 / 3 },
    { id: "square", ratio: 1 },
    { id: "original", ratio: null },
];

const MAX_ZOOM = 5;
/** Long edge of the cropped file; the uploader shrinks and re-encodes from here. */
const MAX_OUTPUT_EDGE = 3000;

type Point = { x: number; y: number };

/**
 * Crop an image by dragging it inside a fixed frame and zooming.
 *
 * The result is a new, cropped file — not stored crop numbers — so the post
 * page, cards, social previews and downloads all show the same framing
 * without each needing to apply a crop. The editor uploads it like any photo.
 *
 * `source` opens the dialog: a freshly picked File, or the URL of an image
 * already on the post (fetched into a blob so the canvas isn't tainted).
 */
export function ImageCropDialog({
    source,
    aspect = "wide",
    onClose,
    onApply,
    onUseOriginal,
}: {
    source: File | string | null;
    aspect?: AspectId;
    /** Every way the dialog closes ends here — clear `source` in it. */
    onClose: () => void;
    onApply: (file: File) => void;
    /** Shown for a new upload only: keep the photo exactly as picked. */
    onUseOriginal?: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (source && dialog && !dialog.open) dialog.showModal();
    }, [source]);

    // A new picture remounts the editor, so it starts centred and unzoomed.
    const key =
        typeof source === "string"
            ? source
            : source
              ? `${source.name}:${source.size}:${source.lastModified}`
              : "none";

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            aria-labelledby="crop-title"
            className="m-auto w-[calc(100%-1.5rem)] max-w-3xl rounded-2xl bg-surface p-0 text-foreground shadow-2xl backdrop:bg-ink-950/70"
        >
            {source && (
                <CropEditor
                    key={key}
                    source={source}
                    aspect={aspect}
                    close={() => dialogRef.current?.close()}
                    onApply={onApply}
                    onUseOriginal={onUseOriginal}
                />
            )}
        </dialog>
    );
}

function CropEditor({
    source,
    aspect,
    close,
    onApply,
    onUseOriginal,
}: {
    source: File | string;
    aspect: AspectId;
    close: () => void;
    onApply: (file: File) => void;
    onUseOriginal?: () => void;
}) {
    const t = copy[useAdminLocale()];
    const frameRef = useRef<HTMLDivElement>(null);
    const pointers = useRef(new Map<number, Point>());
    const pinch = useRef<{ distance: number; zoom: number } | null>(null);

    const [url, setUrl] = useState<string | null>(null);
    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
    const [failed, setFailed] = useState(false);
    const [shape, setShape] = useState<AspectId>(aspect);
    const [frame, setFrame] = useState({ w: 0, h: 0 });
    const [zoom, setZoom] = useState(1);
    // Which point of the image (0–1 across, 0–1 down) sits at the frame's
    // centre. Kept relative so a resized frame keeps the same framing.
    const [center, setCenter] = useState<Point>({ x: 0.5, y: 0.5 });
    const [working, setWorking] = useState(false);

    const fileName =
        typeof source === "string" ? (source.split("/").pop()?.split("?")[0] ?? "image") : source.name;

    // A same-origin blob URL, so drawing it onto a canvas is allowed.
    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;
        (async () => {
            try {
                const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [source]);

    const ratio =
        ASPECTS.find((a) => a.id === shape)?.ratio ?? (natural ? natural.w / natural.h : 16 / 9);

    useLayoutEffect(() => {
        const el = frameRef.current;
        if (!el) return;
        const observer = new ResizeObserver(() => setFrame({ w: el.clientWidth, h: el.clientHeight }));
        observer.observe(el);
        return () => observer.disconnect();
    }, [failed]);

    const W = natural?.w ?? 1;
    const H = natural?.h ?? 1;
    const base = frame.w ? Math.max(frame.w / W, frame.h / H) : 1;
    const scale = base * zoom;

    /** Keeps the frame covered at scale `s`: the image may never leave an empty edge. */
    const clampCenter = (c: Point, s = scale): Point => {
        const halfX = Math.min(0.5, frame.w / 2 / (W * s));
        const halfY = Math.min(0.5, frame.h / 2 / (H * s));
        return {
            x: Math.min(1 - halfX, Math.max(halfX, c.x)),
            y: Math.min(1 - halfY, Math.max(halfY, c.y)),
        };
    };

    const shownCenter = clampCenter(center);
    const offset = {
        x: frame.w / 2 - shownCenter.x * W * scale,
        y: frame.h / 2 - shownCenter.y * H * scale,
    };

    /** Zoom about a point in the frame, so what is under it stays under it. */
    const zoomTo = (next: number, at: Point = { x: frame.w / 2, y: frame.h / 2 }) => {
        if (!natural || !frame.w) return;
        const z = Math.min(MAX_ZOOM, Math.max(1, next));
        const s2 = base * z;
        const imageX = (at.x - offset.x) / scale;
        const imageY = (at.y - offset.y) / scale;
        const nextOffset = { x: at.x - imageX * s2, y: at.y - imageY * s2 };
        setZoom(z);
        setCenter(
            clampCenter(
                {
                    x: (frame.w / 2 - nextOffset.x) / (W * s2),
                    y: (frame.h / 2 - nextOffset.y) / (H * s2),
                },
                s2
            )
        );
    };

    const pan = (dx: number, dy: number) =>
        setCenter((c) => clampCenter({ x: c.x - dx / (W * scale), y: c.y - dy / (H * scale) }));

    const resetView = () => {
        setZoom(1);
        setCenter({ x: 0.5, y: 0.5 });
    };

    const local = (event: { clientX: number; clientY: number }): Point => {
        const rect = frameRef.current!.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onPointerDown = (event: React.PointerEvent) => {
        frameRef.current?.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
        }
    };

    const onPointerMove = (event: React.PointerEvent) => {
        const previous = pointers.current.get(event.pointerId);
        if (!previous) return;
        const current = { x: event.clientX, y: event.clientY };
        pointers.current.set(event.pointerId, current);

        if (pointers.current.size === 2 && pinch.current) {
            const [a, b] = [...pointers.current.values()];
            const distance = Math.hypot(a.x - b.x, a.y - b.y);
            zoomTo(
                pinch.current.zoom * (distance / pinch.current.distance),
                local({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 })
            );
            return;
        }
        pan(current.x - previous.x, current.y - previous.y);
    };

    const onPointerUp = (event: React.PointerEvent) => {
        pointers.current.delete(event.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
    };

    // React's wheel listener is passive, so it can't stop the page scrolling.
    useEffect(() => {
        const el = frameRef.current;
        if (!el) return;
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            zoomTo(zoom * Math.exp(-event.deltaY * 0.0015), local(event));
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    });

    const onKeyDown = (event: React.KeyboardEvent) => {
        const step = event.shiftKey ? 40 : 10;
        const moves: Record<string, Point> = {
            ArrowLeft: { x: step, y: 0 },
            ArrowRight: { x: -step, y: 0 },
            ArrowUp: { x: 0, y: step },
            ArrowDown: { x: 0, y: -step },
        };
        if (moves[event.key]) {
            event.preventDefault();
            pan(moves[event.key].x, moves[event.key].y);
        } else if (event.key === "+" || event.key === "=") {
            event.preventDefault();
            zoomTo(zoom * 1.15);
        } else if (event.key === "-") {
            event.preventDefault();
            zoomTo(zoom / 1.15);
        } else if (event.key === "0") {
            event.preventDefault();
            resetView();
        }
    };

    const apply = async () => {
        if (!natural || !url || !frame.w) return;
        setWorking(true);
        try {
            const image = new Image();
            image.src = url;
            await image.decode();
            const crop = {
                x: -offset.x / scale,
                y: -offset.y / scale,
                w: frame.w / scale,
                h: frame.h / scale,
            };
            const out = Math.min(1, MAX_OUTPUT_EDGE / Math.max(crop.w, crop.h));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(crop.w * out);
            canvas.height = Math.round(crop.h * out);
            const context = canvas.getContext("2d")!;
            // JPEG has no transparency: without white underneath, a PNG's
            // transparent areas would come out black.
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.imageSmoothingQuality = "high";
            context.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/jpeg", 0.92)
            );
            if (!blob) throw new Error("encode");
            const name = `${fileName.replace(/\.[^.]+$/, "")}-crop.jpg`;
            onApply(new File([blob], name, { type: "image/jpeg" }));
            close();
        } catch {
            setFailed(true);
        } finally {
            setWorking(false);
        }
    };

    return (
        <div className="flex max-h-[92dvh] flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-ink-200 px-5 py-4">
                <div>
                    <h2 id="crop-title" className="flex items-center gap-2 text-base font-semibold text-ink-900">
                        <Crop className="size-4.5 text-brand-700" aria-hidden="true" />
                        {t.title}
                    </h2>
                    <p className="mt-1 text-sm text-ink-500">{t.hint}</p>
                </div>
                <button
                    type="button"
                    onClick={close}
                    aria-label={t.close}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-ui hover:bg-ink-100 hover:text-ink-900"
                >
                    <X className="size-5" aria-hidden="true" />
                </button>
            </div>

            <div className="overflow-y-auto">
                <div className="bg-ink-950 px-3 py-4 sm:px-6">
                    {failed ? (
                        <p className="py-16 text-center text-sm text-white/80">{t.loadFailed}</p>
                    ) : (
                        <div
                            ref={frameRef}
                            role="application"
                            tabIndex={0}
                            aria-label={t.frameLabel}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                            onKeyDown={onKeyDown}
                            className="relative mx-auto cursor-grab touch-none select-none overflow-hidden rounded-lg bg-ink-900 active:cursor-grabbing"
                            style={{ aspectRatio: ratio, width: `min(100%, calc(58dvh * ${ratio}))` }}
                        >
                            {url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={url}
                                    alt=""
                                    draggable={false}
                                    onLoad={(event) =>
                                        setNatural({
                                            w: event.currentTarget.naturalWidth,
                                            h: event.currentTarget.naturalHeight,
                                        })
                                    }
                                    className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
                                    style={{
                                        width: natural && frame.w ? W * scale : undefined,
                                        height: natural && frame.w ? H * scale : undefined,
                                        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                                        visibility: natural ? "visible" : "hidden",
                                    }}
                                />
                            ) : (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="size-6 animate-spin text-white/70" aria-hidden="true" />
                                </span>
                            )}
                            {/* Rule of thirds, to place faces and text deliberately. */}
                            <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                                <span className="absolute inset-y-0 left-1/3 w-px bg-white/35" />
                                <span className="absolute inset-y-0 left-2/3 w-px bg-white/35" />
                                <span className="absolute inset-x-0 top-1/3 h-px bg-white/35" />
                                <span className="absolute inset-x-0 top-2/3 h-px bg-white/35" />
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-4 px-5 py-4">
                    <fieldset>
                        <legend className="text-sm font-medium text-ink-700">{t.shape}</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {ASPECTS.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    aria-pressed={shape === a.id}
                                    onClick={() => setShape(a.id)}
                                    className={cn(
                                        "inline-flex h-10 items-center rounded-full px-3.5 text-sm font-medium transition-ui",
                                        shape === a.id
                                            ? "bg-brand-800 text-white"
                                            : "bg-surface-sunken text-ink-700 hover:bg-brand-50 hover:text-brand-800"
                                    )}
                                >
                                    {t.aspects[a.id]}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <div className="flex items-center gap-3">
                        <span className="w-12 text-sm font-medium text-ink-700">{t.zoom}</span>
                        <button
                            type="button"
                            onClick={() => zoomTo(zoom / 1.2)}
                            disabled={zoom <= 1}
                            aria-label={t.zoomOut}
                            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-ink-200 text-ink-700 transition-ui hover:bg-ink-50 disabled:opacity-40"
                        >
                            <Minus className="size-4" aria-hidden="true" />
                        </button>
                        <input
                            type="range"
                            min={1}
                            max={MAX_ZOOM}
                            step={0.01}
                            value={zoom}
                            onChange={(event) => zoomTo(Number(event.target.value))}
                            aria-label={t.zoom}
                            className="h-10 min-w-0 flex-1 accent-brand-700"
                        />
                        <button
                            type="button"
                            onClick={() => zoomTo(zoom * 1.2)}
                            disabled={zoom >= MAX_ZOOM}
                            aria-label={t.zoomIn}
                            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-ink-200 text-ink-700 transition-ui hover:bg-ink-50 disabled:opacity-40"
                        >
                            <Plus className="size-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={resetView}
                            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-600 transition-ui hover:bg-ink-100"
                        >
                            <RotateCcw className="size-4" aria-hidden="true" />
                            <span className="hidden sm:inline">{t.reset}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 px-5 py-3">
                <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium text-ink-700 transition-ui hover:bg-ink-100"
                >
                    {t.cancel}
                </button>
                {onUseOriginal && (
                    <button
                        type="button"
                        onClick={() => {
                            onUseOriginal();
                            close();
                        }}
                        className="inline-flex h-11 items-center rounded-lg border border-ink-300 px-4 text-sm font-medium text-ink-800 transition-ui hover:bg-ink-50"
                    >
                        {t.useOriginal}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => void apply()}
                    disabled={!natural || working || failed}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-800 px-5 text-sm font-semibold text-white transition-ui hover:bg-brand-700 disabled:opacity-50"
                >
                    {working ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Crop className="size-4" aria-hidden="true" />}
                    {working ? t.working : t.apply}
                </button>
            </div>
        </div>
    );
}
