import { createClient } from "@/lib/supabase/server";

export type ChatDocument = {
  id: string;
  file_name: string | null;
  pages: number | null;
  bytes: number | null;
  created_at: string;
  /** Short-lived link; the bucket itself is private. */
  url: string | null;
};

/** How long an admin's link to a document works. */
const LINK_SECONDS = 60 * 60;

/**
 * Documents visitors attached to the given chats, with signed links for the
 * signed-in admin. Empty — not an error — until migration 0021 has run.
 */
export async function getChatDocuments(ids: string[]): Promise<Record<string, ChatDocument[]>> {
  if (!ids.length) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_documents")
    .select("id, conversation_id, path, file_name, pages, bytes, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: true });
  if (error || !data?.length) return {};

  const { data: signed } = await supabase.storage
    .from("case-documents")
    .createSignedUrls(
      data.map((d) => d.path),
      LINK_SECONDS
    );
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const byChat: Record<string, ChatDocument[]> = {};
  for (const d of data) {
    (byChat[d.conversation_id] ??= []).push({
      id: d.id,
      file_name: d.file_name,
      pages: d.pages,
      bytes: d.bytes,
      created_at: d.created_at,
      url: urls.get(d.path) ?? null,
    });
  }
  return byChat;
}
