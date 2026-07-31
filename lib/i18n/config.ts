export const locales = ["bn", "en"] as const;

export type Locale = (typeof locales)[number];

/** Bengali is the source language: content is authored in bn and translated to en. */
export const defaultLocale: Locale = "bn";

export const localeLabels: Record<Locale, string> = {
  bn: "বাংলা",
  en: "English",
};

/** `lang` attribute values for <html>. */
export const localeHtmlLang: Record<Locale, string> = {
  bn: "bn",
  en: "en",
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/**
 * Picks the field for the active locale, falling back to the Bengali source.
 *
 * The whole bilingual scheme rests on this: English columns are nullable, so a
 * page that is only half translated shows Bengali for the rest rather than
 * blank space. An empty string counts as missing — an editor clearing a field
 * means "not translated", not "translated to nothing".
 */
export function pick(
  locale: Locale,
  source: string | null | undefined,
  english: string | null | undefined
): string {
  if (locale === "en") {
    const trimmed = english?.trim();
    if (trimmed) return trimmed;
  }
  return source?.trim() ?? "";
}

/** Swaps the locale segment of a path, e.g. /bn/about -> /en/about. */
export function switchLocalePath(pathname: string, next: Locale): string {
  const segments = pathname.split("/").filter(Boolean);

  if (isLocale(segments[0])) {
    segments[0] = next;
  } else {
    segments.unshift(next);
  }

  return "/" + segments.join("/");
}
