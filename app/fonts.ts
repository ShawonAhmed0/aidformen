import { Inter, Noto_Serif_Bengali } from "next/font/google";
import localFont from "next/font/local";

/**
 * Typography system.
 *
 * The site is Bengali-first, so the Bengali face carries the identity and the
 * Latin face only ever fills in for numerals, email addresses and the admin UI.
 *
 *   display  Noto Serif Bengali  headings, pull quotes, statistics
 *   body     Kalpurush (bn) + Inter (latin)  running text and UI
 *
 * All three are self-hosted by next/font — no request ever leaves for Google.
 */

/** Latin body + UI. Variable, so every weight costs one file. */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Display face. Variable 100–900, which is the point of choosing it: Kalpurush
 * ships a single weight, so real heading weights have to come from here rather
 * than from browser-synthesised faux bold.
 *
 * The `wdth` axis is deliberately not requested — it would enlarge the file and
 * nothing in the design uses it.
 */
export const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-noto-bengali",
  display: "swap",
});

/**
 * Bengali body face, already in the repo at public/fonts.
 *
 * `unicode-range` keeps the original arrangement intact: Kalpurush answers only
 * for the Bengali block, so Latin characters fall through to Inter instead of
 * being rendered by Kalpurush's weaker Latin glyphs.
 *
 * `adjustFontFallback` is off because next/font can only synthesise metric
 * overrides from Arial or Times, and neither has anything to do with Bengali
 * vertical metrics — a wrong adjustment causes more shift than none.
 */
export const kalpurush = localFont({
  src: "../public/fonts/Kalpurush.woff2",
  variable: "--font-kalpurush",
  weight: "400",
  style: "normal",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0980-09FF" }],
});

/** Convenience: everything the root layout needs to put on <html>. */
export const fontVariables = [
  inter.variable,
  notoSerifBengali.variable,
  kalpurush.variable,
].join(" ");
