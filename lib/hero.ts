import { createClient } from "@/lib/supabase/server";

export async function getHeroContent() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hero_content")
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
