import { createClient } from "@/lib/supabase/client";
import type { ChatSessionCredentials } from "@/lib/types/chatbot";

/**
 * Browser side of the chat's document upload.
 *
 * Photos are drawn into one PDF here (pdf-lib, loaded only when someone
 * actually attaches something), then uploaded straight to the private
 * `case-documents` bucket — a Server Action body is capped at 1 MB, which a
 * single phone photo exceeds. The storage policy (migration 0021) only lets
 * the file into this chat's own folder; /api/chat/document then records it.
 */

export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const MAX_DOCUMENTS = 10;
export const MAX_PHOTOS_PER_PDF = 20;
/** Long edge of a page image: sharp enough to read a court order, small enough to send. */
const PAGE_EDGE = 2000;

export type DocumentError = "too_big" | "limit" | "unreadable" | "failed";

async function photoAsJpeg(file: File): Promise<{ bytes: ArrayBuffer; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, PAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  // White under the image, so a transparent PNG doesn't come out black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("no jpeg");
  return { bytes: await blob.arrayBuffer(), width, height };
}

/** One PDF with a page per photo, each page sized to its photo. */
export async function photosToPdf(files: File[]): Promise<{ blob: Blob; pages: number }> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  for (const file of files.slice(0, MAX_PHOTOS_PER_PDF)) {
    const photo = await photoAsJpeg(file);
    const image = await pdf.embedJpg(photo.bytes);
    // Long edge at A4 height (842pt) so the page prints at a sensible size.
    const scale = 842 / Math.max(photo.width, photo.height);
    const page = pdf.addPage([photo.width * scale, photo.height * scale]);
    page.drawImage(image, { x: 0, y: 0, width: photo.width * scale, height: photo.height * scale });
  }
  const bytes = await pdf.save();
  return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), pages: pdf.getPageCount() };
}

async function pdfPageCount(file: File): Promise<number | null> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    return pdf.getPageCount();
  } catch {
    return null;
  }
}

/** Uploads one PDF into the chat's folder and records it. */
export async function sendDocument(
  conversation: ChatSessionCredentials,
  blob: Blob,
  fileName: string,
  pages: number | null
): Promise<{ ok: true } | { ok: false; error: DocumentError }> {
  if (blob.size > MAX_DOCUMENT_BYTES) return { ok: false, error: "too_big" };

  const path = `${conversation.id}/${conversation.token}/${crypto.randomUUID()}.pdf`;
  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from("case-documents")
    .upload(path, blob, { contentType: "application/pdf", upsert: false });
  if (uploadError) {
    // The policy refuses the 11th file, among other things; say which it was
    // when it is the limit, otherwise stay generic.
    console.warn("[chat-documents] upload refused:", uploadError.message);
    return { ok: false, error: /row-level security|policy/i.test(uploadError.message) ? "limit" : "failed" };
  }

  const response = await fetch("/api/chat/document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation, path, fileName, pages, bytes: blob.size }),
  }).catch(() => null);
  if (!response?.ok) return { ok: false, error: "failed" };
  return { ok: true };
}

/**
 * Everything the visitor picked in one go: the photos become one PDF, and
 * each PDF goes as it is. Returns how many documents and pages went through.
 */
export async function sendPickedFiles(
  conversation: ChatSessionCredentials,
  files: File[]
): Promise<{ sent: number; pages: number; error: DocumentError | null }> {
  const photos = files.filter((f) => f.type.startsWith("image/"));
  const pdfs = files.filter((f) => f.type === "application/pdf");
  let sent = 0;
  let pages = 0;
  let error: DocumentError | null = files.length > photos.length + pdfs.length ? "unreadable" : null;

  if (photos.length) {
    try {
      const pdf = await photosToPdf(photos);
      const name = photos.length === 1 ? photos[0].name.replace(/\.[^.]+$/, ".pdf") : `photos-${photos.length}.pdf`;
      const result = await sendDocument(conversation, pdf.blob, name, pdf.pages);
      if (result.ok) {
        sent += 1;
        pages += pdf.pages;
      } else error = result.error;
    } catch {
      error = "unreadable";
    }
  }

  for (const file of pdfs) {
    const count = await pdfPageCount(file);
    const result = await sendDocument(conversation, file, file.name, count);
    if (result.ok) {
      sent += 1;
      pages += count ?? 0;
    } else error = result.error;
  }

  return { sent, pages, error };
}
