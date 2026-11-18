import type { Locale } from "@/lib/i18n/config";

/** The hero's first button leads to the page now titled "Our Journey". */
export const journeyButtonLabel: Record<Locale, string> = {
  bn: "আমাদের পথচলা",
  en: "Our Journey",
};

/** Earlier wordings of that button, from when the page was "About us". */
const staleAboutLabels = new Set([
  "আমাদের সম্পর্কে জানুন",
  "আমাদের সম্পর্কে",
  "know about us",
  "learn about us",
  "about us",
  // Same name, earlier capitalisation.
  "our journey",
]);

/**
 * The label the hero's first button actually shows for a stored value.
 *
 * Used by both the homepage and the /admin/hero form, so the form always
 * opens on exactly what visitors see — saving it then stores that label, and
 * the old "About us" wording stops being a display-time substitution.
 */
export function heroPrimaryLabel(stored: string | null | undefined, locale: Locale) {
  const value = stored?.trim();
  if (!value || staleAboutLabels.has(value.toLowerCase())) return journeyButtonLabel[locale];
  return value;
}
