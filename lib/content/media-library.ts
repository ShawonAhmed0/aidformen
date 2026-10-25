import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { MediaAsset, MediaAssetRow } from "@/lib/types/media-library";

function warningMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Unknown media library error";
}

/**
 * Storage-backed image/video inventory.
 *
 * The database stores only a bucket and object path. Building the URL here with
 * getPublicUrl keeps the index independent from the current Supabase hostname
 * and ensures the browser never receives an editor-supplied media URL.
 *
 * This function intentionally catches both PostgREST errors and setup/runtime
 * exceptions. During a rolling deploy, application code may arrive before
 * migration 0015; that should render an empty library rather than break either
 * the public page or the admin panel.
 */
export const getMediaAssets = cache(async (): Promise<MediaAsset[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("media_assets")
      .select(
        "object_id, bucket_id, object_path, mime_type, kind, folder, byte_size, created_at, updated_at, indexed_at"
      )
      .order("created_at", { ascending: false })
      .order("object_path", { ascending: true });

    if (error) {
      console.warn(`[media-library] media_assets: ${error.message}`);
      return [];
    }

    const assets: MediaAsset[] = [];

    for (const row of (data as MediaAssetRow[] | null) ?? []) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(row.bucket_id).getPublicUrl(row.object_path);

      if (!publicUrl) continue;
      assets.push({ ...row, public_url: publicUrl });
    }

    return assets;
  } catch (error) {
    console.warn(`[media-library] media_assets: ${warningMessage(error)}`);
    return [];
  }
});

/** Admins currently inspect the same public inventory, including metadata. */
export const getAllMediaAssets = getMediaAssets;
