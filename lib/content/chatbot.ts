import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ChatbotSettings } from "@/lib/types/chatbot";

/**
 * Fails soft like the rest of the read layer: if the migration has not been
 * run, the widget simply does not render rather than breaking every page.
 */
export const getChatbotSettings = cache(
  async (): Promise<ChatbotSettings | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("chatbot_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) console.warn(`[chatbot] settings: ${error.message}`);
    return (data as ChatbotSettings | null) ?? null;
  }
);
