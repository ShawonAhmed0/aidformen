import { createClient } from "@/lib/supabase/server";

const STORAGE_PREFIX = "/storage/v1/object/public/media/";

/** Windows and the header both dislike these; a space keeps the name readable. */
function safeFileName(name: string) {
  const cleaned = name.replace(/[\\/:*?"<>|\r\n\t]+/g, " ").trim();
  return `${cleaned || "profile"}.pdf`;
}

/**
 * Streams a member's profile PDF from our own origin.
 *
 * The file itself lives in Supabase storage, but a cross-origin `<a download>`
 * is ignored by browsers — Chrome drops the click without a request or an
 * error, so the button appeared to do nothing. Serving it from here makes the
 * download same-origin, and lets the file arrive named after the member
 * instead of as a generated storage key.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("name, profile_pdf_url")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  const stored = data?.profile_pdf_url as string | undefined;
  if (!stored) return new Response("Not found", { status: 404 });

  // Only ever fetch our own bucket. The column is admin-written, but a proxy
  // that follows whatever URL it is handed is an SSRF waiting to happen.
  let source: URL;
  try {
    source = new URL(stored);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const bucket = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  if (source.origin !== bucket.origin || !source.pathname.startsWith(STORAGE_PREFIX)) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(source, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return new Response("Not available", { status: 502 });
  }

  const filename = safeFileName(String(data?.name ?? ""));
  const headers = new Headers({
    "Content-Type": "application/pdf",
    // The ASCII fallback exists for the Bengali names the RFC 5987 form covers.
    "Content-Disposition": `attachment; filename="profile.pdf"; filename*=UTF-8''${encodeURIComponent(
      filename
    )}`,
    "Cache-Control": "public, max-age=3600",
  });

  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new Response(upstream.body, { headers });
}
