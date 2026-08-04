"use server";

import { revalidatePath } from "next/cache";

import { toEmbedUrl } from "@/lib/embed";
import { reactionKinds, type MediaKind } from "@/lib/types/forum";
import {
  enumField,
  fail,
  guarded,
  ok,
  optionalText,
  requireAdmin,
  requiredText,
  requireApprovedMember,
} from "./shared";

const BUCKET = "forum";

// Images stay small; video is the reason this bucket exists, but 50 MB is the
// per-file ceiling on Supabase's free tier, so there is no point accepting more.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Both the Bengali and English forum pages need rebuilding after a write. */
function revalidateForum() {
  revalidatePath("/", "layout");
}

function extensionFor(type: string, name: string) {
  const fromName = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (/^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return type.split("/")[1] ?? "bin";
}

/**
 * Uploads one image or video for a forum post.
 *
 * Unlike lib/actions/media.ts this is open to any approved member, not just
 * admins — which is exactly why the type and size checks here are the ones
 * that matter. The client checks too, but only for speed of feedback.
 */
export async function uploadForumMedia(formData: FormData) {
  return guarded(async () => {
    const auth = await requireApprovedMember();
    if (!auth.ok) return fail(auth.error);

    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return fail("কোনো ফাইল নির্বাচন করা হয়নি।");
    }

    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return fail("শুধু ছবি (JPG, PNG, WEBP, GIF) বা ভিডিও (MP4, WEBM) দেওয়া যাবে।");
    }

    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      return fail(
        isVideo
          ? "ভিডিওর আকার ৫০ মেগাবাইটের কম হতে হবে।"
          : "ছবির আকার ৫ মেগাবাইটের কম হতে হবে।"
      );
    }

    // Namespaced by uploader so one member cannot overwrite another's file.
    const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const path = `${auth.userId}/${unique}.${extensionFor(file.type, file.name)}`;

    const { error: uploadError } = await auth.supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "31536000", upsert: false });

    if (uploadError) return fail(`আপলোড ব্যর্থ: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = auth.supabase.storage.from(BUCKET).getPublicUrl(path);

    const kind: MediaKind = isVideo ? "video" : "image";
    return ok({ url: publicUrl, kind });
  });
}

/**
 * Creates a post and its attachments.
 *
 * Media arrives as parallel `media_url` / `media_kind` fields already uploaded
 * by the client, plus optional `embed_url` values pasted as links.
 */
export async function createForumPost(formData: FormData) {
  return guarded(async () => {
    const auth = await requireApprovedMember();
    if (!auth.ok) return fail(auth.error);

    const title = requiredText(formData, "title", "শিরোনাম", 300);
    const body = optionalText(formData, "body", 10000);

    const urls = formData.getAll("media_url").map(String);
    const kinds = formData.getAll("media_kind").map(String);
    const embeds = formData
      .getAll("embed_url")
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean);

    // Reject an unrecognised link here rather than storing something that will
    // silently fail to render later.
    for (const embed of embeds) {
      if (!toEmbedUrl(embed)) {
        return fail(`এই লিঙ্কটি সমর্থিত নয়: ${embed}। ইউটিউব বা ফেসবুক ভিডিওর লিঙ্ক দিন।`);
      }
    }

    const { data: post, error } = await auth.supabase
      .from("forum_posts")
      .insert({ author_id: auth.userId, title, body })
      .select("id")
      .single();

    if (error || !post) return fail(error?.message ?? "পোস্ট তৈরি করা যায়নি।");

    const attachments = [
      ...urls.map((url, i) => ({
        post_id: post.id,
        url,
        kind: (kinds[i] === "video" ? "video" : "image") as MediaKind,
        sort_order: i * 10,
      })),
      ...embeds.map((url, i) => ({
        post_id: post.id,
        url,
        kind: "embed" as MediaKind,
        sort_order: (urls.length + i) * 10,
      })),
    ];

    if (attachments.length) {
      const { error: mediaError } = await auth.supabase
        .from("forum_post_media")
        .insert(attachments);

      // The post itself is already saved; losing an attachment should not
      // discard the member's writing.
      if (mediaError) {
        console.warn("[forum] attachments failed:", mediaError.message);
      }
    }

    revalidateForum();
    return ok({ id: post.id as string });
  });
}

export async function deleteForumPost(formData: FormData) {
  return guarded(async () => {
    const auth = await requireApprovedMember();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    // RLS already restricts this to the author or an admin; the delete simply
    // matches nothing for anyone else.
    const { error } = await auth.supabase.from("forum_posts").delete().eq("id", id);
    if (error) return fail(error.message);

    revalidateForum();
    return ok();
  });
}

export async function createForumComment(formData: FormData) {
  return guarded(async () => {
    const auth = await requireApprovedMember();
    if (!auth.ok) return fail(auth.error);

    const postId = requiredText(formData, "post_id", "পোস্ট", 64);
    const body = requiredText(formData, "body", "মন্তব্য", 5000);
    const parentId = (formData.get("parent_id") as string | null)?.trim() || null;

    const { error } = await auth.supabase.from("forum_comments").insert({
      post_id: postId,
      parent_id: parentId,
      author_id: auth.userId,
      body,
    });

    if (error) return fail(error.message);

    revalidateForum();
    return ok();
  });
}

export async function deleteForumComment(formData: FormData) {
  return guarded(async () => {
    const auth = await requireApprovedMember();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    const { error } = await auth.supabase.from("forum_comments").delete().eq("id", id);
    if (error) return fail(error.message);

    revalidateForum();
    return ok();
  });
}

/**
 * Sets, switches or clears the member's reaction to a post.
 *
 * The table's primary key is (post_id, user_id), so switching is an upsert and
 * picking the same reaction twice clears it — matching how the button behaves.
 */
export async function setForumReaction(formData: FormData) {
  return guarded(async () => {
    const auth = await requireApprovedMember();
    if (!auth.ok) return fail(auth.error);

    const postId = requiredText(formData, "post_id", "পোস্ট", 64);
    const clear = (formData.get("clear") as string | null) === "true";

    if (clear) {
      const { error } = await auth.supabase
        .from("forum_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", auth.userId);

      if (error) return fail(error.message);
      revalidateForum();
      return ok();
    }

    const kind = enumField(formData, "kind", reactionKinds, "like");

    const { error } = await auth.supabase
      .from("forum_reactions")
      .upsert({ post_id: postId, user_id: auth.userId, kind });

    if (error) return fail(error.message);

    revalidateForum();
    return ok();
  });
}

// ---------------------------------------------------------------------------
// Moderation / membership
// ---------------------------------------------------------------------------

export async function setMemberStatus(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);
    const status = enumField(
      formData,
      "status",
      ["pending", "approved", "rejected"] as const,
      "pending"
    );

    const {
      data: { user },
    } = await auth.supabase.auth.getUser();

    const { error } = await auth.supabase
      .from("profiles")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        approved_by: status === "approved" ? user?.id ?? null : null,
      })
      .eq("id", id);

    if (error) return fail(error.message);

    revalidateForum();
    return ok();
  });
}
