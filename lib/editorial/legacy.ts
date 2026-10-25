import { safeEditorialUrl } from "./urls";

const HTML_BLOCK =
  /<(?:p|h[1-6]|ul|ol|li|blockquote|pre|code|table|thead|tbody|tfoot|tr|th|td|colgroup|col|figure|img|iframe|video|source|div|span|a|strong|b|em|i|u|s|strike|sub|sup|br)\b/i;

export function isEditorialHtml(value: string): boolean {
  return HTML_BLOCK.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inlineMarkdown(value: string): string {
  const tokens: string[] = [];
  const keep = (html: string) => {
    const index = tokens.push(html) - 1;
    return `\u0000${index}\u0000`;
  };

  let text = value
    .replace(/`([^`]+)`/g, (_match, code: string) =>
      keep(`<code>${escapeHtml(code)}</code>`),
    )
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
      const safe = safeEditorialUrl(href);
      if (!safe) return escapeHtml(label);
      const external = safe.startsWith("https://");
      return keep(
        `<a href="${escapeHtml(safe)}"${
          external ? ' target="_blank" rel="noopener noreferrer external"' : ""
        }>${escapeHtml(label)}</a>`,
      );
    });

  text = escapeHtml(text)
    .replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>")
    .replace(/(\*|_)(.+?)\1/g, "<em>$2</em>");

  return text.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => {
    return tokens[Number(index)] ?? "";
  });
}

/** Converts the previous Markdown subset to HTML when an old entry is edited. */
export function legacyMarkdownToHtml(source: string): string {
  if (!source.trim() || isEditorialHtml(source)) return source.trim();

  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const raw = lines[index];
    const line = raw.trim();
    if (!line) {
      index += 1;
      continue;
    }

    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line);
    if (image) {
      const src = safeEditorialUrl(image[2]);
      html.push(
        src
          ? `<p><img src="${escapeHtml(src)}" alt="${escapeHtml(image[1])}"></p>`
          : `<p>${escapeHtml(image[1] || "ছবি")}</p>`,
      );
      index += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quote.push(inlineMarkdown(lines[index].trim().replace(/^>\s?/, "")));
        index += 1;
      }
      html.push(`<blockquote>${quote.join("<br>")}</blockquote>`);
      continue;
    }

    const ordered = /^\d+[.)]\s+/.test(line);
    const unordered = /^[-*+]\s+/.test(line);
    if (ordered || unordered) {
      const items: string[] = [];
      const matcher = ordered ? /^\d+[.)]\s+(.+)$/ : /^[-*+]\s+(.+)$/;
      while (index < lines.length) {
        const item = matcher.exec(lines[index].trim());
        if (!item) break;
        items.push(`<li>${inlineMarkdown(item[1])}</li>`);
        index += 1;
      }
      const tag = ordered ? "ol" : "ul";
      html.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (!candidate) break;
      if (
        paragraph.length > 0 &&
        (/^(?:#{1,4}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/.test(candidate) ||
          /^!\[[^\]]*\]\([^)\s]+\)$/.test(candidate))
      ) {
        break;
      }
      paragraph.push(inlineMarkdown(candidate));
      index += 1;
    }
    html.push(`<p>${paragraph.join("<br>")}</p>`);
  }

  return html.join("");
}
