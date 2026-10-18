import { QCF_CODE_FIELD } from "@/quran/hooks/useQcfFont";
import type { MushafWord } from "@/quran/types/mushaf";

/** Space between the words of a centred line, in em. The page fits lines with it. */
export const CENTRED_WORD_GAP = 0.35;

interface MushafLineProps {
  words: MushafWord[];
  lineNumber: number;
  /** The page's QCF family - each page has its own. */
  fontFamily: string;
  fontSize: number;
  height: number;
  /**
   * Whether this line was stretched edge to edge in the print. Measured by the
   * page, which is the only place that knows the column width. `undefined`
   * means not measured yet, and is treated as stretched so the first paint
   * already sits close to its final position.
   */
  justified?: boolean;
  onWordClick?: (verseKey: string) => void;
  selectedVerseKeys?: string[];
  hoveredVerseKey?: string | null;
  onVerseHover?: (verseKey: string | null) => void;
}

export const MushafLine = ({
  words,
  lineNumber,
  fontFamily,
  fontSize,
  height,
  justified,
  onWordClick,
  selectedVerseKeys = [],
  hoveredVerseKey = null,
  onVerseHover,
}: MushafLineProps) => {
  if (!words || words.length === 0) {
    return <div style={{ height }} />;
  }

  return (
    <div
      data-line={lineNumber}
      dir="rtl"
      className="flex items-center"
      style={{
        height,
        fontFamily,
        fontSize,
        lineHeight: 1,
        color: "#1b1813",
        // A print line fills the column; the line that closes a surah sits
        // centred instead. Stretching that one is what made the old renderer
        // look wrong.
        justifyContent: justified === false ? "center" : "space-between",
        gap: justified === false ? `${CENTRED_WORD_GAP}em` : undefined,
      }}
    >
      {words.map((word, index) => {
        const isSelected = selectedVerseKeys.includes(word.verse_key);
        const isHovered = hoveredVerseKey === word.verse_key;
        const glyphs = word[QCF_CODE_FIELD] ?? "";

        return (
          <span
            key={`${word.id}-${index}`}
            onClick={() => onWordClick?.(word.verse_key)}
            onMouseEnter={() => onVerseHover?.(word.verse_key)}
            onMouseLeave={() => onVerseHover?.(null)}
            title={word.verse_key}
            // text_uthmani so the line is still readable to a screen reader and
            // to copy/paste - the glyph codes are meaningless outside the font.
            aria-label={word.text_uthmani}
            style={{
              cursor: onWordClick ? "pointer" : "default",
              borderRadius: 3,
              // Background rather than padding: padding here would widen the
              // words and push the line out of its printed justification.
              background: isSelected
                ? "rgba(201,162,39,.38)"
                : isHovered
                  ? "rgba(201,162,39,.16)"
                  : "transparent",
              transition: "background .12s",
            }}
          >
            {/*
              Verse-end words carry the ornamented medallion with its number
              already inside it, so nothing is drawn on top of them here.
            */}
            {glyphs}
          </span>
        );
      })}
    </div>
  );
};
