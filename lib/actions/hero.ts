"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateHeroContent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const imageFile = formData.get("image") as File | null;

  let imageUrl: string | null = null;

  // Upload new image if provided
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `hero-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("carousel") // ← corrected bucket name
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return { error: "Image upload failed: " + uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("carousel").getPublicUrl(fileName);

    imageUrl = publicUrl;
  }

  const updateData: any = {
    title,
    description,
    updated_at: new Date().toISOString(),
  };

  if (imageUrl) {
    updateData.image_url = imageUrl;
  }

  // Try update first (assuming you have at least one row)
  const { error } = await supabase
    .from("hero_content")
    .update(updateData)
    .eq("id", 1); // change if your id is different

  if (error) {
    // Fallback: insert if no row exists
    const { error: insertError } = await supabase
      .from("hero_content")
      .insert(updateData);

    if (insertError) {
      return { error: insertError.message };
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");

  return { success: true };
}
