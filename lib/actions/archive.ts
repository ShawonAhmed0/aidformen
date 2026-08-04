"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { archiveKinds, MAX_ARCHIVE_PHOTOS } from "@/lib/types/archive";
import { deleteMediaByUrls } from "./media";
import {
  boolField,
  dateField,
  enumField,
  fail,
  guarded,
  hrefField,
  ok,
  optionalText,
  requiredText,
  requireAdmin,
  urlField,
  FieldError,
} from "./shared";

function fieldsFrom(formData: FormData) {
  return {
    kind: enumField(formData, "kind", archiveKinds, "photo"),
    heading: requiredText(formData, "heading", "শিরোনাম", 200),
    heading_en: optionalText(formData, "heading_en", 200),
    body: optionalText(formData, "body", 4000, "বিবরণ"),
    body_en: optionalText(formData, "body_en", 4000, "ইংরেজি বিবরণ"),
    category: optionalText(formData, "category", 80),
    category_en: optionalText(formData, "category_en", 80),
    location: optionalText(formData, "location", 160),
    location_en: optionalText(formData, "location_en", 160),
    event_date: dateField(formData, "event_date"),
    // hrefField rather than urlField: an entry migrated from `activities` can
    // still point at a file in /public, which is a path and not a URL.
    cover_image_url: hrefField(formData, "cover_image_url"),
    video_url: urlField(formData, "video_url", "ভিডিওর লিঙ্ক"),
    video_file_url: urlField(formData, "video_file_url", "ভিডিও ফাইল"),
    is_published: boolField(formData, "is_published"),
  };
}

type PhotoInput = {
  image_url: string;
  caption: string | null;
  caption_en: string | null;
  sort_order: number;
};

/**
 * Reads the gallery, sent as parallel `photo_url` / `photo_caption` /
 * `photo_caption_en` fields already uploaded by the client.
 *
 * Each URL is re-validated here even though the client produced it: this action
 * is reachable with any payload, and these strings end up in an image `src`.
 */
function photosFrom(formData: FormData): PhotoInput[] {
  const urls = formData.getAll("photo_url").map(String);
  const captions = formData.getAll("photo_caption").map(String);
  const captionsEn = formData.getAll("photo_caption_en").map(String);

  if (urls.length > MAX_ARCHIVE_PHOTOS) {
    throw new FieldError(
      `একটি আর্কাইভে সর্বোচ্চ ${MAX_ARCHIVE_PHOTOS}টি ছবি দেওয়া যাবে।`
    );
  }

  return urls
    .map((raw, index) => {
      const url = raw.trim();
      if (!url) return null;

      const allowed =
        url.startsWith("/") ||
        (() => {
          try {
            const parsed = new URL(url);
            return parsed.protocol === "http:" || parsed.protocol === "https:";
          } catch {
            return false;
          }
        })();

      if (!allowed) throw new FieldError("ছবির ঠিকানা সঠিক নয়।");

      return {
        image_url: url,
        caption: captions[index]?.trim() || null,
        caption_en: captionsEn[index]?.trim() || null,
        sort_order: (index + 1) * 10,
      };
    })
    .filter((p): p is PhotoInput => p !== null);
}

async function replacePhotos(
  supabase: SupabaseClient,
  entryId: string,
  photos: PhotoInput[]
) {
  const { error: clearError } = await supabase
    .from("archive_media")
    .delete()
    .eq("entry_id", entryId);

  if (clearError) return clearError.message;

  if (photos.length === 0) return null;

  const { error } = await supabase
    .from("archive_media")
    .insert(photos.map((p) => ({ ...p, entry_id: entryId })));

  return error?.message ?? null;
}

/** Appends to the end of the list — ordering is a single sequence here. */
async function nextSortOrder(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("archive_entries")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data?.sort_order as number | undefined) ?? 0) + 10;
}

export async function createArchiveEntry(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const fields = fieldsFrom(formData);
    const photos = photosFrom(formData);

    const { data, error } = await auth.supabase
      .from("archive_entries")
      .insert({ ...fields, sort_order: await nextSortOrder(auth.supabase) })
      .select("id")
      .single();

    if (error) return fail(error.message);

    const photoError = await replacePhotos(auth.supabase, data.id as string, photos);
    if (photoError) return fail(photoError);

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function updateArchiveEntry(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);
    const next = fieldsFrom(formData);
    const photos = photosFrom(formData);

    const { data: existing } = await auth.supabase
      .from("archive_entries")
      .select("cover_image_url, video_file_url")
      .eq("id", id)
      .maybeSingle();

    const { data: existingPhotos } = await auth.supabase
      .from("archive_media")
      .select("image_url")
      .eq("entry_id", id);

    const { error } = await auth.supabase
      .from("archive_entries")
      .update(next)
      .eq("id", id);

    if (error) return fail(error.message);

    const photoError = await replacePhotos(auth.supabase, id, photos);
    if (photoError) return fail(photoError);

    // Storage cleanup last, and only for files this entry no longer refers to.
    // A failed cleanup leaves an orphaned object, which is far cheaper than
    // deleting a file the saved row still points at.
    const keptPhotos = new Set(photos.map((p) => p.image_url));
    const droppedPhotos = ((existingPhotos as { image_url: string }[] | null) ?? [])
      .map((p) => p.image_url)
      .filter((url) => !keptPhotos.has(url));

    await deleteMediaByUrls([
      ...droppedPhotos,
      existing?.cover_image_url !== next.cover_image_url
        ? (existing?.cover_image_url as string | undefined)
        : null,
      existing?.video_file_url !== next.video_file_url
        ? (existing?.video_file_url as string | undefined)
        : null,
    ]);

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function deleteArchiveEntry(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    // Read the media before the row goes: archive_media cascades away with the
    // entry, and after that there is nothing left to tell us what to clean up.
    const { data: entry } = await auth.supabase
      .from("archive_entries")
      .select("cover_image_url, video_file_url")
      .eq("id", id)
      .maybeSingle();

    const { data: photos } = await auth.supabase
      .from("archive_media")
      .select("image_url")
      .eq("entry_id", id);

    const { error } = await auth.supabase.from("archive_entries").delete().eq("id", id);
    if (error) return fail(error.message);

    await deleteMediaByUrls([
      ...((photos as { image_url: string }[] | null) ?? []).map((p) => p.image_url),
      entry?.cover_image_url as string | undefined,
      entry?.video_file_url as string | undefined,
    ]);

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function reorderArchiveEntries(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (!ids.length) return ok();

    const results = await Promise.all(
      ids.map((id, index) =>
        auth.supabase
          .from("archive_entries")
          .update({ sort_order: (index + 1) * 10 })
          .eq("id", id)
      )
    );

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) return fail(firstError.message);

    revalidatePath("/", "layout");
    return ok();
  });
}

/** Quick publish/unpublish from the list without opening the editor. */
export async function toggleArchivePublished(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    const { error } = await auth.supabase
      .from("archive_entries")
      .update({ is_published: boolField(formData, "is_published") })
      .eq("id", id);

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}
