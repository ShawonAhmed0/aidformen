/**
 * Turns a YouTube or Facebook watch URL into its embed form.
 *
 * Returns null for anything unrecognised, so a pasted link is only ever
 * rendered in an iframe when we know the shape of it — an arbitrary URL in a
 * frame would let whoever stored it embed anything at all.
 *
 * Lives here rather than beside one feature's types: the forum and the archive
 * both frame admin- or member-supplied links, and an allowlist this
 * load-bearing must not exist in two copies that can drift apart.
 */
export function toEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (url.pathname.startsWith("/shorts/")) {
      const id = url.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (url.pathname.startsWith("/embed/")) return url.toString();
  }

  if (host === "facebook.com" || host === "fb.watch") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      url.toString()
    )}&show_text=false`;
  }

  return null;
}
