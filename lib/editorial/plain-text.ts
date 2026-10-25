const ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const hexadecimal = code[1]?.toLowerCase() === "x";
      const parsed = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(parsed) && parsed > 0 && parsed <= 0x10ffff
        ? String.fromCodePoint(parsed)
        : entity;
    }
    return ENTITIES[code.toLowerCase()] ?? entity;
  });
}

/** Client-safe plain copy for metadata, search excerpts and card summaries. */
export function editorialPlainText(source: string): string {
  return decodeEntities(
    source
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<img\b[^>]*>/gi, (tag) => {
        const alt = /\balt\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2];
        return alt ? ` ${alt} ` : " ";
      })
      .replace(
        /<(?:br|\/p|\/div|\/h[1-6]|\/li|\/blockquote|\/t[dh]|\/tr)>/gi,
        " ",
      )
      .replace(/<[^>]+>/g, " ")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+[.)]\s+/gm, "")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/`([^`]+)`/g, "$1"),
  )
    .replace(/\s+/g, " ")
    .trim();
}
