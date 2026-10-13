import { useEffect, useState } from "react";

/**
 * Loads the QCF page font for one mushaf page.
 *
 * Every printed page of the Madinah mushaf has its own typeface, in which each
 * word is a single glyph. Drawing those glyphs reproduces the print's exact
 * line breaks and justification instead of approximating them with ordinary
 * Arabic text, which is what the PDF was there to work around.
 *
 * We draw the V4 outlines using the API's code_v2 values. The API publishes no
 * codes of its own for V4, and that substitution is safe rather than lucky:
 * the v2 and v4 fonts carry an identical cmap - the same codepoints mapping to
 * the same glyph names - verified with fontTools across pages 1, 3, 50, 77,
 * 255, 300, 450 and 604. Only the outlines differ, never which word a code
 * draws. If the edition is ever switched to V1, the word field must switch to
 * code_v1 with it; V1 has a genuinely different encoding.
 */

export const QCF_EDITION = 'v4';

/** The field on a word holding the codes this edition is drawn from. */
export const QCF_CODE_FIELD = 'code_v2' as const;

export const qcfFamily = (page: number) => `QCF_${QCF_EDITION}_P${page}`;

const injected = new Set<number>();

/**
 * Returns the font family for the page and whether its glyphs have arrived.
 * Callers that measure rendered text must wait for `ready` - until the face
 * loads there are no real glyph widths to measure.
 */
export const useQcfFont = (page: number) => {
  const family = qcfFamily(page);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!page || page < 1 || page > 604) return;
    let cancelled = false;
    setReady(false);

    // One <style> per page, kept for the session: flipping back and forth
    // between pages is normal here and re-fetching the face each time would
    // flash blank lines.
    if (!injected.has(page)) {
      injected.add(page);
      const style = document.createElement('style');
      style.dataset.qcfPage = String(page);
      style.textContent = `
        @font-face {
          font-family: '${family}';
          src: url('https://static.qurancdn.com/fonts/quran/hafs/${QCF_EDITION}/woff2/p${page}.woff2') format('woff2');
          font-display: block;
        }`;
      document.head.appendChild(style);
    }

    const done = () => { if (!cancelled) setReady(true); };
    // Resolve either way: a failed load should not leave the page blank
    // forever, and the measuring pass needs to run regardless.
    document.fonts.load(`1em '${family}'`).then(done).catch(done);

    return () => { cancelled = true; };
  }, [page, family]);

  return { family, ready };
};
