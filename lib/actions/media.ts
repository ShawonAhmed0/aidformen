"use server";

import { fail, guarded, ok, requireAdmin } from "./shared";

const BUCKET = "media";
// Uploads go browser-direct to Storage (lib/supabase/upload.ts): a Server
// Action body is capped at 1 MB, which real photographs exceed. Only the
// clean-up below still needs the server.

/**
 * Object key inside our bucket for a stored URL, or null if the URL does not
 * point there — an external image, or one in the legacy `carousel` bucket, is
 * not ours to delete.
 */
function pathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length));
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

    const path = pathFromUrl(url);
    if (!path) return ok();

    const { error } = await auth.supabase.storage.from(BUCKET).remove([path]);

    // A failed cleanup should never block the content change that triggered it.
    if (error) console.warn("[media] delete failed:", error.message);

    return ok();
  });
}

/**
 * Same, for many objects at once.
 *
 * One auth check and one storage call rather than per-URL: deleting an archive
 * entry with a full gallery meant forty sequential round trips, each re-running
 * the admin lookup, which is slow enough to risk timing out the request that
 * asked for it.
 */
export async function deleteMediaByUrls(urls: (string | null | undefined)[]) {
  return guarded(async () => {
    const paths = Array.from(
      new Set(
        urls
          .filter((url): url is string => Boolean(url))
          .map(pathFromUrl)
          .filter((path): path is string => path !== null)
      )
    );

    if (paths.length === 0) return ok();

    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error);

    const { error } = await auth.supabase.storage.from(BUCKET).remove(paths);
    if (error) console.warn("[media] batch delete failed:", error.message);

    return ok();
  });
}
