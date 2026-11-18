/**
 * Row shapes for supabase/migrations/0003_forum.sql.
 */

import type { Locale } from "@/lib/i18n/config";

export const reactionKinds = ["like", "love", "haha", "angry", "shoe"] as const;
export type ReactionKind = (typeof reactionKinds)[number];

/** Emoji and label for each reaction, in the order they appear in the picker. */
export const reactionMeta: Record<
  ReactionKind,
  { emoji: string; label: Record<Locale, string> }
> = {
  like: { emoji: "👍", label: { bn: "লাইক", en: "Like" } },
  love: { emoji: "❤️", label: { bn: "ভালোবাসা", en: "Love" } },
  haha: { emoji: "😆", label: { bn: "হাহা", en: "Haha" } },
  angry: { emoji: "😡", label: { bn: "রাগ", en: "Angry" } },
  shoe: { emoji: "🥿", label: { bn: "জুতা", en: "Shoe" } },
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
