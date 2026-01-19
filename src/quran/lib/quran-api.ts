
import { SurahInfo, AyahInfo, CompleteQuranResponse } from "@/quran/types/quran-api";

const API_BASE_URL = "https://api.quran.com/api/v4";

export async function fetchSurahList() {
  const response = await fetch(`${API_BASE_URL}/chapters?language=en`);
  if (!response.ok) {
    throw new Error("Failed to fetch surah list");
  }
  const data = await response.json();
  return data.chapters;
}

export async function fetchAyah(surahNo: number, ayahNo: number): Promise<AyahInfo> {
  const response = await fetch(`${API_BASE_URL}/verses/by_key/${surahNo}:${ayahNo}?language=en&words=true`);
  if (!response.ok) {
    throw new Error("Failed to fetch ayah");
  }
  return response.json();
}

export async function fetchSurah(surahNo: number): Promise<CompleteQuranResponse> {
  const response = await fetch(`${API_BASE_URL}/quran/verses/uthmani?chapter_number=${surahNo}`);
  if (!response.ok) {
    throw new Error("Failed to fetch surah");
  }
  return response.json();
}

export async function fetchPage(pageNo: number): Promise<{
  verses: Array<{
    text_uthmani: string;
    verse_key: string;
  }>;
}> {
  const response = await fetch(`${API_BASE_URL}/quran/verses/uthmani?page_number=${pageNo}`);
  if (!response.ok) {
    throw new Error("Failed to fetch page");
  }
  return response.json();
}

export async function getVerseMetadata(verseKey: string): Promise<{ page_number: number }> {
  const response = await fetch(`${API_BASE_URL}/verses/by_key/${verseKey}?fields=page_number`);
  if (!response.ok) {
    throw new Error("Failed to fetch verse metadata");
  }
  const data = await response.json();
  return { page_number: data.verse.page_number };
}

export async function getVersesPages(surah: string, verses: string): Promise<number> {
  try {
    // Convert surah name to number using the full list
    const surahList = await fetchSurahList();
    const surahData = surahList.find(s => s.name_simple.toLowerCase() === surah.toLowerCase());
    if (!surahData) {
      throw new Error(`Surah ${surah} not found`);
    }

    const surahNumber = surahData.id;
    const [startVerse, endVerse] = verses.split('-').map(v => parseInt(v.trim()));

    // Get page numbers for start and end verses
    const startKey = `${surahNumber}:${startVerse}`;
    const endKey = `${surahNumber}:${endVerse}`;

    const [startMeta, endMeta] = await Promise.all([
      getVerseMetadata(startKey),
      getVerseMetadata(endKey)
    ]);

    // Calculate total pages
    const totalPages = endMeta.page_number - startMeta.page_number + 1;
    return totalPages;
  } catch (error) {
    console.error('Error calculating pages:', error);
    return 1; // Return 1 as fallback
  }
}
