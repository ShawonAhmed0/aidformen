import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  ForumComment,
  ForumMedia,
  ForumPost,
  MemberProfile,
  MemberStatus,
  ReactionKind,
} from "@/lib/types/forum";

/**
 * Read side of the forum.
 *
 * Row level security does the access control: an unapproved member's queries
 * come back empty rather than forbidden, so these helpers only need to render
 * that as "nothing to show". `getViewerStatus` is what the pages use to tell
 * "no posts yet" apart from "you are not approved yet".
 */

function warn(scope: string, error: { message: string } | null) {
  if (error) console.warn(`[forum] ${scope}: ${error.message}`);
}

export type ViewerStatus = {
  userId: string | null;
  status: MemberStatus | null;
  isAdmin: boolean;
  /** Approved members and admins may read and write the forum. */
  canParticipate: boolean;
};

export const getViewerStatus = cache(async (): Promise<ViewerStatus> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, status: null, isAdmin: false, canParticipate: false };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("status, role")
    .eq("id", user.id)
    .maybeSingle();

  warn("viewer", error);

  const isAdmin = profile?.role === "admin";
  const status = (profile?.status as MemberStatus | undefined) ?? "pending";

  return {
    userId: user.id,
    status,
    isAdmin,
    canParticipate: isAdmin || status === "approved",
  };
});

const POST_SELECT = `
  id, author_id, title, body, is_removed, created_at, updated_at,
  author:profiles!forum_posts_author_id_fkey (id, full_name, avatar_url),
  media:forum_post_media (id, post_id, url, kind, sort_order),
  reactions:forum_reactions (user_id, kind),
  comments:forum_comments (id)
`;

type RawPost = {
  id: string;
  author_id: string;
  title: string;
  body: string | null;
  is_removed: boolean;
  created_at: string;
  updated_at: string | null;
  author: { id: string; full_name: string | null; avatar_url: string | null } | null;
  media: ForumMedia[] | null;
  reactions: { user_id: string; kind: ReactionKind }[] | null;
  comments: { id: string }[] | null;
};

/**
 * Collapses the joined reaction rows into a tally plus the viewer's own pick.
 *
 * Done here rather than in SQL because the row set per post is small and a
 * view would need a second query to work out `myReaction` anyway.
 */
function shapePost(row: RawPost, viewerId: string | null): ForumPost {
  const reactions: Partial<Record<ReactionKind, number>> = {};
  let myReaction: ReactionKind | null = null;

  for (const r of row.reactions ?? []) {
    reactions[r.kind] = (reactions[r.kind] ?? 0) + 1;
    if (viewerId && r.user_id === viewerId) myReaction = r.kind;
  }

  return {
    id: row.id,
    author_id: row.author_id,
    title: row.title,
    body: row.body,
    is_removed: row.is_removed,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.author,
    media: [...(row.media ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    reactions,
    myReaction,
    commentCount: row.comments?.length ?? 0,
  };
}

export const getForumFeed = cache(async (limit = 30): Promise<ForumPost[]> => {
  const supabase = await createClient();
  const viewer = await getViewerStatus();

  const { data, error } = await supabase
    .from("forum_posts")
    .select(POST_SELECT)
    .eq("is_removed", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  warn("feed", error);

  return ((data ?? []) as unknown as RawPost[]).map((row) =>
    shapePost(row, viewer.userId)
  );
});

export const getForumPost = cache(async (id: string): Promise<ForumPost | null> => {
  const supabase = await createClient();
  const viewer = await getViewerStatus();

  const { data, error } = await supabase
    .from("forum_posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();

  warn("post", error);
  if (!data) return null;

  return shapePost(data as unknown as RawPost, viewer.userId);
});

type RawComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  is_removed: boolean;
  created_at: string;
  author: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

/** Flat rows in, one level of nesting out. */
export const getPostComments = cache(
  async (postId: string): Promise<ForumComment[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("forum_comments")
      .select(
        `id, post_id, parent_id, author_id, body, is_removed, created_at,
         author:profiles!forum_comments_author_id_fkey (id, full_name, avatar_url)`
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    warn("comments", error);

    const rows = (data ?? []) as unknown as RawComment[];
    const byId = new Map<string, ForumComment>();
    const roots: ForumComment[] = [];

    for (const row of rows) {
      byId.set(row.id, { ...row, author: row.author, replies: [] });
    }

    for (const row of rows) {
      const node = byId.get(row.id)!;
      const parent = row.parent_id ? byId.get(row.parent_id) : null;
      // A reply whose parent was hard-deleted is promoted to a root rather
      // than vanishing with it.
      if (parent) parent.replies.push(node);
      else roots.push(node);
    }

    return roots;
  }
);

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const getMembers = cache(
  async (status?: MemberStatus): Promise<MemberProfile[]> => {
    const supabase = await createClient();

    let query = supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url, role, status, approved_at, created_at")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    warn("members", error);
    return (data as MemberProfile[] | null) ?? [];
  }
);
