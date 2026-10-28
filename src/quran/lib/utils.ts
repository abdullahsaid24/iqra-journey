
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toArabicNumerals = (num: number | undefined) => {
  if (num === undefined) return "";
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((d) => arabicNumerals[parseInt(d)])
    .join("");
};

export const cleanVerseReferences = (text: string | undefined): string => {
  if (!text) return '';
  
  // First, standardize the formatting
  let cleaned = text.replace(/\s*:\s*/g, ':').replace(/\s*-\s*/g, '-');
  
  // Extract surah name and verses part
  const parts = cleaned.split(':');
  
  if (parts.length < 2) {
    // If there's no colon, just return the standardized text
    return cleaned;
  }
  
  const surahName = parts[0].trim();
  const versePart = parts[1].trim();
  
  // Process verse numbers and preserve ranges
  const processedVerses = versePart.split('-').map(verse => {
    // Extract only the numeric part from verse references
    const numericPart = verse.replace(/[^0-9]/g, '');
    return numericPart;
  }).join('-');
  
  // Reconstruct the cleaned reference
  return `${surahName}: ${processedVerses}`;
};

export const formatLessonDisplay = (surah: string | undefined, verses: string | undefined) => {
  if (!surah || !verses) return 'Not set';
  
  // Handle Ahsanul Qawaid lessons (surah starts with "Lesson")
  if (surah && surah.startsWith('Lesson')) {
    return surah; // Already properly formatted like "Lesson 1" or "Lesson 1-4"
  }

  // Handle Noor Al Bayan lessons (surah starts with "Page")
  if (surah && surah.startsWith('Page')) {
    return surah; // Already properly formatted like "Page 1" or "Page 1-4"
  }
  
  // Handle Full Quran lessons with surah names and numbers in format "Name (Number)"
  // Display as-is since it's already formatted nicely
  if (surah && surah.match(/\(\d+\)/)) {
    return surah; // Shows "Al-Baqarah (2)" or "Al-Baqarah (2) - Al-Imran (3)"
  }
  
  // Check if verses already contains a range
  if (verses.includes('-')) {
    return `${surah}: ${verses}`;
  } 
  
  // For cases where we previously may have lost the range, try to reconstruct it from the surah string
  if (surah && surah.includes(':')) {
    return cleanVerseReferences(surah);
  }
  
  // Return the properly formatted reference
  return `${surah}:${verses}`;
};

/**
 * Split a stored lesson's surah field back into its start and end surah.
 *
 * A lesson spanning two surahs is stored joined with a hyphen -
 * "Al-Ankaboot-Yaseen" - but 96 of the 114 surah names contain a hyphen
 * themselves, so the joining one cannot be found by position. Every hyphen is
 * tried instead, and the split is accepted only where both sides are real
 * surah names.
 *
 * This is what the lesson form needs to prefill its dropdowns. Handing a Select
 * the whole "Al-Ankaboot-Yaseen" string matches none of its options and renders
 * blank, which is why multi-surah lessons came up with empty fields while
 * single-surah ones were fine.
 */
export const splitSurahRange = (value?: string | null): { start: string; end: string } => {
  const raw = (value ?? '').trim();
  if (!raw) return { start: '', end: '' };

  const names = new Set(AVAILABLE_SURAHS.map(s => s.name));
  if (names.has(raw)) return { start: raw, end: raw };

  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== '-') continue;
    const left = raw.slice(0, i).trim();
    const right = raw.slice(i + 1).trim();
    if (names.has(left) && names.has(right)) return { start: left, end: right };
  }

  // Not a recognisable range - a book or page lesson, or a name that has since
  // changed. Left untouched rather than guessed at.
  return { start: raw, end: raw };
};
