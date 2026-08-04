import Image from "next/image";

import { toEmbedUrl } from "@/lib/embed";
import type { ForumMedia } from "@/lib/types/forum";

/**
 * Renders a post's attachments.
 *
 * Embeds go through toEmbedUrl, which only recognises YouTube and Facebook —
 * anything else is skipped rather than framed, so a member cannot get an
 * arbitrary origin into an iframe on the page.
 */
export function PostMedia({ media }: { media: ForumMedia[] }) {
    if (!media.length) return null;

    return (
        <ul
            className={
                media.length === 1
                    ? "mt-4 space-y-3"
                    : "mt-4 grid gap-3 sm:grid-cols-2"
            }
        >
            {media.map((item) => {
                if (item.kind === "image") {
                    return (
                        <li
                            key={item.id}
                            className="relative aspect-video overflow-hidden rounded-xl bg-ink-100"
                        >
                            <Image
                                src={item.url}
                                alt=""
                                fill
                                unoptimized
                                sizes="(min-width: 640px) 50vw, 100vw"
                                className="object-cover"
                            />
                        </li>
                    );
                }

                if (item.kind === "video") {
                    return (
                        <li
                            key={item.id}
                            className="overflow-hidden rounded-xl bg-ink-950"
                        >
                            <video
                                src={item.url}
                                controls
                                preload="metadata"
                                playsInline
                                className="aspect-video w-full"
                            />
                        </li>
                    );
                }

                const embed = toEmbedUrl(item.url);
                if (!embed) return null;

                return (
                    <li key={item.id} className="overflow-hidden rounded-xl bg-ink-950">
                        <iframe
                            src={embed}
                            title="Video"
                            loading="lazy"
                            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                            className="aspect-video w-full border-0"
                        />
                    </li>
                );
            })}
        </ul>
    );
}
