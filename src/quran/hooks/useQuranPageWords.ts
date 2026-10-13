import { useQuery } from "@tanstack/react-query";
import type { QuranPageApiResponse, MushafPage, SurahInfo, VerseMetadata, MushafLine, MushafWord } from "@/quran/types/mushaf";

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
    bismillah_pre: !!data.chapter.bismillah_pre,
  };
  
  surahCache.set(surahNumber, surahInfo);
  return surahInfo;
};

/**
 * Raw by_page responses, memoised for the session.
 *
 * Assembling one page needs its neighbours too (see assemblePageWords), and
 * reading consecutive pages is the normal way this viewer is used, so without
 * this each page would be fetched three times over. The Quran text never
 * changes, so caching it permanently is safe.
 */
const rawPageCache = new Map<number, Promise<QuranPageApiResponse>>();

const fetchRawPage = (page: number): Promise<QuranPageApiResponse> => {
  if (page < 1 || page > 604) return Promise.resolve({ verses: [] });

  const cached = rawPageCache.get(page);
  if (cached) return cached;

  // code_v1/code_v2 are the QCF glyph codes the page is drawn from.
  // text_uthmani is kept for accessibility and anything needing plain text.
  // page_number is per word, and is what makes the assembly below possible.
  const request = fetch(
    `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,code_v1,code_v2,line_number,position,verse_key,char_type_name,page_number&fields=verse_key,verse_number,juz_number,hizb_number,rub_el_hizb,sajdah_number,page_number&per_page=300`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch Quran page: ${response.status}`);
      }
      return response.json() as Promise<QuranPageApiResponse>;
    })
    .catch((error) => {
      // Don't cache a failure, or the page stays broken for the session.
      rawPageCache.delete(page);
      throw error;
    });

  rawPageCache.set(page, request);
  return request;
};

/**
 * Collect every word actually printed on `page`.
 *
 * by_page groups by verse, and the API's verse-to-page assignment does not
 * always agree with where the words are printed. It misfiles in both
 * directions: by_page/568 hands back verse 69:35, which is entirely on page
 * 567, while the words that fill line 15 of page 533 are only returned by
 * by_page/534. Trusting the response as-is drew a neighbouring page's words in
 * this page's font, which produces scrambled Arabic rather than an obvious
 * failure; dropping them alone left real lines blank instead.
 *
 * Each word carries its own page_number, so the reliable page is the union of
 * three responses keeping only the words that say they belong here.
 */
const assemblePageWords = async (page: number) => {
  const sources = await Promise.all([
    fetchRawPage(page - 1),
    fetchRawPage(page),
    fetchRawPage(page + 1),
  ]);

  const byVerse = new Map<
    string,
    { verse: QuranPageApiResponse['verses'][number]; words: Map<number, MushafWord> }
  >();

  sources.forEach((source, index) => {
    const fetchedUnder = page - 1 + index;

    (source.verses ?? []).forEach((verse) => {
      const mine = verse.words.filter((word) =>
        // Fall back to the page it was fetched under, so a response missing the
        // field degrades to the old behaviour rather than to a blank page.
        word.page_number === undefined ? fetchedUnder === page : word.page_number === page,
      );
      if (mine.length === 0) return;

      let entry = byVerse.get(verse.verse_key);
      if (!entry) {
        entry = { verse, words: new Map() };
        byVerse.set(verse.verse_key, entry);
      }
      // Keyed by word id: a verse straddling a page break is returned by more
      // than one source, and its words must not be duplicated.
      mine.forEach((word) => entry!.words.set(word.id, word));
    });
  });

  return [...byVerse.values()]
    .map(({ verse, words }) => ({ ...verse, words: [...words.values()] }))
    .sort((a, b) => {
      const [aSurah, aVerse] = a.verse_key.split(':').map(Number);
      const [bSurah, bVerse] = b.verse_key.split(':').map(Number);
      return aSurah !== bSurah ? aSurah - bSurah : aVerse - bVerse;
    });
};

type AssembledVerses = Awaited<ReturnType<typeof assemblePageWords>>;

const occupiedLines = (verses: AssembledVerses) => {
  const occupied = new Set<number>();
  verses.forEach(v => v.words.forEach(w => { if (w.line_number) occupied.add(w.line_number); }));
  return occupied;
};

/** The earliest surah opening on a page, and the line its first verse sits on. */
const firstSurahOpening = (verses: AssembledVerses) => {
  let best: { surah: number; line: number } | null = null;
  verses.forEach((v) => {
    const [surah, verseNumber] = v.verse_key.split(':').map(Number);
    if (verseNumber !== 1) return;
    const opener = v.words.find(w => w.position === 1 && w.line_number);
    if (!opener?.line_number) return;
    if (!best || opener.line_number < best.line) best = { surah, line: opener.line_number };
  });
  return best;
};

/**
 * A surah's opening lines - its header band and basmala - are printed above its
 * first verse, and when that verse sits too near the top of a page they do not
 * all fit above it. The remainder is printed on the previous page's last lines.
 *
 * Surah 'Abasa is the case in point: it needs a header and a basmala, its first
 * verse is on line 2 of page 585, so only the basmala fits there and the header
 * band is printed on line 15 of page 584. Without this that line stays blank.
 */
const trailingHeaderFor = async (page: number, thisPageOccupied: Set<number>) => {
  if (page >= 604) return undefined;

  const nextVerses = await assemblePageWords(page + 1);
  const opening = firstSurahOpening(nextVerses);
  if (!opening) return undefined;

  const nextOccupied = occupiedLines(nextVerses);
  let roomOnNextPage = 0;
  for (let n = opening.line - 1; n >= 1 && !nextOccupied.has(n); n--) roomOnNextPage++;

  const surah = await fetchSurahInfo(opening.surah);
  const needed = 1 + (surah.bismillah_pre ? 1 : 0);
  const spill = needed - roomOnNextPage;
  if (spill <= 0) return undefined;

  // Only onto lines this page actually has free at the bottom.
  for (let n = 15; n > 15 - spill; n--) {
    if (thisPageOccupied.has(n)) return undefined;
  }

  return { surah, includesBasmala: spill >= 2 };
};

const fetchQuranPageWords = async (page: number): Promise<MushafPage> => {
  try {
    const verses = await assemblePageWords(page);

    // Only surahs with words printed here, so a verse belonging to a
    // neighbouring page cannot name a surah the page never shows.
    const surahNumbers = [...new Set(verses.map(v => parseInt(v.verse_key.split(':')[0])))];
    const surahs = await Promise.all(surahNumbers.map(num => fetchSurahInfo(num)));

    const formatted = formatPageWords({ verses }, page, surahs);
    formatted.trailingSurahHeader = await trailingHeaderFor(page, occupiedLines(verses));
    return formatted;
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

    // Already narrowed to this page by assemblePageWords.
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

  // Which line each surah opens on. Walking the lines in printed order means
  // the first verse's first word is found where it actually sits, which is what
  // identifies the blank slots above it as that surah's header and basmala.
  const surahStartLines: Record<number, number> = {};
  lines.forEach((line) => {
    line.words.forEach((word) => {
      const [surah, verse] = word.verse_key.split(':').map(Number);
      if (verse === 1 && word.position === 1 && surahStartLines[surah] === undefined) {
        surahStartLines[surah] = line.lineNumber;
      }
    });
  });

  // Get juz/hizb info from first verse
  const firstVerse = verses[0];

  return {
    pageNumber,
    lines,
    verses,
    surahs,
    surahStartLines,
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
