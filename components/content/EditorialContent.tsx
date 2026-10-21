import Image from "next/image";
import { Fragment, type ReactNode } from "react";

import { safeHttpsUrl, safeMediaUrl } from "@/lib/types/archive";
import { cn } from "@/lib/utils";

type Block =
    | { kind: "paragraph"; lines: string[] }
    | { kind: "heading"; level: 2 | 3; text: string }
    | { kind: "quote"; lines: string[] }
    | { kind: "list"; ordered: boolean; items: string[] }
    | { kind: "image"; alt: string; url: string };

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const INLINE =
    /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

function safeEditorialLink(value: string): string | null {
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    return safeHttpsUrl(value);
}

function inline(text: string, keyPrefix: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    let last = 0;

    for (const match of text.matchAll(INLINE)) {
        const at = match.index;
        if (at > last) nodes.push(text.slice(last, at));

        const key = `${keyPrefix}-${at}`;
        if (match[2] !== undefined) {
            nodes.push(<strong key={key}>{match[2]}</strong>);
        } else if (match[4] !== undefined) {
            nodes.push(<em key={key}>{match[4]}</em>);
        } else if (match[5] !== undefined) {
            nodes.push(
                <code
                    key={key}
                    className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[0.9em] text-ink-800"
                >
                    {match[5]}
                </code>
            );
        } else {
            const href = safeEditorialLink(match[7]);
            nodes.push(
                href ? (
                    <a
                        key={key}
                        href={href}
                        target={href.startsWith("/") ? undefined : "_blank"}
                        rel={href.startsWith("/") ? undefined : "noopener noreferrer external"}
                        className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-4 hover:text-brand-900"
                    >
                        {match[6]}
                    </a>
                ) : (
                    <Fragment key={key}>{match[6]}</Fragment>
                )
            );
        }

        last = at + match[0].length;
    }

    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
}

function parse(source: string): Block[] {
    const blocks: Block[] = [];

    for (const rawLine of source.replace(/\r\n?/g, "\n").split("\n")) {
        const line = rawLine.trim();
        const previous = blocks[blocks.length - 1];

        if (!line) {
            // A blank line ends the current prose, quote or list block.
            if (
                previous?.kind === "paragraph" ||
                previous?.kind === "quote" ||
                previous?.kind === "list"
            ) {
                blocks.push({ kind: "paragraph", lines: [] });
            }
            continue;
        }

        const image = IMAGE_LINE.exec(line);
        if (image) {
            const url = safeMediaUrl(image[2]);
            if (url) blocks.push({ kind: "image", alt: image[1], url });
            else blocks.push({ kind: "paragraph", lines: [image[1] || "ছবি"] });
            continue;
        }

        const heading = /^(#{2,3})\s+(.+)$/.exec(line);
        if (heading) {
            blocks.push({
                kind: "heading",
                level: heading[1].length as 2 | 3,
                text: heading[2],
            });
            continue;
        }

        const quote = /^>\s?(.*)$/.exec(line);
        if (quote) {
            if (previous?.kind === "quote") previous.lines.push(quote[1]);
            else blocks.push({ kind: "quote", lines: [quote[1]] });
            continue;
        }

        const bullet = /^[-*+]\s+(.+)$/.exec(line);
        if (bullet) {
            if (previous?.kind === "list" && !previous.ordered) {
                previous.items.push(bullet[1]);
            } else {
                blocks.push({ kind: "list", ordered: false, items: [bullet[1]] });
            }
            continue;
        }

        const numbered = /^\d+[.)]\s+(.+)$/.exec(line);
        if (numbered) {
            if (previous?.kind === "list" && previous.ordered) {
                previous.items.push(numbered[1]);
            } else {
                blocks.push({ kind: "list", ordered: true, items: [numbered[1]] });
            }
            continue;
        }

        if (previous?.kind === "paragraph" && previous.lines.length > 0) {
            previous.lines.push(line);
        } else {
            blocks.push({ kind: "paragraph", lines: [line] });
        }
    }

    return blocks.filter(
        (block) => block.kind !== "paragraph" || block.lines.length > 0
    );
}

/**
 * Safe, intentionally small renderer for editorial copy.
 *
 * It supports only the controls offered by EditorialTextField. HTML is never
 * parsed or mounted, and URLs are allow-listed before becoming links/media.
 */
export function EditorialContent({
    content,
    className,
}: {
    content: string;
    className?: string;
}) {
    const blocks = parse(content);

    return (
        <div className={cn("space-y-5 text-base leading-8 text-ink-700 sm:text-lg", className)}>
            {blocks.map((block, index) => {
                if (block.kind === "heading") {
                    const styles = "font-serif font-semibold leading-tight text-ink-950";
                    return block.level === 2 ? (
                        <h2 key={index} className={cn(styles, "pt-3 text-2xl sm:text-3xl")}>
                            {inline(block.text, `h${index}`)}
                        </h2>
                    ) : (
                        <h3 key={index} className={cn(styles, "pt-2 text-xl sm:text-2xl")}>
                            {inline(block.text, `h${index}`)}
                        </h3>
                    );
                }

                if (block.kind === "paragraph") {
                    return (
                        <p key={index}>
                            {block.lines.map((line, lineIndex) => (
                                <Fragment key={lineIndex}>
                                    {lineIndex > 0 && <br />}
                                    {inline(line, `p${index}-${lineIndex}`)}
                                </Fragment>
                            ))}
                        </p>
                    );
                }

                if (block.kind === "quote") {
                    return (
                        <blockquote
                            key={index}
                            className="border-s-4 border-brand-300 bg-brand-50/70 px-5 py-4 font-serif text-lg italic text-ink-800 sm:text-xl"
                        >
                            {block.lines.map((line, lineIndex) => (
                                <Fragment key={lineIndex}>
                                    {lineIndex > 0 && <br />}
                                    {inline(line, `q${index}-${lineIndex}`)}
                                </Fragment>
                            ))}
                        </blockquote>
                    );
                }

                if (block.kind === "list") {
                    const List = block.ordered ? "ol" : "ul";
                    return (
                        <List
                            key={index}
                            className={cn(
                                "space-y-2 ps-6 marker:font-semibold marker:text-brand-700",
                                block.ordered ? "list-decimal" : "list-disc"
                            )}
                        >
                            {block.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="ps-1">
                                    {inline(item, `l${index}-${itemIndex}`)}
                                </li>
                            ))}
                        </List>
                    );
                }

                return (
                    <figure
                        key={index}
                        data-print-keep
                        className="mx-auto w-full max-w-2xl py-2 text-center"
                    >
                        <Image
                            src={block.url}
                            alt={block.alt}
                            width={1280}
                            height={853}
                            sizes="(max-width: 768px) 100vw, 672px"
                            unoptimized
                            className="mx-auto h-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
                        />
                        {block.alt && (
                            <figcaption className="mt-3 text-sm leading-6 text-ink-500">
                                {block.alt}
                            </figcaption>
                        )}
                    </figure>
                );
            })}
        </div>
    );
}

/** Plain copy for metadata, search excerpts and card summaries. */
export function editorialPlainText(source: string): string {
    return source
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^>\s?/gm, "")
        .replace(/^[-*+]\s+/gm, "")
        .replace(/^\d+[.)]\s+/gm, "")
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}
