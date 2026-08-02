"use server";

import { revalidatePath } from "next/cache";

import { deleteImageByUrl } from "./media";
import {
  boolField,
  clampPercent,
  fail,
  guarded,
  intField,
  ok,
  optionalText,
  requiredText,
  requireAdmin,
} from "./shared";

function fieldsFrom(formData: FormData) {
  return {
    name: requiredText(formData, "name", "নাম", 160),
    role: requiredText(formData, "role", "পদবি", 160),
    // Generous ceilings: a member's statement and profile are full prose, and
    // these exist only to stop a runaway paste, not to shape the writing.
    quote: optionalText(formData, "quote", 800, "সংক্ষিপ্ত উক্তি"),
    statement: optionalText(formData, "statement", 8000, "বিবৃতি"),
    bio: optionalText(formData, "bio", 12000, "পরিচিতি"),
    photo_url: optionalText(formData, "photo_url", 500),
    signature_url: optionalText(formData, "signature_url", 500),
    profile_pdf_url: optionalText(formData, "profile_pdf_url", 500),
    focal_x: clampPercent(intField(formData, "focal_x", 50)),
    focal_y: clampPercent(intField(formData, "focal_y", 50)),
    name_en: optionalText(formData, "name_en", 160),
    role_en: optionalText(formData, "role_en", 160),
    quote_en: optionalText(formData, "quote_en", 800, "সংক্ষিপ্ত উক্তি (English)"),
    statement_en: optionalText(formData, "statement_en", 8000, "বিবৃতি (English)"),
    bio_en: optionalText(formData, "bio_en", 12000, "পরিচিতি (English)"),
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

    // If an uploaded file was replaced, clear the old one once the row is saved.
    const { data: existing } = await auth.supabase
      .from("team_members")
      .select("photo_url, signature_url, profile_pdf_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase
      .from("team_members")
      .update(next)
      .eq("id", id);

    if (error) return fail(error.message);

    const replaced = [
      [existing?.photo_url, next.photo_url],
      [existing?.signature_url, next.signature_url],
      [existing?.profile_pdf_url, next.profile_pdf_url],
    ] as const;

    for (const [before, after] of replaced) {
      if (before && before !== after) await deleteImageByUrl(before);
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
      .select("photo_url, signature_url, profile_pdf_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.supabase.from("team_members").delete().eq("id", id);
    if (error) return fail(error.message);

    await deleteImageByUrl(row?.photo_url);
    await deleteImageByUrl(row?.signature_url);
    await deleteImageByUrl(row?.profile_pdf_url);

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
