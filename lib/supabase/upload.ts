import { createClient } from "./client";
import { mediaFolders, type MediaFolder } from "@/lib/types/media";

/**
 * Browser-to-storage upload, used by the archive editors.
 *
 * Deliberately NOT a server action like `uploadImage` in lib/actions/media.ts.
 * A Server Action request body is capped at 1MB by default, which a gallery of
 * photographs — let alone a video — passes immediately, and the failure arrives
 * as an opaque "Body exceeded 1 MB limit" rather than a message an editor can
 * act on. Going straight to storage from the browser has no such ceiling.
 *
 * Access control is unchanged by this: the `media_admin_insert` storage policy
 * (migration 0001) only lets an admin write to this bucket, and the browser
 * client carries the signed-in admin's session. The checks below are for
 * feedback and to avoid a doomed round trip, not for trust.
 */

const BUCKET = "media";

export const ARCHIVE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
export const ARCHIVE_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const ARCHIVE_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Supabase's free-tier per-file ceiling, so accepting more would only fail later. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
/** Audio is intentionally smaller so editorial uploads stay quick and lightweight. */
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "application/pdf": "pdf",
};

function extensionFor(file: File): string {
  // Derive the object extension from the accepted MIME type, never the user
  // supplied filename. That prevents a disguised `.html`/`.svg` name from
  // becoming an executable-looking public storage object.
  return extensionByMime[file.type] ?? "bin";
}

export function describeArchiveFileError(file: File): string | null {
  const isImage = ARCHIVE_IMAGE_TYPES.includes(file.type);
  const isVideo = ARCHIVE_VIDEO_TYPES.includes(file.type);
  const isAudio = ARCHIVE_AUDIO_TYPES.includes(file.type);

  if (!isImage && !isVideo && !isAudio) {
    return "শুধু ছবি, ভিডিও অথবা অডিও (MP3, M4A, OGG, WAV) দেওয়া যাবে।";
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return "ছবির আকার ৮ মেগাবাইটের কম হতে হবে।";
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return "ভিডিওর আকার ৫০ মেগাবাইটের কম হতে হবে।";
  }

  if (isAudio && file.size > MAX_AUDIO_BYTES) {
    return "অডিওর আকার ২৫ মেগাবাইটের কম হতে হবে।";
  }

  return null;
}

/**
 * Uploads one file into `media/<folder>/` and returns its public URL.
 *
 * The object key is generated rather than taken from the file name: the
 * original could contain path separators or unicode that breaks the key, and
 * reusing it risks one editor overwriting another's upload.
 */
export async function uploadToMedia(
  file: File,
  folder: MediaFolder
): Promise<UploadResult> {
  const invalid = describeArchiveFileError(file);
  if (invalid) return { ok: false, error: invalid };

  if (!(mediaFolders as readonly string[]).includes(folder)) {
    return { ok: false, error: "আপলোড ফোল্ডারটি অনুমোদিত নয়।" };
  }

  const supabase = createClient();
  const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const path = `${folder}/${unique}.${extensionFor(file)}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) return { ok: false, error: `আপলোড ব্যর্থ: ${error.message}` };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { ok: true, url: publicUrl };
}

/**
 * Direct-to-storage PDF upload for the admin document picker.
 *
 * Keeping this out of a Server Action avoids Next's intentionally small 1 MB
 * action body limit. Storage RLS still performs the real authorization, and a
 * short signature check prevents a renamed arbitrary file being served as a
 * public PDF.
 */
export async function uploadDocumentToMedia(
  file: File,
  folder: MediaFolder
): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, error: "কোনো ফাইল নির্বাচন করা হয়নি।" };
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, error: "PDF ফাইলের আকার ১০ মেগাবাইটের কম হতে হবে।" };
  }
  if (!(mediaFolders as readonly string[]).includes(folder)) {
    return { ok: false, error: "আপলোড ফোল্ডারটি অনুমোদিত নয়।" };
  }

  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) return { ok: false, error: "শুধু PDF ফাইল আপলোড করা যাবে।" };

  const signature = await file.slice(0, 5).text();
  if (signature !== "%PDF-") {
    return { ok: false, error: "ফাইলটি সঠিক PDF নয়।" };
  }

  const supabase = createClient();
  const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const path = `${folder}/${unique}.pdf`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) return { ok: false, error: `আপলোড ব্যর্থ: ${error.message}` };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: publicUrl };
}
