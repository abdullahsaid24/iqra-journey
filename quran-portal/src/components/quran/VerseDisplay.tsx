import { type QuranVerse } from "@/types/quran";
import { toArabicNumerals } from "@/lib/utils";

interface VerseDisplayProps {
  verses: QuranVerse[];
  lessonStart: number;
  lessonEnd: number;
  currentPage: number;
  onWordClick?: (surah: string, ayah: number, wordPosition: number, wordText: string) => void;
}

export const VerseDisplay = ({
  verses,
  lessonStart,
  lessonEnd,
  currentPage,
  onWordClick,
}: VerseDisplayProps) => {
  return (
    <div className="space-y-4">
      {currentPage === 1 && (
        <div className="mb-8 text-center">
          <p className="font-arabic text-3xl text-black">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>
      )}

      <div className="whitespace-pre-wrap text-right font-arabic text-2xl leading-loose" dir="rtl">
        {verses.map((verse) => {
          const words = verse.text_uthmani.split(" ");
          const [surahNumber, verseNumber] = verse.verse_key.split(":");
          const verseNumberInt = parseInt(verseNumber);

          return (
            <span
              key={verse.verse_key}
              className={`inline ${
                verseNumberInt === lessonStart
                  ? "border-b-2 border-quran-primary"
                  : verseNumberInt === lessonEnd
                  ? "border-b-2 border-quran-secondary"
                  : ""
              }`}
            >
              {words.map((word, index) => (
                <span
                  key={`${verse.verse_key}-${index}`}
                  onClick={() =>
                    onWordClick?.(
                      surahNumber,
                      verseNumberInt,
                      index + 1,
                      word
                    )
                  }
                  className="cursor-pointer hover:text-quran-primary transition-colors"
                >
                  {word}{" "}
                </span>
              ))}
              <span className="mx-1 text-sm text-quran-secondary">
                ﴿{toArabicNumerals(verseNumberInt)}﴾
              </span>{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
};