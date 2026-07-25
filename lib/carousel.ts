import { createClient } from "@/lib/supabase/server";

export async function getCarouselImages() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("carousel_images")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
}
