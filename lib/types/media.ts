/**
 * Storage folder names for the `media` bucket.
 *
 * Deliberately NOT in lib/actions/media.ts: that file carries the "use server"
 * directive, and such a module may only export async functions. Exporting this
 * array from there made every import of it fail at module evaluation with
 * "A 'use server' file can only export async functions, found object", which
 * broke saving anywhere an admin editor touched the media actions.
 */
export const mediaFolders = [
  "hero",
  "carousel",
  "team",
  "signatures",
  "documents",
  "activities",
  "videos",
] as const;

export type MediaFolder = (typeof mediaFolders)[number];
