export interface Juz {
    number: number;
    name_arabic: string;
    startSurah: number;
    startVerse: number;
}

// Each Juz starts at a specific Surah and Verse
export const JUZ_DATA: Juz[] = [
    { number: 1, name_arabic: "الجزء الأول", startSurah: 1, startVerse: 1 },
    { number: 2, name_arabic: "الجزء الثاني", startSurah: 2, startVerse: 142 },
    { number: 3, name_arabic: "الجزء الثالث", startSurah: 2, startVerse: 253 },
    { number: 4, name_arabic: "الجزء الرابع", startSurah: 3, startVerse: 93 },
    { number: 5, name_arabic: "الجزء الخامس", startSurah: 4, startVerse: 24 },
    { number: 6, name_arabic: "الجزء السادس", startSurah: 4, startVerse: 148 },
    { number: 7, name_arabic: "الجزء السابع", startSurah: 5, startVerse: 82 },
    { number: 8, name_arabic: "الجزء الثامن", startSurah: 6, startVerse: 111 },
    { number: 9, name_arabic: "الجزء التاسع", startSurah: 7, startVerse: 88 },
    { number: 10, name_arabic: "الجزء العاشر", startSurah: 8, startVerse: 41 },
    { number: 11, name_arabic: "الجزء الحادي عشر", startSurah: 9, startVerse: 93 },
    { number: 12, name_arabic: "الجزء الثاني عشر", startSurah: 11, startVerse: 6 },
    { number: 13, name_arabic: "الجزء الثالث عشر", startSurah: 12, startVerse: 53 },
    { number: 14, name_arabic: "الجزء الرابع عشر", startSurah: 15, startVerse: 1 },
    { number: 15, name_arabic: "الجزء الخامس عشر", startSurah: 17, startVerse: 1 },
    { number: 16, name_arabic: "الجزء السادس عشر", startSurah: 18, startVerse: 75 },
    { number: 17, name_arabic: "الجزء السابع عشر", startSurah: 21, startVerse: 1 },
    { number: 18, name_arabic: "الجزء الثامن عشر", startSurah: 23, startVerse: 1 },
    { number: 19, name_arabic: "الجزء التاسع عشر", startSurah: 25, startVerse: 21 },
    { number: 20, name_arabic: "الجزء العشرون", startSurah: 27, startVerse: 56 },
    { number: 21, name_arabic: "الجزء الحادي والعشرون", startSurah: 29, startVerse: 46 },
    { number: 22, name_arabic: "الجزء الثاني والعشرون", startSurah: 33, startVerse: 31 },
    { number: 23, name_arabic: "الجزء الثالث والعشرون", startSurah: 36, startVerse: 28 },
    { number: 24, name_arabic: "الجزء الرابع والعشرون", startSurah: 39, startVerse: 32 },
    { number: 25, name_arabic: "الجزء الخامس والعشرون", startSurah: 41, startVerse: 47 },
    { number: 26, name_arabic: "الجزء السادس والعشرون", startSurah: 46, startVerse: 1 },
    { number: 27, name_arabic: "الجزء السابع والعشرون", startSurah: 51, startVerse: 31 },
    { number: 28, name_arabic: "الجزء الثامن والعشرون", startSurah: 58, startVerse: 1 },
    { number: 29, name_arabic: "الجزء التاسع والعشرون", startSurah: 67, startVerse: 1 },
    { number: 30, name_arabic: "الجزء الثلاثون", startSurah: 78, startVerse: 1 },
];
