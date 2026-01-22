import { useQuery } from "@tanstack/react-query";
import type { QuranPageApiResponse, MushafPage, SurahInfo, VerseMetadata, MushafLine, MushafWord } from "@/types/mushaf";

// Cache for chapter/surah info to avoid repeated API calls
const surahCache: Map<number, SurahInfo> = new Map();

const fetchSurahInfo = async (surahNumber: number): Promise<SurahInfo> => {
  if (surahCache.has(surahNumber)) {
    return surahCache.get(surahNumber)!;
  }
  
  const response = await fetch(`https://api.quran.com/api/v4/chapters/${surahNumber}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch surah info: ${response.status}`);
  }
  
  const data = await response.json();
  const surahInfo: SurahInfo = {
    id: data.chapter.id,
    name_arabic: data.chapter.name_arabic,
    name_simple: data.chapter.name_simple,
    revelation_place: data.chapter.revelation_place,
    verses_count: data.chapter.verses_count,
  };
  
  surahCache.set(surahNumber, surahInfo);
  return surahInfo;
};

const fetchQuranPageWords = async (page: number): Promise<MushafPage> => {
  try {
    console.log(`Fetching Quran page ${page} with word details`);
    
    // Fetch verses with all metadata
    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,line_number,position,verse_key,char_type_name&fields=verse_key,verse_number,juz_number,hizb_number,rub_el_hizb,sajdah_number,page_number`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Quran page: ${response.status}`);
    }
    
    const data: QuranPageApiResponse = await response.json();
    
    // Extract unique surah numbers from this page
    const surahNumbers = [...new Set(data.verses.map(v => parseInt(v.verse_key.split(':')[0])))];
    
    // Fetch surah info for all surahs on this page
    const surahsPromises = surahNumbers.map(num => fetchSurahInfo(num));
    const surahs = await Promise.all(surahsPromises);
    
    // Format the page data
    return formatPageWords(data, page, surahs);
  } catch (error) {
    console.error("Error fetching Quran page words:", error);
    throw error;
  }
};

const formatPageWords = (data: QuranPageApiResponse, pageNumber: number, surahs: SurahInfo[]): MushafPage => {
  const lines: MushafLine[] = [];
  const allWords: MushafWord[] = [];
  const verses: VerseMetadata[] = [];

  // Extract all words and verse metadata
  data.verses.forEach((verse) => {
    verses.push({
      verse_number: verse.verse_number,
      verse_key: verse.verse_key,
      juz_number: verse.juz_number,
      hizb_number: verse.hizb_number,
      rub_el_hizb: verse.rub_el_hizb,
      sajdah_number: verse.sajdah_number,
      page_number: verse.page_number,
    });

    verse.words.forEach((word) => {
      allWords.push({
        ...word,
        verse_number: verse.verse_number,
        verse_key: verse.verse_key,
      });
    });
  });

  // Group words by line number (1-15)
  const lineGroups = new Map<number, MushafWord[]>();
  
  allWords.forEach((word) => {
    const lineNum = word.line_number || 1;
    if (!lineGroups.has(lineNum)) {
      lineGroups.set(lineNum, []);
    }
    lineGroups.get(lineNum)!.push(word);
  });

  // Convert to MushafLine array (ensure 15 lines)
  // Sort words within each line by verse_key then position to ensure correct reading order
  for (let i = 1; i <= 15; i++) {
    const lineWords = lineGroups.get(i) || [];
    // Sort by verse order first, then by position within verse
    lineWords.sort((a, b) => {
      const [aSurah, aVerse] = a.verse_key.split(':').map(Number);
      const [bSurah, bVerse] = b.verse_key.split(':').map(Number);
      if (aSurah !== bSurah) return aSurah - bSurah;
      if (aVerse !== bVerse) return aVerse - bVerse;
      return a.position - b.position;
    });
    lines.push({
      lineNumber: i,
      words: lineWords,
    });
  }

  // Get juz/hizb info from first verse
  const firstVerse = verses[0];

  return {
    pageNumber,
    lines,
    verses,
    surahs,
    juzNumber: firstVerse?.juz_number,
    hizbNumber: firstVerse?.hizb_number,
    rubElHizb: firstVerse?.rub_el_hizb,
  };
};

export const useQuranPageWords = (page: number) => {
  return useQuery({
    queryKey: ["quran-page-words", page],
    queryFn: () => fetchQuranPageWords(page),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    enabled: page > 0 && page <= 604,
    retry: 3,
  });
};
