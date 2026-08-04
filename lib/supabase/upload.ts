import { createClient } from "./client";

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

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Supabase's free-tier per-file ceiling, so accepting more would only fail later. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

function extensionFor(file: File): string {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "";
  if (/^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] ?? "bin";
}

export function describeArchiveFileError(file: File): string | null {
  const isImage = ARCHIVE_IMAGE_TYPES.includes(file.type);
  const isVideo = ARCHIVE_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return "শুধু ছবি (JPG, PNG, WEBP, AVIF) বা ভিডিও (MP4, WEBM, MOV) দেওয়া যাবে।";
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return "ছবির আকার ৮ মেগাবাইটের কম হতে হবে।";
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return "ভিডিওর আকার ৫০ মেগাবাইটের কম হতে হবে।";
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
  folder: string
): Promise<UploadResult> {
  const invalid = describeArchiveFileError(file);
  if (invalid) return { ok: false, error: invalid };

  const supabase = createClient();
  const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const path = `${folder}/${unique}.${extensionFor(file)}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false });

  if (error) return { ok: false, error: `আপলোড ব্যর্থ: ${error.message}` };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { ok: true, url: publicUrl };
}
