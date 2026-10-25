/** URLs accepted inside editorial copy. */
export function safeEditorialUrl(value: string): string | null {
  const trimmed = value.trim();
  if (/^\/(?![\\/])[^\u0000-\u001f\u007f\\]*$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Turns common YouTube/Vimeo share links into the HTTPS player URLs Quill's
 * video blot expects. Keeping the host list small also makes the public iframe
 * allow-list meaningful.
 */
export function safeVideoEmbedUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (hostname === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return validVideoId(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : null;
  }

  if (
    hostname === "youtube.com" ||
    hostname === "m.youtube.com" ||
    hostname === "youtube-nocookie.com"
  ) {
    const segments = url.pathname.split("/").filter(Boolean);
    const id =
      url.pathname === "/watch"
        ? url.searchParams.get("v")
        : segments[0] === "embed" || segments[0] === "shorts"
          ? segments[1]
          : null;
    return validVideoId(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : null;
  }

  if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).findLast((part) => /^\d+$/.test(part));
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}

function validVideoId(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{6,20}$/.test(value);
}
