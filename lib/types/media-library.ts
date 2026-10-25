export const mediaAssetKinds = ["image", "video"] as const;

export type MediaAssetKind = (typeof mediaAssetKinds)[number];

/** Row returned from the storage-backed media_assets index. */
export type MediaAssetRow = {
  object_id: string;
  bucket_id: string;
  object_path: string;
  mime_type: string;
  kind: MediaAssetKind;
  folder: string;
  byte_size: number | null;
  created_at: string;
  updated_at: string;
  indexed_at: string;
};

/** Public URL is derived server-side from bucket_id + object_path. */
export type MediaAsset = MediaAssetRow & {
  public_url: string;
};

const browserVideoMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

const browserImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
]);

/** Formats that can be previewed consistently without an external converter. */
export function isBrowserDisplayableImage(mimeType: string): boolean {
  return browserImageMimeTypes.has(mimeType.toLowerCase().split(";", 1)[0].trim());
}

/**
 * Only send formats with reliable HTML5 playback to <video>. Other video
 * objects remain available through a normal download link.
 */
export function isBrowserPlayableVideo(mimeType: string): boolean {
  return browserVideoMimeTypes.has(mimeType.toLowerCase().split(";", 1)[0].trim());
}

/** A human-readable name from an object key, without trusting it as markup. */
export function mediaAssetFileName(objectPath: string): string {
  const rawName = objectPath.split("/").filter(Boolean).at(-1) || objectPath;

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

export function formatMediaBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}
