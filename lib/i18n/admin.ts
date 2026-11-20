/**
 * The admin panel's own interface language, independent of the public site's
 * locale: an editor may prefer the English interface while writing Bengali
 * content, or the reverse. Stored in a cookie so the server-rendered pages and
 * the client editors agree on first paint.
 */
export const adminLocales = ["bn", "en"] as const;
export type AdminLocale = (typeof adminLocales)[number];

export const ADMIN_LOCALE_COOKIE = "ADMIN_LOCALE";
/** Bengali is the site's source language, so it is the interface default too. */
export const defaultAdminLocale: AdminLocale = "bn";

export function isAdminLocale(value: unknown): value is AdminLocale {
  return value === "bn" || value === "en";
}
