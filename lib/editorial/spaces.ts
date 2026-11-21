const NBSP = /&nbsp;|&#160;|&#xa0;| /gi;

/**
 * Quill 2.0's getSemanticHTML() writes every space as a non-breaking one.
 * That welds a whole paragraph into one unbreakable "word", so the browser
 * has to split it wherever the line runs out — mid-word, leaving a word's
 * last letter alone on the next line.
 *
 * Each run becomes an ordinary space again, with any extra spaces in the run
 * kept non-breaking so a deliberate double space survives. A run that is an
 * element's whole content (`<p>&nbsp;</p>`, a blank line) is left alone: a
 * plain space there would collapse and the blank line would vanish.
 *
 * Client-safe on purpose: the editor and the server sanitizer both use it.
 */
export function breakableSpaces(html: string): string {
  return html.replace(
    /(>?)((?:&nbsp;|&#160;|&#xa0;| )+)(<?)/gi,
    (match, open: string, run: string, close: string) => {
      if (open && close) return match;
      const extra = (run.match(NBSP)?.length ?? 1) - 1;
      return `${open} ${"&nbsp;".repeat(extra)}${close}`;
    }
  );
}
