/**
 * Whether an image URL is a public object in this project's Supabase storage —
 * the one remote host next.config.ts lets the image optimizer fetch. Anything
 * else (an external link pasted into an article) has to be shown as-is.
 */
export function isOwnStorageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(base) && url.startsWith(`${base}/storage/v1/object/public/`);
}
