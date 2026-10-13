export interface MushafWord {
  id: number;
  text_uthmani: string;
  line_number: number;
  position: number;
  verse_key: string;
  verse_number: number;
  char_type_name?: string; // "word" for regular words, "end" for verse markers
  /**
   * The page this word is actually printed on, which is not always the page it
   * was fetched under - see the filter in useQuranPageWords.
   */
  page_number?: number;
  /**
   * The word drawn as a single glyph in the page's own QCF typeface - this is
   * what reproduces the printed mushaf rather than approximating it. A word may
   * carry two codes when it is followed by a pause mark.
   *
   * An "end" word's code is the ornamented ayah medallion with its number
   * already inside, so verse markers must not be drawn by hand on top.
   */
  code_v1?: string;
  code_v2?: string;
}

export interface MushafLine {
  lineNumber: number;
  words: MushafWord[];
}

export interface VerseMetadata {
  verse_number: number;
  verse_key: string;
  juz_number: number;
  hizb_number: number;
  rub_el_hizb: number;
  sajdah_number?: number | null;
  page_number: number;
}

export interface SurahInfo {
  id: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: string; // "makkah" or "madinah"
  verses_count: number;
  /**
   * Whether the surah opens with a standalone basmala line. Taken from the API
   * rather than assumed, so At-Tawbah correctly gets a header and no basmala.
   */
  bismillah_pre?: boolean;
}

export interface MushafPage {
  pageNumber: number;
  lines: MushafLine[];
  verses: VerseMetadata[];
  surahs: SurahInfo[]; // Surahs that appear on this page
  juzNumber?: number;
  hizbNumber?: number;
  rubElHizb?: number;
  /**
   * Which line each surah's first verse begins on. The API returns verse words
   * only, so the surah header and basmala lines are blank; this is what lets
   * those empty slots be identified and filled.
   */
  surahStartLines: Record<number, number>;
  /**
   * A surah header belonging to the surah that opens on the NEXT page, printed
   * on this page's last blank line because its opening lines did not all fit.
   * Surah 'Abasa is the clearest case: its header band is on page 584 while its
   * basmala and first verse are on 585.
   */
  trailingSurahHeader?: {
    surah: SurahInfo;
    /** True when the basmala spilled onto this page as well. */
    includesBasmala: boolean;
  };
}

export interface QuranPageApiResponse {
  verses: Array<{
    id: number;
    verse_number: number;
    verse_key: string;
    juz_number: number;
    hizb_number: number;
    rub_el_hizb: number;
    sajdah_number?: number | null;
    page_number: number;
    words: MushafWord[];
  }>;
}

export interface ChapterApiResponse {
  chapter: {
    id: number;
    name_arabic: string;
    name_simple: string;
    revelation_place: string;
    verses_count: number;
    bismillah_pre: boolean;
  };
}
