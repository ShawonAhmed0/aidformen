import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  ChatConversation,
  ChatHistoryMessage,
  ChatbotSettings,
} from "@/lib/types/chatbot";

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

/**
 * Admin history intentionally selects neither the per-session access token nor
 * any database-only fields. RLS makes both queries return data only for an
 * authenticated administrator, even if this helper is called from elsewhere.
 */
export async function getChatHistory(
  limit = 100
): Promise<ChatConversation[]> {
  const supabase = await createClient();
  const safeLimit = Math.min(200, Math.max(1, Math.round(limit)));

  const { data: rows, error } = await supabase
    .from("chat_conversations")
    .select(
      "id, visitor_name, phone, locale, summary, message_count, created_at, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.warn(`[chatbot] history: ${error.message}`);
    return [];
  }

  if (!rows?.length) return [];

  const ids = rows.map((row) => row.id);
  const messageRows: {
    id: number;
    conversation_id: string;
    role: string;
    content: string;
    created_at: string;
  }[] = [];
  const pageSize = 1000;

  // PostgREST commonly caps one response at 1,000 rows. Page explicitly so a
  // busy support inbox still shows every message in each returned session.
  for (let from = 0; ; from += pageSize) {
    const { data: page, error: messagesError } = await supabase
      .from("chat_messages")
      .select("id, conversation_id, role, content, created_at")
      .in("conversation_id", ids)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (messagesError) {
      console.warn(`[chatbot] history messages: ${messagesError.message}`);
      break;
    }

    messageRows.push(...(page ?? []));
    if (!page || page.length < pageSize) break;
  }

  const messagesByConversation = new Map<string, ChatHistoryMessage[]>();
  for (const message of messageRows ?? []) {
    const list = messagesByConversation.get(message.conversation_id) ?? [];
    list.push({
      id: message.id,
      role: message.role as ChatHistoryMessage["role"],
      content: message.content,
      created_at: message.created_at,
    });
    messagesByConversation.set(message.conversation_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    visitor_name: row.visitor_name,
    phone: row.phone,
    locale: row.locale as ChatConversation["locale"],
    summary: row.summary,
    message_count: row.message_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    messages: messagesByConversation.get(row.id) ?? [],
  }));
}
