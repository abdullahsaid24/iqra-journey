import { MushafLine } from "./MushafLine";
import { SurahHeader } from "./SurahHeader";
import { toArabicNumerals } from "@/lib/mushaf-formatter";
import type { MushafPage, SurahInfo, MushafWord } from "@/types/mushaf";
import { Loader2 } from "lucide-react";

interface MushafPageProps {
  page: MushafPage | undefined;
  isLoading: boolean;
  onVerseSelect?: (verseKey: string) => void;
  selectedVerseKeys?: string[];
}

// Juz names in Arabic
const JUZ_NAMES: Record<number, string> = {
  1: "الجزء الأول", 2: "الجزء الثاني", 3: "الجزء الثالث", 4: "الجزء الرابع",
  5: "الجزء الخامس", 6: "الجزء السادس", 7: "الجزء السابع", 8: "الجزء الثامن",
  9: "الجزء التاسع", 10: "الجزء العاشر", 11: "الجزء الحادي عشر", 12: "الجزء الثاني عشر",
  13: "الجزء الثالث عشر", 14: "الجزء الرابع عشر", 15: "الجزء الخامس عشر", 16: "الجزء السادس عشر",
  17: "الجزء السابع عشر", 18: "الجزء الثامن عشر", 19: "الجزء التاسع عشر", 20: "الجزء العشرون",
  21: "الجزء الحادي والعشرون", 22: "الجزء الثاني والعشرون", 23: "الجزء الثالث والعشرون",
  24: "الجزء الرابع والعشرون", 25: "الجزء الخامس والعشرون", 26: "الجزء السادس والعشرون",
  27: "الجزء السابع والعشرون", 28: "الجزء الثامن والعشرون", 29: "الجزء التاسع والعشرون",
  30: "الجزء الثلاثون"
};

// Helper to get all words from all lines (excluding "end" markers)
const getAllPageWords = (page: MushafPage): MushafWord[] => {
  const allWords: MushafWord[] = [];
  page.lines.forEach(line => {
    line.words.forEach(word => {
      if (word.char_type_name !== "end") {
        allWords.push(word);
      }
    });
  });
  return allWords;
};

// Find all word IDs that are the last word of their verse on this page
const findVerseEndingWordIds = (page: MushafPage): Set<number> => {
  const endingWordIds = new Set<number>();
  const allWords = getAllPageWords(page);
  
  for (let i = 0; i < allWords.length; i++) {
    const currentWord = allWords[i];
    const nextWord = allWords[i + 1];
    
    // If this is the last word on the page, or the next word is from a different verse
    if (!nextWord || nextWord.verse_key !== currentWord.verse_key) {
      endingWordIds.add(currentWord.id);
    }
  }
  
  return endingWordIds;
};

// Special opening page component for pages 1 and 2
const OpeningPage = ({ 
  page, 
  onVerseSelect, 
  selectedVerseKeys,
  verseEndingWordIds
}: { 
  page: MushafPage; 
  onVerseSelect?: (verseKey: string) => void;
  selectedVerseKeys: string[];
  verseEndingWordIds: Set<number>;
}) => {
  const firstSurah = page.surahs[0];
  
  return (
    <div className="mushaf-page-container">
      <div className="mushaf-opening-border">
        <div className="mushaf-opening-page">
          {/* Decorative top border */}
          <div className="opening-top-decoration">
            <div className="opening-ornament">❀ ❁ ❀</div>
          </div>
          
          {/* Surah title banner */}
          <div className="opening-surah-banner">
            <div className="opening-banner-ornament-left">۞</div>
            <span className="opening-surah-name">سُورَةُ {firstSurah?.name_arabic}</span>
            <div className="opening-banner-ornament-right">۞</div>
          </div>
          
          {/* Main content in decorative frame */}
          <div className="opening-content-frame">
            <div className="opening-content-inner">
              {page.lines.map((line) => {
                const actualWords = line.words.filter(w => w.char_type_name !== "end");
                if (actualWords.length === 0) return null;
                
                return (
                  <MushafLine
                    key={line.lineNumber}
                    words={line.words}
                    lineNumber={line.lineNumber}
                    isLastLine={false}
                    onWordClick={onVerseSelect}
                    selectedVerseKeys={selectedVerseKeys}
                    isOpeningPage={true}
                    verseEndingWordIds={verseEndingWordIds}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Decorative bottom border */}
          <div className="opening-bottom-decoration">
            <div className="opening-ornament">❀ ❁ ❀</div>
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
  selectedVerseKeys = [] 
}: MushafPageProps) => {
  if (isLoading) {
    return (
      <div className="mushaf-page-container">
        <div className="mushaf-traditional-border">
          <div className="mushaf-page">
            <div className="flex items-center justify-center h-full min-h-[600px]">
              <Loader2 className="w-8 h-8 animate-spin text-mushaf-gold" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="mushaf-page-container">
        <div className="mushaf-traditional-border">
          <div className="mushaf-page">
            <div className="flex items-center justify-center h-full text-mushaf-brown font-quran">
              صفحة غير متوفرة
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-compute which words are the last word of their verse on this page
  const verseEndingWordIds = findVerseEndingWordIds(page);

  // Special layout for opening pages (1 and 2)
  if (page.pageNumber === 1 || page.pageNumber === 2) {
    return (
      <OpeningPage 
        page={page} 
        onVerseSelect={onVerseSelect} 
        selectedVerseKeys={selectedVerseKeys}
        verseEndingWordIds={verseEndingWordIds}
      />
    );
  }

  // Determine which lines should show Surah headers and Basmallah
  const getLineMetadata = () => {
    const lineMetadata: Record<number, { showSurahHeader?: SurahInfo; showBasmallah?: boolean }> = {};
    let previousSurah = 0;
    
    page.lines.forEach((line) => {
      if (!line.words || line.words.length === 0) return;
      
      // Filter out "end" markers
      const actualWords = line.words.filter(w => w.char_type_name !== "end");
      if (actualWords.length === 0) return;
      
      const firstWord = actualWords[0];
      const lineSurah = parseInt(firstWord.verse_key.split(':')[0]);
      const lineVerse = firstWord.verse_number;
      
      // Check if this line starts a new surah
      if (lineVerse === 1 && lineSurah !== previousSurah) {
        const surahInfo = page.surahs.find(s => s.id === lineSurah);
        if (surahInfo) {
          lineMetadata[line.lineNumber] = {
            showSurahHeader: surahInfo,
            showBasmallah: lineSurah !== 1 && lineSurah !== 9 // No Basmallah for Fatiha (part of verse) or Tawbah
          };
        }
      }
      
      // Track the last surah seen
      const lastWord = actualWords[actualWords.length - 1];
      previousSurah = parseInt(lastWord.verse_key.split(':')[0]);
    });
    
    return lineMetadata;
  };
  
  const lineMetadata = getLineMetadata();

  // Get Juz info for header
  const juzName = page.juzNumber ? JUZ_NAMES[page.juzNumber] : "";

  // Get first surah name for header
  const firstSurah = page.surahs[0];
  const surahNameForHeader = firstSurah?.name_arabic || "";

  return (
    <div className="mushaf-page-container">
      <div className="mushaf-traditional-border">
        <div className="mushaf-page">
          {/* Traditional Page Header */}
          <div className="mushaf-header-traditional">
            <div className="mushaf-header-ornament-left">❁</div>
            <div className="mushaf-header-center">
              <span className="mushaf-surah-name-header">{surahNameForHeader}</span>
              <span className="mushaf-juz-indicator">{juzName}</span>
            </div>
            <div className="mushaf-header-ornament-right">❁</div>
          </div>
          
          <div className="mushaf-header-line-ornate" />

          {/* 15 Lines of Quran - Fixed height */}
          <div className="mushaf-content-traditional">
            {page.lines.map((line) => {
              const meta = lineMetadata[line.lineNumber];
              return (
                <div key={line.lineNumber} className="mushaf-line-wrapper">
                  {/* Surah Header if this line starts a new Surah */}
                  {meta?.showSurahHeader && (
                    <SurahHeader surah={meta.showSurahHeader} />
                  )}
                  {/* Basmallah if needed */}
                  {meta?.showBasmallah && (
                    <div className="basmallah-ornate">
                      <span className="basmallah-ornament">﴾</span>
                      <span className="basmallah-text-ornate">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</span>
                      <span className="basmallah-ornament">﴿</span>
                    </div>
                  )}
                  <MushafLine
                    words={line.words}
                    lineNumber={line.lineNumber}
                    isLastLine={line.lineNumber === 15}
                    onWordClick={onVerseSelect}
                    selectedVerseKeys={selectedVerseKeys}
                    verseEndingWordIds={verseEndingWordIds}
                  />
                </div>
              );
            })}
          </div>

          {/* Traditional Page Footer */}
          <div className="mushaf-footer-line-ornate" />
          <div className="mushaf-footer-traditional">
            <div className="mushaf-page-number-traditional">
              {toArabicNumerals(page.pageNumber)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
