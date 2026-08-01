"use server";

import { mediaFolders, type MediaFolder } from "@/lib/types/media";
import { fail, guarded, ok, requireAdmin } from "./shared";

const BUCKET = "media";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function extensionFor(type: string, name: string) {
  const fromName = name.includes(".") ? name.split(".").pop()! .toLowerCase() : "";
  if (/^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return type.split("/")[1] ?? "bin";
}

/**
 * Uploads one image and returns its public URL.
 *
 * Filenames are generated rather than taken from the client: the original name
 * could contain path separators or unicode that breaks the object key, and
 * reusing it risks one editor silently overwriting another's file.
 */
export async function uploadImage(formData: FormData) {
  return guarded(async () => {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const file = formData.get("file");
    const folderRaw = (formData.get("folder") as string | null) ?? "hero";
    const folder: MediaFolder = (mediaFolders as readonly string[]).includes(folderRaw)
      ? (folderRaw as MediaFolder)
      : "hero";

    if (!(file instanceof File) || file.size === 0) {
      return fail("কোনো ফাইল নির্বাচন করা হয়নি।");
    }

    if (!ALLOWED.includes(file.type)) {
      return fail("শুধু JPG, PNG, WEBP, AVIF বা GIF ফাইল আপলোড করা যাবে।");
    }

    if (file.size > MAX_BYTES) {
      return fail("ছবির আকার ৫ মেগাবাইটের কম হতে হবে।");
    }

    const ext = extensionFor(file.type, file.name);
    const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const path = `${folder}/${unique}.${ext}`;

    const { error: uploadError } = await auth.supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "31536000", upsert: false });

    if (uploadError) {
      return fail(`আপলোড ব্যর্থ: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = auth.supabase.storage.from(BUCKET).getPublicUrl(path);

    return ok({ url: publicUrl, path });
  });
}

/**
 * Best-effort removal of a previously uploaded object.
 *
 * Only touches files in our own bucket — an image referenced by an external
 * URL (or the legacy `carousel` bucket) is left alone.
 */
export async function deleteImageByUrl(url: string | null | undefined) {
  return guarded(async () => {
    if (!url) return ok();

    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const index = url.indexOf(marker);
    if (index === -1) return ok();

    const path = decodeURIComponent(url.slice(index + marker.length));
    const { error } = await auth.supabase.storage.from(BUCKET).remove([path]);

    // A failed cleanup should never block the content change that triggered it.
    if (error) console.warn("[media] delete failed:", error.message);

    return ok();
  });
}
