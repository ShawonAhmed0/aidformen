import "server-only";

import sanitizeHtml from "sanitize-html";

import { safeEditorialUrl, safeVideoEmbedUrl } from "./urls";

const COLOR = /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\)|[a-z]{3,20})$/i;
const DIMENSION = /^(?:(?:\d{1,3}|1\d{3}|2000)(?:\.\d+)?px|(?:\d{1,2}(?:\.\d+)?|100(?:\.0+)?)%|(?:\d{1,2}(?:\.\d+)?|100(?:\.0+)?)(?:rem|em)|auto)$/i;
const SPACING = /^(?:0|auto|0 auto|(?:\d|1\d|20)(?:\.\d+)?(?:px|rem|em))$/i;
const BORDER_WIDTH = /^(?:0|(?:\d|10)(?:\.\d+)?(?:px|rem|em))$/i;

function safeDimensionAttribute(value: string | undefined, max = 2400) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const percentage = /^(\d{1,3}(?:\.\d+)?)%$/.exec(normalized);
  if (percentage) {
    const amount = Number(percentage[1]);
    return amount >= 0 && amount <= 100 ? normalized : null;
  }

  const absolute = /^(\d{1,5}(?:\.\d+)?)(?:px)?$/.exec(normalized);
  if (!absolute) return null;
  const amount = Number(absolute[1]);
  return amount >= 0 && amount <= max ? normalized : null;
}

function safePositiveInteger(value: string | undefined, max: number) {
  if (!value || !/^\d+$/.test(value)) return null;
  const amount = Number(value);
  return amount >= 1 && amount <= max ? String(amount) : null;
}

function cleanDimensions(
  attributes: Record<string, string>,
  names: readonly string[],
  max = 2400,
) {
  const cleaned = { ...attributes };
  for (const name of names) {
    const value = safeDimensionAttribute(cleaned[name], max);
    if (value) cleaned[name] = value;
    else delete cleaned[name];
  }
  return cleaned;
}

/**
 * Single server-side trust boundary for all archive rich text. The same
 * function is used immediately before persistence and immediately before
 * public HTML is mounted.
 */
export function sanitizeEditorialHtml(source: string): string {
  return sanitizeHtml(source, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "sub",
      "sup",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "span",
      "pre",
      "code",
      "img",
      "iframe",
      "video",
      "source",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "colgroup",
      "col",
    ],
    allowedAttributes: {
      "*": [
        "class",
        "style",
        "data-cell",
        "data-class",
        "data-row",
        "data-list",
      ],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "class", "style"],
      iframe: [
        "src",
        "title",
        "width",
        "height",
        "class",
        "style",
        "allow",
        "allowfullscreen",
        "loading",
        "referrerpolicy",
        "sandbox",
      ],
      video: ["src", "poster", "controls", "width", "height", "class", "style"],
      source: ["src", "type"],
      table: ["class", "style", "border", "cellspacing", "cellpadding"],
      th: ["class", "style", "rowspan", "colspan", "width", "height", "scope"],
      td: ["class", "style", "rowspan", "colspan", "width", "height"],
      col: ["style", "width", "span"],
      ol: ["start", "type", "class"],
      li: ["value", "class"],
    },
    allowedClasses: {
      "*": [
        /^ql-align-(?:center|right|justify)$/,
        /^ql-indent-[1-8]$/,
        /^ql-direction-rtl$/,
        /^ql-font-(?:serif|monospace)$/,
        /^ql-size-(?:small|large|huge)$/,
        /^ql-table-(?:better|block|header|temporary)$/,
        /^ql-resize-style-(?:left|center|right|full)$/,
        /^table-(?:list|list-container|th-block)$/,
        "ql-video",
      ],
    },
    allowedStyles: {
      "*": {
        color: [COLOR],
        "background-color": [COLOR],
        "font-size": [/^(?:12|14|16|18|24|32|40)px$/],
        "text-align": [/^(?:left|center|right|justify)$/],
      },
      table: {
        width: [DIMENSION],
        margin: [/^(?:0|0 auto|auto)$/],
        "margin-left": [/^(?:0|auto)$/],
        "margin-right": [/^(?:0|auto)$/],
        "border-style": [/^(?:none|solid|dashed|dotted|double)$/],
        "border-width": [BORDER_WIDTH],
        "border-color": [COLOR],
        "background-color": [COLOR],
      },
      td: {
        width: [DIMENSION],
        height: [DIMENSION],
        padding: [SPACING],
        color: [COLOR],
        "background-color": [COLOR],
        "border-style": [/^(?:none|solid|dashed|dotted|double)$/],
        "border-width": [BORDER_WIDTH],
        "border-color": [COLOR],
        "text-align": [/^(?:left|center|right|justify)$/],
        "vertical-align": [/^(?:top|middle|bottom)$/],
      },
      th: {
        width: [DIMENSION],
        height: [DIMENSION],
        padding: [SPACING],
        color: [COLOR],
        "background-color": [COLOR],
        "border-style": [/^(?:none|solid|dashed|dotted|double)$/],
        "border-width": [BORDER_WIDTH],
        "border-color": [COLOR],
        "text-align": [/^(?:left|center|right|justify)$/],
        "vertical-align": [/^(?:top|middle|bottom)$/],
      },
      col: { width: [DIMENSION] },
      img: { width: [DIMENSION], height: [DIMENSION] },
      iframe: { width: [DIMENSION], height: [DIMENSION] },
      video: { width: [DIMENSION], height: [DIMENSION] },
    },
    allowedSchemes: ["https"],
    allowedSchemesByTag: {
      a: ["https"],
      img: ["https"],
      iframe: ["https"],
      video: ["https"],
      source: ["https"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "www.youtube-nocookie.com",
      "player.vimeo.com",
    ],
    allowIframeRelativeUrls: false,
    allowProtocolRelative: false,
    nestingLimit: 30,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (_tagName, attributes) => {
        const href = safeEditorialUrl(attributes.href ?? "");
        const external = href?.startsWith("https://") ?? false;
        const attribs = { ...attributes };
        if (href) attribs.href = href;
        else delete attribs.href;
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            ...(external
              ? { target: "_blank", rel: "noopener noreferrer external" }
              : { target: "", rel: "" }),
          },
        };
      },
      img: (_tagName, attributes) => {
        const attribs = cleanDimensions(attributes, ["width", "height"]);
        const src = safeEditorialUrl(attribs.src ?? "");
        if (src) attribs.src = src;
        else delete attribs.src;
        return { tagName: "img", attribs };
      },
      iframe: (_tagName, attributes) => {
        const attribs = cleanDimensions(attributes, ["width", "height"]);
        const src = safeVideoEmbedUrl(attribs.src ?? "");
        if (src) attribs.src = src;
        else delete attribs.src;
        return {
          tagName: "iframe",
          attribs: {
            ...attribs,
            allow: "encrypted-media; picture-in-picture; fullscreen",
            loading: "lazy",
            referrerpolicy: "strict-origin-when-cross-origin",
            sandbox: "allow-scripts allow-same-origin allow-presentation",
            allowfullscreen: "",
          },
        };
      },
      video: (_tagName, attributes) => {
        const attribs = cleanDimensions(attributes, ["width", "height"]);
        const src = safeEditorialUrl(attribs.src ?? "");
        const poster = safeEditorialUrl(attribs.poster ?? "");
        if (src) attribs.src = src;
        else delete attribs.src;
        if (poster) attribs.poster = poster;
        else delete attribs.poster;
        attribs.controls = "";
        return { tagName: "video", attribs };
      },
      source: (_tagName, attributes) => {
        const attribs = { ...attributes };
        const src = safeEditorialUrl(attribs.src ?? "");
        if (src) attribs.src = src;
        else delete attribs.src;
        return { tagName: "source", attribs };
      },
      table: (_tagName, attributes) => {
        const attribs = { ...attributes };
        // The editor represents these properties in its validated style map;
        // dropping their legacy HTML aliases avoids extreme layout values.
        delete attribs.border;
        delete attribs.cellspacing;
        delete attribs.cellpadding;
        return { tagName: "table", attribs };
      },
      td: (_tagName, attributes) => {
        const attribs = cleanDimensions(attributes, ["width", "height"], 5000);
        const rowspan = safePositiveInteger(attribs.rowspan, 100);
        const colspan = safePositiveInteger(attribs.colspan, 100);
        if (rowspan) attribs.rowspan = rowspan;
        else delete attribs.rowspan;
        if (colspan) attribs.colspan = colspan;
        else delete attribs.colspan;
        return { tagName: "td", attribs };
      },
      th: (_tagName, attributes) => {
        const attribs = cleanDimensions(attributes, ["width", "height"], 5000);
        const rowspan = safePositiveInteger(attribs.rowspan, 100);
        const colspan = safePositiveInteger(attribs.colspan, 100);
        if (rowspan) attribs.rowspan = rowspan;
        else delete attribs.rowspan;
        if (colspan) attribs.colspan = colspan;
        else delete attribs.colspan;
        return { tagName: "th", attribs };
      },
      col: (_tagName, attributes) => {
        const attribs = cleanDimensions(attributes, ["width"], 5000);
        const span = safePositiveInteger(attribs.span, 100);
        if (span) attribs.span = span;
        else delete attribs.span;
        return { tagName: "col", attribs };
      },
    },
    exclusiveFilter: (frame) =>
      frame.tag === "iframe" && !frame.attribs.src,
  }).trim();
}

export function sanitizeOptionalEditorialHtml(source: string | null): string | null {
  if (!source) return null;
  return sanitizeEditorialHtml(source) || null;
}
