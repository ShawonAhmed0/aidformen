"use server";

import { revalidatePath } from "next/cache";

import { deleteImageByUrl } from "./media";
import {
  boolField,
  fail,
  guarded,
  hrefField,
  ok,
  optionalText,
  requiredText,
  requireAdmin,
} from "./shared";

function fieldsFrom(formData: FormData) {
  return {
    title: requiredText(formData, "title", "শিরোনাম", 200),
    title_en: optionalText(formData, "title_en", 200),
    thumbnail_url: optionalText(formData, "thumbnail_url", 500),
    // Rendered straight into an href by VideoCard, so it goes through the same
    // protocol check as every other stored link.
    video_url: hrefField(formData, "video_url"),
    // Free text rather than a number: the site displays these in Bengali
    // numerals (“১২:৪৫”, “২০২৩”), which no numeric type would preserve.
    duration: optionalText(formData, "duration", 20),
    year: optionalText(formData, "year", 20),
    is_published: boolField(formData, "is_published"),
  };
}

export async function createVideo(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const { data: last } = await auth.supabase
      .from("videos")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await auth.supabase.from("videos").insert({
      ...fieldsFrom(formData),
      sort_order: (last?.sort_order ?? 0) + 10,
    });

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function updateVideo(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);
    const next = fieldsFrom(formData);

    const { data: existing } = await auth.supabase
      .from("videos")
      .select("thumbnail_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase.from("videos").update(next).eq("id", id);
    if (error) return fail(error.message);

    if (existing?.thumbnail_url && existing.thumbnail_url !== next.thumbnail_url) {
      await deleteImageByUrl(existing.thumbnail_url);
    }

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function deleteVideo(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    const { data: row } = await auth.supabase
      .from("videos")
      .select("thumbnail_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase.from("videos").delete().eq("id", id);
    if (error) return fail(error.message);

    await deleteImageByUrl(row?.thumbnail_url);

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function reorderVideos(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (!ids.length) return ok();

    const results = await Promise.all(
      ids.map((id, index) =>
        auth.supabase
          .from("videos")
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

export async function toggleVideoPublished(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    const { error } = await auth.supabase
      .from("videos")
      .update({ is_published: boolField(formData, "is_published") })
      .eq("id", id);

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}
