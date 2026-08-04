"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { activityPlacements } from "@/lib/types/content";
import { deleteImageByUrl } from "./media";
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
} from "./shared";

function fieldsFrom(formData: FormData) {
  return {
    placement: enumField(formData, "placement", activityPlacements, "secondary"),
    title: requiredText(formData, "title", "শিরোনাম", 200),
    title_en: optionalText(formData, "title_en", 200),
    category: optionalText(formData, "category", 80),
    category_en: optionalText(formData, "category_en", 80),
    excerpt: optionalText(formData, "excerpt", 800),
    excerpt_en: optionalText(formData, "excerpt_en", 800),
    location: optionalText(formData, "location", 160),
    location_en: optionalText(formData, "location_en", 160),
    action_label: optionalText(formData, "action_label", 60),
    action_label_en: optionalText(formData, "action_label_en", 60),
    image_url: optionalText(formData, "image_url", 500),
    event_date: dateField(formData, "event_date"),
    href: hrefField(formData, "href"),
    is_published: boolField(formData, "is_published"),
  };
}

/**
 * Appends to the end of the given placement rather than the table as a whole —
 * ordering is scoped per placement everywhere it is read.
 */
async function nextSortOrder(supabase: SupabaseClient, placement: string) {
  const { data } = await supabase
    .from("activities")
    .select("sort_order")
    .eq("placement", placement)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data?.sort_order as number | undefined) ?? 0) + 10;
}

export async function createActivity(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const fields = fieldsFrom(formData);

    const { error } = await auth.supabase.from("activities").insert({
      ...fields,
      sort_order: await nextSortOrder(auth.supabase, fields.placement),
    });

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function updateActivity(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);
    const next = fieldsFrom(formData);

    const { data: existing } = await auth.supabase
      .from("activities")
      .select("image_url, placement")
      .eq("id", id)
      .maybeSingle();

    // Moving between placements drops the row into an order slot that may
    // already be taken, so give it a fresh one at the end of its new group.
    const moved = existing && existing.placement !== next.placement;

    const { error } = await auth.supabase
      .from("activities")
      .update(
        moved
          ? { ...next, sort_order: await nextSortOrder(auth.supabase, next.placement) }
          : next
      )
      .eq("id", id);

    if (error) return fail(error.message);

    if (existing?.image_url && existing.image_url !== next.image_url) {
      await deleteImageByUrl(existing.image_url);
    }

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function deleteActivity(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    const { data: row } = await auth.supabase
      .from("activities")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase.from("activities").delete().eq("id", id);
    if (error) return fail(error.message);

    await deleteImageByUrl(row?.image_url);

    revalidatePath("/", "layout");
    return ok();
  });
}

/** Persists one placement group's order in a single call. */
export async function reorderActivities(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (!ids.length) return ok();

    const results = await Promise.all(
      ids.map((id, index) =>
        auth.supabase
          .from("activities")
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
export async function toggleActivityPublished(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    const { error } = await auth.supabase
      .from("activities")
      .update({ is_published: boolField(formData, "is_published") })
      .eq("id", id);

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}
