export interface SurahInfo {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
  surahNo?: number;
}

export interface AyahInfo {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
  surahNo: number;
  ayahNo: number;
  english: string;
  arabic1: string;
  arabic2: string;
  audio?: {
    [key: string]: {
      reciter: string;
      url: string;
    };
  };
}

export interface CompleteQuranResponse {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
  surahNo: number;
  english: string[];
  arabic1: string[];
  arabic2: string[];
}

export interface Surah {
  number: number;
  name: string;
  name_arabic: string;
  name_simple: string;
  total_verses: number;
  revelation_place: string;
}

export interface HomeworkAssignment {
  id: string;
  student_id: string;
  surah: string;
  verses: string;
  status: 'pending' | 'passed' | 'failed';
  assigned_by: string;
  created_at: string;
  updated_at: string;
}