import { useEffect, useState } from "react";

/**
 * Loads the QCF page font for one mushaf page.
 *
 * Every printed page of the Madinah mushaf has its own typeface, in which each
 * word is a single glyph. Drawing those glyphs reproduces the print's exact
 * line breaks and justification instead of approximating them with ordinary
 * Arabic text, which is what the PDF was there to work around.
 *
 * The edition must be the one the codes were published for: V2 fonts with the
 * API's code_v2. The V4 fonts were used here once, on the grounds that their
 * cmap matches V2's, but matching codepoints is not matching glyphs - on many
 * pages V4 draws a line's words at widths that no longer fill the line (page
 * 337 ranges from 58% to 100% of the column), so the lines came out with wide
 * gaps beside cramped ones and stray waqf marks. With V2, every line of every
 * page measured fills 96-100%, as in the print. If the edition is ever
 * switched to V1, the word field must switch to code_v1 with it.
 */

export const QCF_EDITION = 'v2';

/** The field on a word holding the codes this edition is drawn from. */
export const QCF_CODE_FIELD = 'code_v2' as const;

export const qcfFamily = (page: number) => `QCF_${QCF_EDITION}_P${page}`;

const injected = new Set<number>();

/**
 * Returns the font family for the page and whether its glyphs have arrived.
 * Callers that measure rendered text must wait for `ready` - until the face
 * loads there are no real glyph widths to measure. `ready` is not proof that
 * the text has been re-laid out in the face, though: Safari can resolve the
 * load before it repaints, so a measurement has to keep watching for widths
 * that change afterwards.
 */
export const useQcfFont = (page: number) => {
  const family = qcfFamily(page);
  // Which page's face has loaded, rather than a bare flag. A boolean stays true
  // through the first render of the next page - before this effect can reset
  // it - so the caller measured the new page's lines in a face that had not
  // even been requested yet.
  const [readyPage, setReadyPage] = useState(0);

  useEffect(() => {
    if (!page || page < 1 || page > 604) return;
    let cancelled = false;

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

    const done = () => { if (!cancelled) setReadyPage(page); };
    // Resolve either way: a failed load should not leave the page blank
    // forever, and the measuring pass needs to run regardless.
    document.fonts.load(`1em '${family}'`).then(done).catch(done);

    return () => { cancelled = true; };
  }, [page, family]);

  return { family, ready: readyPage === page };
};
