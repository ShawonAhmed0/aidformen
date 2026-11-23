import { isBot, withinSharedLimit } from "@/lib/chat/guard";
import { createClient } from "@/lib/supabase/server";

/**
 * Records a document the visitor has just uploaded to their chat's folder in
 * the private `case-documents` bucket. The upload itself went browser-direct
 * to storage; this ties the file to the conversation so admins see it with
 * the chat. add_chat_document (migration 0021) re-checks the session token,
 * the folder, and that the file really exists.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (await isBot()) return bad("অনুরোধটি গ্রহণ করা যায়নি।", 403);

  let body: {
    conversation?: { id?: unknown; token?: unknown };
    path?: unknown;
    fileName?: unknown;
    pages?: unknown;
    bytes?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return bad("অনুরোধটি পড়া যায়নি।");
  }

  const id = body.conversation?.id;
  const token = body.conversation?.token;
  if (typeof id !== "string" || typeof token !== "string" || !UUID.test(id) || !UUID.test(token)) {
    return bad("চ্যাট সেশনটি সঠিক নয়।");
  }
  if (typeof body.path !== "string" || !body.path.startsWith(`${id}/${token}/`)) {
    return bad("নথির ঠিকানা সঠিক নয়।");
  }

  const supabase = await createClient();
  // Ten documents an hour per visitor IP, counted across servers.
  if (!(await withinSharedLimit(supabase, request, "document", 10, 3600))) {
    return bad("অনেকগুলো নথি পাঠানো হয়েছে। পরে আবার চেষ্টা করুন।", 429);
  }

  const { data, error } = await supabase.rpc("add_chat_document", {
    p_conversation_id: id,
    p_conversation_token: token,
    p_path: body.path,
    p_file_name: typeof body.fileName === "string" ? body.fileName : null,
    p_pages: Number.isInteger(body.pages) ? body.pages : null,
    p_bytes: Number.isInteger(body.bytes) ? body.bytes : null,
  });

  if (error || !data) {
    console.error("[chat-document] not recorded:", error?.code ?? "", error?.message ?? "rejected");
    return bad("নথিটি সংরক্ষণ করা যায়নি।", 500);
  }
  return Response.json({ ok: true });
}
