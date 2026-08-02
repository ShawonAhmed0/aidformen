import { Fragment } from "react";

/**
 * A deliberately tiny Markdown renderer for chat bubbles.
 *
 * The system prompt asks for conversational prose, but a model will still reach
 * for `**bold**`, a `#` heading or a `-` list now and then, and rendering the
 * reply as plain text showed visitors the raw asterisks. This covers only what
 * the assistant actually emits — headings, bullets, numbered lists, bold,
 * italic and inline code — which is far less than a Markdown dependency and
 * enough to stop the syntax leaking through.
 *
 * Everything is built as React nodes, never `dangerouslySetInnerHTML`, so a
 * reply that contains HTML is shown as text rather than mounted.
 */

// Inline spans are matched in one pass so the earliest opener wins and `**a**`
// is never mistaken for two italics.
const INLINE = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`/g;

function inline(text: string, keyPrefix: string) {
    const nodes: React.ReactNode[] = [];
    let last = 0;

    for (const m of text.matchAll(INLINE)) {
        const at = m.index;
        if (at > last) nodes.push(text.slice(last, at));

        const key = `${keyPrefix}-${at}`;
        if (m[2] !== undefined) {
            nodes.push(<strong key={key}>{m[2]}</strong>);
        } else if (m[4] !== undefined) {
            nodes.push(<em key={key}>{m[4]}</em>);
        } else {
            nodes.push(
                <code key={key} className="rounded bg-ink-200 px-1 py-0.5 text-2xs">
                    {m[5]}
                </code>
            );
        }

        last = at + m[0].length;
    }

    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
}

type Block =
    | { kind: "p"; lines: string[] }
    | { kind: "h"; text: string }
    | { kind: "ul" | "ol"; items: string[] };

function parse(source: string): Block[] {
    const blocks: Block[] = [];

    for (const raw of source.split("\n")) {
        const line = raw.trim();
        const previous = blocks[blocks.length - 1];

        // A blank line ends whatever was open; the next line starts fresh.
        if (!line) {
            if (previous?.kind === "p") blocks.push({ kind: "p", lines: [] });
            continue;
        }

        const heading = /^#{1,6}\s+(.*)$/.exec(line);
        if (heading) {
            blocks.push({ kind: "h", text: heading[1] });
            continue;
        }

        const bullet = /^[-*+]\s+(.*)$/.exec(line);
        if (bullet) {
            if (previous?.kind === "ul") previous.items.push(bullet[1]);
            else blocks.push({ kind: "ul", items: [bullet[1]] });
            continue;
        }

        const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
        if (numbered) {
            if (previous?.kind === "ol") previous.items.push(numbered[1]);
            else blocks.push({ kind: "ol", items: [numbered[1]] });
            continue;
        }

        // Wrapped prose keeps its single newlines, which the bubble renders as
        // line breaks — the model uses them to separate thoughts.
        if (previous?.kind === "p") previous.lines.push(line);
        else blocks.push({ kind: "p", lines: [line] });
    }

    return blocks.filter((b) => b.kind !== "p" || b.lines.length > 0);
}

export function ChatMarkdown({ content }: { content: string }) {
    const blocks = parse(content);

    return (
        <>
            {blocks.map((block, i) => {
                if (block.kind === "h") {
                    // Rendered as emphasis rather than a real heading: these are
                    // mid-conversation labels, not document structure, and they
                    // would otherwise land in the page's heading outline.
                    return (
                        <p key={i} className="mt-3 font-semibold text-ink-800 first:mt-0">
                            {inline(block.text, `h${i}`)}
                        </p>
                    );
                }

                if (block.kind === "p") {
                    return (
                        <p key={i} className="mt-2 first:mt-0">
                            {block.lines.map((line, j) => (
                                <Fragment key={j}>
                                    {j > 0 && <br />}
                                    {inline(line, `p${i}-${j}`)}
                                </Fragment>
                            ))}
                        </p>
                    );
                }

                const List = block.kind === "ul" ? "ul" : "ol";
                return (
                    <List
                        key={i}
                        className={
                            block.kind === "ul"
                                ? "mt-2 list-disc space-y-1 ps-5 first:mt-0"
                                : "mt-2 list-decimal space-y-1 ps-5 first:mt-0"
                        }
                    >
                        {block.items.map((item, j) => (
                            <li key={j}>{inline(item, `l${i}-${j}`)}</li>
                        ))}
                    </List>
                );
            })}
        </>
    );
}
