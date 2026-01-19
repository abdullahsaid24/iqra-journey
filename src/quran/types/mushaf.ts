export interface MushafWord {
  id: number;
  text_uthmani: string;
  line_number: number;
  position: number;
  verse_key: string;
  verse_number: number;
  char_type_name?: string; // "word" for regular words, "end" for verse markers
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
}

export interface MushafPage {
  pageNumber: number;
  lines: MushafLine[];
  verses: VerseMetadata[];
  surahs: SurahInfo[]; // Surahs that appear on this page
  juzNumber?: number;
  hizbNumber?: number;
  rubElHizb?: number;
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
  };
}
