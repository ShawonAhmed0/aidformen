import "server-only";

/**
 * The foundation's YouTube channel, read from its public upload feed.
 *
 * The Atom feed at /feeds/videos.xml needs no API key or quota and lists the
 * channel's 15 most recent uploads. It is fetched on the server and cached for
 * an hour, so a page view never waits on YouTube and the channel sees one
 * request an hour rather than one per visitor.
 *
 * The id is the channel's permanent UC… id; the @handle can be renamed, the
 * id cannot. Resolved from https://www.youtube.com/@AIDforMEN.
 */
export const youtubeChannel = {
  id: "UCT-h0SZCzed5jHC-Daw1RCQ",
  handle: "@AIDforMEN",
  url: "https://www.youtube.com/@AIDforMEN",
  videosUrl: "https://www.youtube.com/@AIDforMEN/videos",
  subscribeUrl: "https://www.youtube.com/@AIDforMEN?sub_confirmation=1",
} as const;

const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeChannel.id}`;
const REVALIDATE_SECONDS = 60 * 60;
/** The homepage must not hang on a slow YouTube; past this it falls back. */
const TIMEOUT_MS = 4000;

export type YouTubeVideo = {
  id: string;
  title: string;
  /** ISO timestamp of the upload. */
  publishedAt: string;
  views: number | null;
  /** Largest 16:9 thumbnail confirmed to exist for this video. */
  thumbnail: string;
  watchUrl: string;
  isShort: boolean;
};

/**
 * Video ids are interpolated into an iframe src and image URLs, so anything
 * that is not exactly the 11-character id shape is dropped rather than escaped.
 */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");
}

function tag(entry: string, name: string) {
  const match = entry.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return match ? decodeXml(match[1].trim()) : null;
}

/**
 * The feed's own thumbnail is the 4:3 `hqdefault`, letterboxed and only 480px
 * wide. `maxresdefault` is a sharp 1280×720 frame but is missing for videos
 * uploaded below 720p, and next/image fails loudly on a 404 — so check first.
 */
async function bestThumbnail(id: string) {
  const maxres = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  try {
    const response = await fetch(maxres, {
      method: "HEAD",
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) return maxres;
  } catch {
    // Fall through to the thumbnail every video has.
  }
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * The channel's latest uploads, newest first. Regular videos come before
 * Shorts — a vertical Short cropped into a 16:9 card loses most of its frame —
 * and Shorts only fill in when there aren't enough of the rest.
 *
 * Returns [] on any failure; the caller falls back to the admin-managed list.
 */
export async function getYouTubeUploads(limit: number): Promise<YouTubeVideo[]> {
  let xml: string;
  try {
    const response = await fetch(FEED_URL, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["youtube-uploads"] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`[youtube] feed returned ${response.status}`);
      return [];
    }
    xml = await response.text();
  } catch (error) {
    console.warn("[youtube] feed unavailable:", error);
    return [];
  }

  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const parsed = entries.flatMap((entry) => {
    const id = tag(entry, "yt:videoId");
    const title = tag(entry, "title");
    const publishedAt = tag(entry, "published");
    if (!id || !VIDEO_ID.test(id) || !title || !publishedAt) return [];

    const link = entry.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? "";
    const views = entry.match(/<media:statistics views="(\d+)"/)?.[1];

    return [
      {
        id,
        title,
        publishedAt,
        views: views ? Number(views) : null,
        isShort: link.includes("/shorts/"),
      },
    ];
  });

  const chosen = [
    ...parsed.filter((video) => !video.isShort),
    ...parsed.filter((video) => video.isShort),
  ].slice(0, limit);

  return Promise.all(
    chosen.map(async (video) => ({
      ...video,
      thumbnail: await bestThumbnail(video.id),
      watchUrl: video.isShort
        ? `https://www.youtube.com/shorts/${video.id}`
        : `https://www.youtube.com/watch?v=${video.id}`,
    }))
  );
}
