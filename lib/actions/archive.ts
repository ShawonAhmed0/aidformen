"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  archiveContentTypes,
  archiveEventStatuses,
  archiveKinds,
  archiveSections,
  archiveSlugFromTitle,
  archiveSlugWithSequence,
  isArchiveSlug,
  MAX_ARCHIVE_PHOTOS,
} from "@/lib/types/archive";
import { deleteMediaByUrls } from "./media";
import {
  boolField,
  dateField,
  enumField,
  fail,
  guarded,
  hrefField,
  httpsUrlField,
  ok,
  optionalText,
  requiredText,
  requireAdmin,
  FieldError,
} from "./shared";

function slugField(title: string) {
  const slug = archiveSlugFromTitle(title);
  if (!isArchiveSlug(slug)) {
    throw new FieldError(
      "শিরোনাম থেকে একটি নিরাপদ ইউআরএল তৈরি করা যায়নি।"
    );
  }
  return slug;
}

function optionalEventStatus(formData: FormData) {
  const value = String(formData.get("event_status") ?? "");
  return (archiveEventStatuses as readonly string[]).includes(value)
    ? (value as (typeof archiveEventStatuses)[number])
    : null;
}

function secureMediaHref(formData: FormData, key: string, label: string) {
  const value = hrefField(formData, key);
  if (!value || (value.startsWith("/") && !value.startsWith("//"))) return value;
  if (value.startsWith("https://")) return value;
  throw new FieldError(`${label} অবশ্যই সাইটের path অথবা https:// লিঙ্ক হতে হবে।`);
}

function fieldsFrom(formData: FormData) {
  const heading = requiredText(formData, "heading", "শিরোনাম", 200);
  const headingEn = optionalText(formData, "heading_en", 200);

  return {
    // The server derives this independently instead of trusting a client URL.
    // Updates replace it with the stored slug so published links stay stable.
    slug: slugField(headingEn || heading),
    kind: enumField(formData, "kind", archiveKinds, "article"),
    section: enumField(
      formData,
      "section",
      archiveSections,
      "press_media"
    ),
    content_type: enumField(
      formData,
      "content_type",
      archiveContentTypes,
      "event"
    ),
    event_status: optionalEventStatus(formData),
    heading,
    heading_en: headingEn,
    body: optionalText(formData, "body", 20000, "বিবরণ"),
    body_en: optionalText(formData, "body_en", 20000, "ইংরেজি বিবরণ"),
    category: optionalText(formData, "category", 80),
    category_en: optionalText(formData, "category_en", 80),
    location: optionalText(formData, "location", 160),
    location_en: optionalText(formData, "location_en", 160),
    event_date: dateField(formData, "event_date"),
    // hrefField rather than urlField: an entry migrated from `activities` can
    // still point at a file in /public, which is a path and not a URL.
    cover_image_url: secureMediaHref(formData, "cover_image_url", "কভার ছবি"),
    video_url: httpsUrlField(formData, "video_url", "ভিডিওর লিঙ্ক"),
    video_file_url: httpsUrlField(formData, "video_file_url", "ভিডিও ফাইল"),
    notice_body: optionalText(formData, "notice_body", 12000, "ইভেন্ট নোটিশ"),
    notice_body_en: optionalText(
      formData,
      "notice_body_en",
      12000,
      "ইংরেজি ইভেন্ট নোটিশ"
    ),
    post_event_body: optionalText(
      formData,
      "post_event_body",
      12000,
      "ইভেন্ট-পরবর্তী সারসংক্ষেপ"
    ),
    post_event_body_en: optionalText(
      formData,
      "post_event_body_en",
      12000,
      "ইংরেজি ইভেন্ট-পরবর্তী সারসংক্ষেপ"
    ),
    press_release_body: optionalText(
      formData,
      "press_release_body",
      20000,
      "প্রেস রিলিজ"
    ),
    press_release_body_en: optionalText(
      formData,
      "press_release_body_en",
      20000,
      "ইংরেজি প্রেস রিলিজ"
    ),
    press_release_url: httpsUrlField(
      formData,
      "press_release_url",
      "প্রেস রিলিজ ফাইল"
    ),
    hd_photos_url: httpsUrlField(formData, "hd_photos_url", "HD ছবির ফোল্ডার"),
    raw_video_url: httpsUrlField(formData, "raw_video_url", "Raw ভিডিও ফোল্ডার"),
    audio_url: httpsUrlField(formData, "audio_url", "অডিও"),
    source_name: optionalText(formData, "source_name", 160),
    source_name_en: optionalText(formData, "source_name_en", 160),
    source_url: httpsUrlField(formData, "source_url", "মূল সংবাদ/উৎস"),
    is_published: boolField(formData, "is_published"),
  };
}

type PhotoInput = {
  image_url: string;
  caption: string | null;
  caption_en: string | null;
  sort_order: number;
};

type PublishableArchiveFields = Pick<
  ReturnType<typeof fieldsFrom>,
  | "is_published"
  | "kind"
  | "cover_image_url"
  | "video_url"
  | "video_file_url"
  | "audio_url"
>;

function validatePublishedEntry(fields: PublishableArchiveFields, photos: PhotoInput[]) {
  if (!fields.is_published) return;

  if (fields.kind === "photo" && photos.length === 0 && !fields.cover_image_url) {
    throw new FieldError("প্রকাশিত ছবির এন্ট্রিতে অন্তত একটি ছবি বা কভার দিন।");
  }
  if (fields.kind === "video" && !fields.video_url && !fields.video_file_url) {
    throw new FieldError("প্রকাশিত ভিডিও এন্ট্রিতে ভিডিও লিঙ্ক বা ফাইল দিন।");
  }
  if (fields.kind === "audio" && !fields.audio_url) {
    throw new FieldError("প্রকাশিত অডিও এন্ট্রিতে অডিও লিঙ্ক বা ফাইল দিন।");
  }
}

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
        (url.startsWith("/") && !url.startsWith("//")) ||
        (() => {
          try {
            const parsed = new URL(url);
            return parsed.protocol === "https:";
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
    validatePublishedEntry(fields, photos);

    const sortOrder = await nextSortOrder(auth.supabase);
    let entryId: string | null = null;

    // The unique database index is the final authority. Retrying the insert,
    // instead of checking first, also handles two admins creating the same
    // title concurrently without producing a duplicate public URL.
    for (let sequence = 1; sequence <= 100; sequence += 1) {
      const { data, error } = await auth.supabase
        .from("archive_entries")
        .insert({
          ...fields,
          slug: archiveSlugWithSequence(fields.slug, sequence),
          sort_order: sortOrder,
        })
        .select("id")
        .single();

      if (!error) {
        entryId = data.id as string;
        break;
      }
      if (error.code !== "23505") return fail(error.message);
    }

    if (!entryId) {
      return fail("একই শিরোনামের অনেক রেকর্ড আছে। শিরোনামটি একটু আলাদা করে আবার চেষ্টা করুন।");
    }

    const photoError = await replacePhotos(auth.supabase, entryId, photos);
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
    const submitted = fieldsFrom(formData);
    const photos = photosFrom(formData);

    const { data: existing, error: existingError } = await auth.supabase
      .from("archive_entries")
      .select("slug, cover_image_url, video_file_url, audio_url, press_release_url")
      .eq("id", id)
      .maybeSingle();

    if (existingError || !existing) {
      return fail(existingError?.message ?? "এন্ট্রিটি পাওয়া যায়নি।");
    }

    const next = { ...submitted, slug: existing.slug as string };
    validatePublishedEntry(next, photos);

    const { data: existingPhotos } = await auth.supabase
      .from("archive_media")
      .select("image_url")
      .eq("entry_id", id);

    const { error } = await auth.supabase
      .from("archive_entries")
      .update(next)
      .eq("id", id);

    if (error) {
      return fail(
        error.code === "23505"
          ? "এই ইউআরএল স্লাগটি ইতিমধ্যে ব্যবহার হয়েছে। অন্য একটি দিন।"
          : error.message
      );
    }

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
      existing?.audio_url !== next.audio_url
        ? (existing?.audio_url as string | undefined)
        : null,
      existing?.press_release_url !== next.press_release_url
        ? (existing?.press_release_url as string | undefined)
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
      .select("cover_image_url, video_file_url, audio_url, press_release_url")
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
      entry?.audio_url as string | undefined,
      entry?.press_release_url as string | undefined,
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
    const isPublished = boolField(formData, "is_published");

    if (isPublished) {
      const [{ data: entry, error: entryError }, { data: photoRows, error: photoError }] =
        await Promise.all([
          auth.supabase
            .from("archive_entries")
            .select(
              "kind, cover_image_url, video_url, video_file_url, audio_url"
            )
            .eq("id", id)
            .maybeSingle(),
          auth.supabase
            .from("archive_media")
            .select("image_url, caption, caption_en, sort_order")
            .eq("entry_id", id),
        ]);

      if (entryError || !entry) return fail(entryError?.message ?? "এন্ট্রিটি পাওয়া যায়নি।");
      if (photoError) return fail(photoError.message);

      validatePublishedEntry(
        { ...entry, is_published: true } as PublishableArchiveFields,
        ((photoRows as Omit<PhotoInput, "entry_id">[] | null) ?? []).map((photo) => ({
          ...photo,
        }))
      );
    }

    const { error } = await auth.supabase
      .from("archive_entries")
      .update({ is_published: isPublished })
      .eq("id", id);

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}
