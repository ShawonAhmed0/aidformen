/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * Phone photos arrive at 4000–6000px and 5–15 MB. The site never shows one
 * wider than ~2000px, so storing the original only costs storage, upload time
 * on a slow connection, and — wherever an image is served as-is — visitors'
 * data. Scaling the long edge to MAX_EDGE and re-encoding as WebP typically
 * turns a 10 MB photo into 300–600 KB with no visible difference.
 *
 * The aspect ratio is kept: cropping is a display decision (the focal-point
 * picker and object-cover), and an upload must never lose part of the frame.
 *
 * Re-encoding also drops EXIF metadata, which on a phone photo includes the
 * GPS position it was taken at — worth losing for a rights organisation's
 * protest and case photographs.
 */

/** Long-edge ceiling. Covers a 1440px hero on a 2× display with room to spare. */
const MAX_EDGE = 2560;
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.85;
/** A small PNG/WebP that already fits is left alone; there is little to win. */
const SKIP_UNDER_BYTES = 300 * 1024;

const DECODABLE = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function encode(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function renamed(file: File, type: string) {
  const ext = type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${ext}`;
}

/**
 * Returns a smaller copy of `file`, or `file` itself when it is not a photo
 * the browser can decode, or when re-encoding would not help.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!DECODABLE.includes(file.type) || typeof createImageBitmap !== "function") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF rotation, so a portrait shot taken
    // sideways on the phone stays upright once the metadata is gone.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const isJpeg = file.type === "image/jpeg";

  // JPEGs are always re-encoded, for the GPS metadata as much as the size.
  if (!isJpeg && scale === 1 && file.size <= SKIP_UNDER_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await encode(canvas, "image/webp", WEBP_QUALITY);

  // Safari can't encode WebP and quietly hands back a PNG instead. Then a
  // PNG or WebP source stays PNG (it may be a signature or logo whose
  // transparency matters) and a photo goes to JPEG.
  if (!blob || blob.type !== "image/webp") {
    blob = isJpeg || file.type === "image/avif"
      ? await encode(canvas, "image/jpeg", JPEG_QUALITY)
      : await encode(canvas, "image/png");
  }
  if (!blob) return file;

  // Never upload something bigger than what was picked — except a JPEG, where
  // shedding the location metadata is worth a few extra kilobytes.
  if (blob.size >= file.size && !(isJpeg && blob.size < file.size * 1.15)) {
    return file;
  }

  return new File([blob], renamed(file, blob.type), {
    type: blob.type,
    lastModified: Date.now(),
  });
}
