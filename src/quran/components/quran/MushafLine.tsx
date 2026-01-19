import { toArabicNumerals } from "@/quran/lib/mushaf-formatter";
import type { MushafWord } from "@/quran/types/mushaf";

interface MushafLineProps {
  words: MushafWord[];
  lineNumber: number;
  isLastLine?: boolean;
  isOpeningPage?: boolean;
  onWordClick?: (verseKey: string) => void;
  selectedVerseKeys?: string[];
  verseEndingWordIds?: Set<number>;
}

export const MushafLine = ({ 
  words, 
  lineNumber,
  isLastLine = false,
  isOpeningPage = false,
  onWordClick, 
  selectedVerseKeys = [],
  verseEndingWordIds = new Set()
}: MushafLineProps) => {
  if (!words || words.length === 0) {
    return <div className={isOpeningPage ? "mushaf-line-opening" : "mushaf-line-traditional"} />;
  }

  // Filter out API's verse end markers for display (we'll render our own)
  const actualWords = words.filter(word => word.char_type_name !== "end");
  
  if (actualWords.length === 0) {
    return <div className={isOpeningPage ? "mushaf-line-opening" : "mushaf-line-traditional"} />;
  }

  const lineClass = isOpeningPage ? "mushaf-line-opening" : "mushaf-line-traditional";

  return (
    <div className={lineClass} dir="rtl">
      {actualWords.map((word, index) => {
        const isSelected = selectedVerseKeys.includes(word.verse_key);
        // Show verse marker if this word ID is in the set of verse-ending words
        const showVerseMarker = verseEndingWordIds.has(word.id);

        return (
          <span key={`${word.id}-${index}`} className="mushaf-word-wrapper">
            <span
              className={`mushaf-word-traditional ${isSelected ? 'selected' : ''} ${onWordClick ? 'cursor-pointer' : ''}`}
              onClick={() => onWordClick?.(word.verse_key)}
            >
              {word.text_uthmani}
            </span>
            {showVerseMarker && (
              <span className="verse-marker-traditional">
                {toArabicNumerals(word.verse_number)}
              </span>
            )}
            {index < actualWords.length - 1 && '\u200A'}
          </span>
        );
      })}
    </div>
  );
};
