"use server";

import { revalidatePath } from "next/cache";

import { deleteImageByUrl } from "./media";
import {
  boolField,
  fail,
  guarded,
  ok,
  optionalText,
  requiredText,
  requireAdmin,
} from "./shared";

function fieldsFrom(formData: FormData) {
  return {
    name: requiredText(formData, "name", "নাম", 160),
    role: requiredText(formData, "role", "পদবি", 160),
    quote: optionalText(formData, "quote", 400),
    statement: optionalText(formData, "statement", 1200),
    bio: optionalText(formData, "bio", 2000),
    photo_url: optionalText(formData, "photo_url", 500),
    name_en: optionalText(formData, "name_en", 160),
    role_en: optionalText(formData, "role_en", 160),
    quote_en: optionalText(formData, "quote_en", 400),
    statement_en: optionalText(formData, "statement_en", 1200),
    bio_en: optionalText(formData, "bio_en", 2000),
    is_published: boolField(formData, "is_published"),
  };
}

export async function createTeamMember(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const { data: last } = await auth.supabase
      .from("team_members")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await auth.supabase.from("team_members").insert({
      ...fieldsFrom(formData),
      sort_order: (last?.sort_order ?? 0) + 10,
    });

    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function updateTeamMember(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);
    const next = fieldsFrom(formData);

    // If the photo changed, clear the old file once the row is updated.
    const { data: existing } = await auth.supabase
      .from("team_members")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase
      .from("team_members")
      .update(next)
      .eq("id", id);

    if (error) return fail(error.message);

    if (existing?.photo_url && existing.photo_url !== next.photo_url) {
      await deleteImageByUrl(existing.photo_url);
    }

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function deleteTeamMember(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const id = requiredText(formData, "id", "আইডি", 64);

    const { data: row } = await auth.supabase
      .from("team_members")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase.from("team_members").delete().eq("id", id);
    if (error) return fail(error.message);

    await deleteImageByUrl(row?.photo_url);

    revalidatePath("/", "layout");
    return ok();
  });
}

export async function reorderTeamMembers(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const ids = formData.getAll("ids").map(String).filter(Boolean);
    if (!ids.length) return ok();

    const results = await Promise.all(
      ids.map((id, index) =>
        auth.supabase
          .from("team_members")
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
