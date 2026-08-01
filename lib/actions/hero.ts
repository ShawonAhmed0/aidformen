"use server";

import { revalidatePath } from "next/cache";

import { deleteImageByUrl } from "./media";
import {
  boolField,
  clampPercent,
  fail,
  guarded,
  hrefField,
  intField,
  ok,
  optionalText,
  requiredText,
  requireAdmin,
} from "./shared";

/** Both the Bengali and English homepages need rebuilding after any edit. */
function revalidateSite() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Hero content (singleton)
// ---------------------------------------------------------------------------

export async function updateHeroContent(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const payload = {
      title: requiredText(formData, "title", "শিরোনাম", 200),
      description: optionalText(formData, "description", 800),
      eyebrow: optionalText(formData, "eyebrow", 80),
      primary_cta_label: optionalText(formData, "primary_cta_label", 80),
      primary_cta_href: hrefField(formData, "primary_cta_href"),
      secondary_cta_label: optionalText(formData, "secondary_cta_label", 80),
      secondary_cta_href: hrefField(formData, "secondary_cta_href"),
      title_en: optionalText(formData, "title_en", 200),
      description_en: optionalText(formData, "description_en", 800),
      eyebrow_en: optionalText(formData, "eyebrow_en", 80),
      primary_cta_label_en: optionalText(formData, "primary_cta_label_en", 80),
      secondary_cta_label_en: optionalText(formData, "secondary_cta_label_en", 80),
    };

    const id = (formData.get("id") as string | null)?.trim();

    // The table is a singleton but has a uuid key, so update by the id we were
    // given and insert only when there is genuinely no row yet. The previous
    // implementation matched `.eq("id", 1)` against a uuid column, which could
    // never match — that is why saving silently did nothing.
    if (id) {
      const { error } = await auth.supabase
        .from("hero_content")
        .update(payload)
        .eq("id", id);

      if (error) return fail(error.message);
    } else {
      const { error } = await auth.supabase.from("hero_content").insert(payload);
      if (error) return fail(error.message);
    }

    revalidateSite();
    return ok();
  });
}

// ---------------------------------------------------------------------------
// Carousel slides
// ---------------------------------------------------------------------------

export async function createCarouselImage(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const imageUrl = (formData.get("image_url") as string | null)?.trim();
    if (!imageUrl) return fail("স্লাইডের জন্য একটি ছবি আপলোড করুন।");

    // Append to the end of the current order.
    const { data: last } = await auth.supabase
      .from("carousel_images")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await auth.supabase.from("carousel_images").insert({
      image_url: imageUrl,
      title: optionalText(formData, "title", 200),
      subtitle: optionalText(formData, "subtitle", 300),
      alt_text: optionalText(formData, "alt_text", 300),
      title_en: optionalText(formData, "title_en", 200),
      subtitle_en: optionalText(formData, "subtitle_en", 300),
      alt_text_en: optionalText(formData, "alt_text_en", 300),
      is_published: boolField(formData, "is_published"),
      focal_x: clampPercent(intField(formData, "focal_x", 50)),
      focal_y: clampPercent(intField(formData, "focal_y", 50)),
      sort_order: (last?.sort_order ?? 0) + 10,
    });

    if (error) return fail(error.message);

    revalidateSite();
    return ok();
  });
}

export async function updateCarouselImage(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);
    const imageUrl = (formData.get("image_url") as string | null)?.trim();
    if (!imageUrl) return fail("স্লাইডের জন্য একটি ছবি প্রয়োজন।");

    const { error } = await auth.supabase
      .from("carousel_images")
      .update({
        image_url: imageUrl,
        title: optionalText(formData, "title", 200),
        subtitle: optionalText(formData, "subtitle", 300),
        alt_text: optionalText(formData, "alt_text", 300),
        title_en: optionalText(formData, "title_en", 200),
        subtitle_en: optionalText(formData, "subtitle_en", 300),
        alt_text_en: optionalText(formData, "alt_text_en", 300),
        is_published: boolField(formData, "is_published"),
        focal_x: clampPercent(intField(formData, "focal_x", 50)),
        focal_y: clampPercent(intField(formData, "focal_y", 50)),
      })
      .eq("id", id);

    if (error) return fail(error.message);

    revalidateSite();
    return ok();
  });
}

export async function deleteCarouselImage(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    const { data: row } = await auth.supabase
      .from("carousel_images")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase
      .from("carousel_images")
      .delete()
      .eq("id", id);

    if (error) return fail(error.message);

    // Remove the orphaned file only after the row is gone, so a storage
    // failure can never leave a record pointing at a deleted image.
    await deleteImageByUrl(row?.image_url);

    revalidateSite();
    return ok();
  });
}

/** Persists a whole reordered list in one call. */
export async function reorderCarouselImages(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (!ids.length) return ok();

    const results = await Promise.all(
      ids.map((id, index) =>
        auth.supabase
          .from("carousel_images")
          .update({ sort_order: (index + 1) * 10 })
          .eq("id", id)
      )
    );

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) return fail(firstError.message);

    revalidateSite();
    return ok();
  });
}

/** Quick publish/unpublish from the list without opening the editor. */
export async function toggleCarouselPublished(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    const { error } = await auth.supabase
      .from("carousel_images")
      .update({ is_published: boolField(formData, "is_published") })
      .eq("id", id);

    if (error) return fail(error.message);

    revalidateSite();
    return ok();
  });
}
