import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { MushafLine } from "./MushafLine";
import { SurahHeader } from "./SurahHeader";
import { toArabicNumerals } from "@/quran/lib/mushaf-formatter";
import { useQcfFont } from "@/quran/hooks/useQcfFont";
import type { MushafPage, MushafWord, SurahInfo } from "@/quran/types/mushaf";

/**
 * One page of the Madinah mushaf, drawn from its own QCF typeface.
 *
 * Replaces the scanned PDF: the glyphs give the print's exact line breaks and
 * justification, and because every word is a real element each ayah is
 * directly clickable - no overlay boxes estimated from PDF text coordinates.
 *
 * The API returns verse words only, so a surah header and a standalone basmala
 * arrive as empty line slots. Those slots are kept and filled here, which is
 * what keeps all 15 lines in their printed positions.
 */

interface MushafPageProps {
  page: MushafPage | undefined;
  isLoading: boolean;
  onVerseSelect?: (verseKey: string) => void;
  selectedVerseKeys?: string[];
}

const LINES_PER_PAGE = 15;

const JUZ_NAMES: Record<number, string> = {
  1: "الجزء الأول", 2: "الجزء الثاني", 3: "الجزء الثالث", 4: "الجزء الرابع",
  5: "الجزء الخامس", 6: "الجزء السادس", 7: "الجزء السابع", 8: "الجزء الثامن",
  9: "الجزء التاسع", 10: "الجزء العاشر", 11: "الجزء الحادي عشر", 12: "الجزء الثاني عشر",
  13: "الجزء الثالث عشر", 14: "الجزء الرابع عشر", 15: "الجزء الخامس عشر", 16: "الجزء السادس عشر",
  17: "الجزء السابع عشر", 18: "الجزء الثامن عشر", 19: "الجزء التاسع عشر", 20: "الجزء العشرون",
  21: "الجزء الحادي والعشرون", 22: "الجزء الثاني والعشرون", 23: "الجزء الثالث والعشرون",
  24: "الجزء الرابع والعشرون", 25: "الجزء الخامس والعشرون", 26: "الجزء السادس والعشرون",
  27: "الجزء السابع والعشرون", 28: "الجزء الثامن والعشرون", 29: "الجزء التاسع والعشرون",
  30: "الجزء الثلاثون",
};

const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/** What a blank line slot is, once resolved against the surah that follows it. */
type LineRole = { type: "surah" | "basmala"; surah: SurahInfo };

const clamp = (min: number, value: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * The sheet and its printed frame.
 *
 * Teachers read this on phones, so every part of the chrome is a proportion of
 * the sheet rather than a fixed pixel size - at 360px a 22px margin would eat
 * the column that the glyphs need. `overflow: hidden` is the backstop: the
 * glyph sizing below is what actually keeps lines inside the column, and this
 * guarantees nothing can escape the sheet even if a page measures oddly.
 */
const Frame = ({
  children,
  wrapRef,
  width,
}: {
  children: React.ReactNode;
  wrapRef?: React.Ref<HTMLDivElement>;
  width: number;
}) => {
  const sheetWidth = width || 860;
  const pad = clamp(4, sheetWidth * 0.014, 12);
  const rule = sheetWidth < 420 ? 1.5 : 2.5;
  const padX = clamp(6, sheetWidth * 0.026, 24);
  const padY = clamp(6, sheetWidth * 0.019, 16);

  return (
    <div ref={wrapRef} className="w-full flex justify-center py-3 px-1 sm:py-4 sm:px-2">
      <div
        className="w-full rounded-sm"
        style={{
          maxWidth: 860,
          background: "radial-gradient(120% 90% at 50% 0%, #fffdf6 0%, #fbf4e2 55%, #f3e9d2 100%)",
          boxShadow: "0 18px 40px -22px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.12)",
          padding: pad,
          overflow: "hidden",
        }}
      >
        <div style={{ border: `${rule}px solid #8a6b3d`, padding: Math.max(2, pad * 0.25) }}>
          <div
            style={{
              border: "1px solid #c2a263",
              padding: `${padY}px ${padX}px ${padY * 0.75}px`,
              overflow: "hidden",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MushafPageComponent = ({
  page,
  isLoading,
  onVerseSelect,
  selectedVerseKeys = [],
}: MushafPageProps) => {
  const pageNumber = page?.pageNumber ?? 0;
  const { family, ready: fontReady } = useQcfFont(pageNumber);

  const [hoveredVerseKey, setHoveredVerseKey] = useState<string | null>(null);

  // Two widths: the sheet's, which sets the chrome, and the text column's,
  // which sets the glyph size. The column is measured rather than derived
  // because the chrome it sits inside is itself proportional.
  const wrapRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [wrapWidth, setWrapWidth] = useState(0);
  const [columnWidth, setColumnWidth] = useState(0);

  useEffect(() => {
    const observe = (
      el: HTMLElement | null,
      set: (w: number) => void,
    ): (() => void) | undefined => {
      if (!el) return;
      const measure = () => set(el.getBoundingClientRect().width);
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    };
    const stopWrap = observe(wrapRef.current, setWrapWidth);
    const stopColumn = observe(columnRef.current, setColumnWidth);
    return () => { stopWrap?.(); stopColumn?.(); };
  }, [page, isLoading]);

  /**
   * Glyph size, fitted to the column.
   *
   * A page's longest line must fit exactly, because a QCF line cannot reflow -
   * its break points are baked into the font, which is the whole reason this
   * matches the print. So the size cannot be a fixed fraction of the width: a
   * page whose longest line is unusually dense would spill out of the column on
   * a narrow screen.
   *
   * Glyph advances scale linearly with font size, so measuring the widest line
   * once gives the exact size at which it fills the column, and one pass
   * settles it. Below ~400px this lands on small text, which is correct - the
   * alternative is breaking the printed line structure.
   */
  const [fontSize, setFontSize] = useState(18);

  useLayoutEffect(() => {
    if (!columnWidth) return;

    // Until the real face has loaded there are no glyph widths worth measuring,
    // so start from the ratio the print uses and refine once it arrives.
    if (!fontReady) {
      setFontSize(clamp(7, columnWidth * 0.039, 60));
      return;
    }

    const root = columnRef.current;
    if (!root) return;

    let widest = 0;
    root.querySelectorAll<HTMLElement>("[data-line]").forEach((el) => {
      const used = Array.from(el.children).reduce(
        (sum, child) => sum + child.getBoundingClientRect().width,
        0,
      );
      if (used > widest) widest = used;
    });
    if (widest <= 0) return;

    const widthPerPx = widest / fontSize;
    const fitted = clamp(7, (columnWidth * 0.995) / widthPerPx, 60);
    // Deadband, so sub-pixel rounding cannot start an endless resize loop.
    if (Math.abs(fitted - fontSize) > 0.4) setFontSize(fitted);
  }, [fontReady, columnWidth, family, page, fontSize]);

  const lineHeight = fontSize * 1.95;
  const chromeFont = clamp(9, wrapWidth * 0.018, 15);

  /**
   * Whether a line closes a surah.
   *
   * Every line of the printed page is stretched to fill the column except the
   * one a surah ends on, which is centred. This cannot be decided by measuring
   * the rendered words: a QCF glyph is the bare word with no space built into
   * it, so even a full print line's glyphs sum to well under the column width
   * and a measurement reads it as short.
   *
   * It is structural instead - a line is short exactly when the final ayah of a
   * surah closes on it.
   */
  const closesASurah = (words: MushafWord[]) =>
    words.some((word) => {
      if (word.char_type_name !== "end") return false;
      const [surahId, verseNumber] = word.verse_key.split(":").map(Number);
      const surah = page?.surahs.find((s) => s.id === surahId);
      return !!surah && verseNumber === surah.verses_count;
    });

  /**
   * Resolve the blank slots above each surah's first line into its header and,
   * where the surah has one, its basmala.
   */
  const lineSlots = useMemo(() => {
    const roles = new Map<number, LineRole>();

    if (page) {
      Object.entries(page.surahStartLines).forEach(([surahId, startLine]) => {
        const surah = page.surahs.find((s) => s.id === Number(surahId));
        if (!surah) return;

        const wantsBasmala = !!surah.bismillah_pre;
        const room = wantsBasmala ? 2 : 1;

        // Only the slots immediately above count. The opening pages carry a
        // large block of decorative space, and claiming all of it as headers
        // would fill the page with bands.
        const blanks: number[] = [];
        for (let n = startLine - 1; n >= 1 && blanks.length < room; n--) {
          if (page.lines[n - 1]?.words.length) break;
          blanks.unshift(n);
        }

        if (blanks.length === 2) {
          roles.set(blanks[0], { type: "surah", surah });
          roles.set(blanks[1], { type: "basmala", surah });
        } else if (blanks.length === 1) {
          // Only one slot fits above the first verse, so it holds whichever of
          // the two comes last. The other was printed on the previous page.
          roles.set(blanks[0], { type: wantsBasmala ? "basmala" : "surah", surah });
        }
      });

      // The opening lines of the surah that starts on the NEXT page, printed
      // down here because they did not all fit above its first verse.
      const trailing = page.trailingSurahHeader;
      if (trailing) {
        const lastSlot = trailing.includesBasmala ? 14 : 15;
        roles.set(lastSlot, { type: "surah", surah: trailing.surah });
        if (trailing.includesBasmala) {
          roles.set(15, { type: "basmala", surah: trailing.surah });
        }
      }
    }

    return Array.from({ length: LINES_PER_PAGE }, (_, i) => {
      const lineNumber = i + 1;
      return {
        lineNumber,
        words: page?.lines[i]?.words ?? [],
        role: roles.get(lineNumber),
      };
    });
  }, [page]);

  if (isLoading) {
    return (
      <Frame wrapRef={wrapRef} width={wrapWidth}>
        <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <Loader2 className="w-8 h-8 animate-spin text-mushaf-gold" />
        </div>
      </Frame>
    );
  }

  if (!page) {
    return (
      <Frame wrapRef={wrapRef} width={wrapWidth}>
        <div
          className="flex items-center justify-center text-mushaf-brown"
          style={{ minHeight: "40vh", fontFamily: "'Noto Naskh Arabic', serif" }}
        >
          صفحة غير متوفرة
        </div>
      </Frame>
    );
  }

  // The running head names the surah the page ends in, as the print does.
  const headSurah = page.surahs[page.surahs.length - 1];
  const juzName = page.juzNumber ? JUZ_NAMES[page.juzNumber] : "";

  /**
   * Pages 1 and 2 are the opening pages. The print sets their eight lines
   * inside a large decorative frame instead of running to fifteen, so the empty
   * slots below the text are dropped rather than padding the sheet out with
   * half a blank page.
   */
  const isOpeningPage = page.pageNumber <= 2;
  const lastFilledSlot = lineSlots.reduce(
    (last, slot, i) => (slot.words.length || slot.role ? i + 1 : last),
    0,
  );
  const visibleSlots =
    isOpeningPage && lastFilledSlot > 0 ? lineSlots.slice(0, lastFilledSlot) : lineSlots;

  /**
   * A line is stretched to fill the column only while the text carries on past
   * it. The two cases where it does not are a line a surah ends on, and the
   * line that ends a page whose text stops before the fifteenth - the opening
   * pages, where the block sits inside a large decorative frame. Stretching
   * either one tears its last few words apart across the full width.
   */
  const lastSlotWithWords = lineSlots.reduce(
    (last, slot, i) => (slot.words.length ? i + 1 : last),
    0,
  );
  const blockEndsEarly = lastFilledSlot > 0 && lastFilledSlot < LINES_PER_PAGE;

  return (
    <Frame wrapRef={wrapRef} width={wrapWidth}>
      {/* running head - surah on one side, juz on the other */}
      <div
        dir="rtl"
        className="flex justify-between items-baseline gap-2 pb-1 mb-1 sm:pb-2 sm:mb-2"
        style={{
          borderBottom: "1px solid #ddc9a0",
          fontFamily: "'Noto Naskh Arabic', serif",
          color: "#7a5c34",
          fontSize: chromeFont,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {headSurah?.name_arabic ?? ""}
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{juzName}</span>
      </div>

      <div
        ref={columnRef}
        dir="rtl"
        style={isOpeningPage ? { paddingBlock: lineHeight * 0.9 } : undefined}
      >
        {visibleSlots.map(({ lineNumber, words, role }) => {
          if (role?.type === "surah") {
            return (
              <SurahHeader
                key={lineNumber}
                surah={role.surah}
                height={lineHeight}
                fontSize={fontSize * 0.62}
              />
            );
          }

          if (role?.type === "basmala") {
            return (
              <div
                key={lineNumber}
                className="flex items-center justify-center"
                style={{
                  height: lineHeight,
                  fontFamily: "'Noto Naskh Arabic', serif",
                  // Naskh text, not a QCF glyph line, so it has no fitted width
                  // of its own - capped against the column so the basmala does
                  // not run past the frame on a narrow screen.
                  fontSize: Math.min(fontSize * 0.85, columnWidth / 13),
                  color: "#1b1813",
                  whiteSpace: "nowrap",
                }}
              >
                {BASMALA}
              </div>
            );
          }

          return (
            <MushafLine
              key={lineNumber}
              lineNumber={lineNumber}
              words={words}
              fontFamily={family}
              fontSize={fontSize}
              height={lineHeight}
              justified={
                !closesASurah(words) &&
                !(blockEndsEarly && lineNumber === lastSlotWithWords)
              }
              onWordClick={onVerseSelect}
              selectedVerseKeys={selectedVerseKeys}
              hoveredVerseKey={hoveredVerseKey}
              onVerseHover={setHoveredVerseKey}
            />
          );
        })}
      </div>

      {/* page number in its medallion */}
      <div
        className="flex justify-center mt-1 pt-1 sm:mt-2 sm:pt-2"
        style={{ borderTop: "1px solid #ddc9a0" }}
      >
        <span
          className="inline-flex items-center justify-center"
          style={{
            width: chromeFont * 2.3,
            height: chromeFont * 2.3,
            borderRadius: "50%",
            border: "1px solid #b08f52",
            boxShadow: "inset 0 0 0 2px #fbf5e6, inset 0 0 0 3px #d8bc83",
            fontFamily: "'Noto Naskh Arabic', serif",
            color: "#6b4f2a",
            fontSize: chromeFont,
          }}
        >
          {toArabicNumerals(page.pageNumber)}
        </span>
      </div>
    </Frame>
  );
};
