import { createClient } from "@/lib/supabase/server";

export async function getHeroContent() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hero_content")
    .select("*")
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}
