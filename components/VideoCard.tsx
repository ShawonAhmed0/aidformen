import { ArrowUpRight, CalendarDays, Clapperboard, Play } from "lucide-react";
import Image from "next/image";

export default function VideoCard({
    image,
    title,
    duration,
    year,
    href = "#",
    durationLabel,
}: {
    image: string | null;
    title: string;
    duration: string | null;
    year: string | null;
    href?: string;
    durationLabel: string;
}) {
    const isExternal = /^https?:\/\//.test(href);

    return (
        <a
            href={href}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-xs transition-ui hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md"
            {...(isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
        >
            <div className="relative aspect-video overflow-hidden bg-brand-900">
                {image ? (
                    <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
                    />
                ) : (
                    // No thumbnail yet: a branded frame instead of a grey box,
                    // so an unfinished entry still reads as deliberate.
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950"
                    >
                        <Clapperboard className="absolute -right-6 -bottom-8 size-40 text-white/6" />
                    </div>
                )}

                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-ink-950/25 transition-ui group-hover:bg-ink-950/10"
                />

                <div
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <span className="flex size-14 items-center justify-center rounded-full bg-white/95 shadow-lg ring-4 ring-white/20 transition-transform duration-200 ease-standard group-hover:scale-110">
                        {/* Nudged right to optically centre the triangle. */}
                        <Play className="size-5 translate-x-px fill-brand-800 text-brand-800" />
                    </span>
                </div>

                {duration && (
                    <span className="absolute right-3 bottom-3 rounded-md bg-ink-950/75 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
                        <span className="sr-only">{durationLabel}: </span>
                        {duration}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-2 text-lg leading-snug text-brand-800 transition-ui group-hover:text-brand-700">
                    {title}
                </h3>

                {(year || isExternal) && (
                    <p className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-ink-500">
                        {year ? (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-3.5" aria-hidden="true" />
                                {year}
                            </span>
                        ) : (
                            <span />
                        )}
                        {isExternal && (
                            <ArrowUpRight
                                className="size-4 text-ink-400 transition-ui group-hover:text-brand-700"
                                aria-hidden="true"
                            />
                        )}
                    </p>
                )}
            </div>
        </a>
    );
}
