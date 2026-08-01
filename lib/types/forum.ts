/**
 * Row shapes for supabase/migrations/0003_forum.sql.
 */

export const reactionKinds = ["like", "love", "haha", "angry", "shoe"] as const;
export type ReactionKind = (typeof reactionKinds)[number];

/** Emoji and label for each reaction, in the order they appear in the picker. */
export const reactionMeta: Record<ReactionKind, { emoji: string; label: string }> = {
  like: { emoji: "👍", label: "লাইক" },
  love: { emoji: "❤️", label: "ভালোবাসা" },
  haha: { emoji: "😆", label: "হাহা" },
  angry: { emoji: "😡", label: "রাগ" },
  shoe: { emoji: "🥿", label: "জুতা" },
};

export const memberStatuses = ["pending", "approved", "rejected"] as const;
export type MemberStatus = (typeof memberStatuses)[number];

export type ForumAuthor = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type MediaKind = "image" | "video" | "embed";

export type ForumMedia = {
  id: string;
  post_id: string;
  url: string;
  kind: MediaKind;
  sort_order: number;
};

export type ForumPost = {
  id: string;
  author_id: string;
  title: string;
  body: string | null;
  is_removed: boolean;
  created_at: string;
  updated_at: string | null;
  author: ForumAuthor | null;
  media: ForumMedia[];
  /** Tally per reaction kind. Kinds nobody picked are omitted. */
  reactions: Partial<Record<ReactionKind, number>>;
  /** The signed-in member's own reaction, if any. */
  myReaction: ReactionKind | null;
  commentCount: number;
};

export type ForumComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  is_removed: boolean;
  created_at: string;
  author: ForumAuthor | null;
  replies: ForumComment[];
};

export type MemberProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  status: MemberStatus;
  approved_at: string | null;
  created_at: string | null;
};

/**
 * Turns a YouTube or Facebook watch URL into its embed form.
 *
 * Returns null for anything unrecognised, so a pasted link is only ever
 * rendered in an iframe when we know the shape of it — an arbitrary URL in a
 * frame would let a member embed anything at all.
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
