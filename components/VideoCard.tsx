import { Play } from "lucide-react";
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
    const meta = [duration && `${durationLabel}: ${duration}`, year]
        .filter(Boolean)
        .join(" • ");

    return (
        <a
            href={href}
            className="group flex flex-col rounded-xl"
            {...(isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
        >
            <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-200">
                {image && (
                    <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
                    />
                )}

                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-ink-950/35 transition-ui group-hover:bg-ink-950/20"
                />

                <div
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <span className="flex size-16 items-center justify-center rounded-full bg-white/95 shadow-md transition-transform duration-200 ease-standard group-hover:scale-105">
                        {/* Nudged right to optically centre the triangle. */}
                        <Play className="size-6 translate-x-px fill-brand-800 text-brand-800" />
                    </span>
                </div>
            </div>

            <h3 className="mt-4 text-lg text-brand-800">{title}</h3>

            {meta && <p className="mt-1.5 text-sm text-ink-500">{meta}</p>}
        </a>
    );
}
