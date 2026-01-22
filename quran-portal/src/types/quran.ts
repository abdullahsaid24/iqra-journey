export interface Surah {
  number: number;
  name: string;
  name_arabic: string;
  versesCount: number;
}

export interface Lesson {
  surah: string;
  verses: string;
}

export interface QuranVerse {
  id: number;
  verse_key: string;
  text_uthmani: string;
}

export interface QuranWord {
  text_uthmani: string;
}

export interface QuranPageVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  words: QuranWord[];
}

export const AVAILABLE_SURAHS: Surah[] = [
  { number: 1, name: "Al-Fatiha", name_arabic: "الفاتحة", versesCount: 7 },
  { number: 2, name: "Al-Baqarah", name_arabic: "البقرة", versesCount: 286 },
  { number: 3, name: "Aal Imran", name_arabic: "آل عمران", versesCount: 200 },
  { number: 4, name: "An-Nisaa", name_arabic: "النساء", versesCount: 176 },
  { number: 5, name: "Al-Maa'idah", name_arabic: "المائدة", versesCount: 120 },
  { number: 6, name: "Al-An'aam", name_arabic: "الأنعام", versesCount: 165 },
  { number: 7, name: "Al-A'raaf", name_arabic: "الأعراف", versesCount: 206 },
  { number: 8, name: "Al-Anfaal", name_arabic: "الأنفال", versesCount: 75 },
  { number: 9, name: "At-Tawbah", name_arabic: "التوبة", versesCount: 129 },
  { number: 10, name: "Yunus", name_arabic: "يونس", versesCount: 109 },
  { number: 11, name: "Hud", name_arabic: "هود", versesCount: 123 },
  { number: 12, name: "Yusuf", name_arabic: "يوسف", versesCount: 111 },
  { number: 13, name: "Ar-Ra'd", name_arabic: "الرعد", versesCount: 43 },
  { number: 14, name: "Ibrahim", name_arabic: "ابراهيم", versesCount: 52 },
  { number: 15, name: "Al-Hijr", name_arabic: "الحجر", versesCount: 99 },
  { number: 16, name: "An-Nahl", name_arabic: "النحل", versesCount: 128 },
  { number: 17, name: "Al-Israa", name_arabic: "الإسراء", versesCount: 111 },
  { number: 18, name: "Al-Kahf", name_arabic: "الكهف", versesCount: 110 },
  { number: 19, name: "Maryam", name_arabic: "مريم", versesCount: 98 },
  { number: 20, name: "Taa-Haa", name_arabic: "طه", versesCount: 135 },
  { number: 21, name: "Al-Anbiyaa", name_arabic: "الأنبياء", versesCount: 112 },
  { number: 22, name: "Al-Hajj", name_arabic: "الحج", versesCount: 78 },
  { number: 23, name: "Al-Muminoon", name_arabic: "المؤمنون", versesCount: 118 },
  { number: 24, name: "An-Noor", name_arabic: "النور", versesCount: 64 },
  { number: 25, name: "Al-Furqaan", name_arabic: "الفرقان", versesCount: 77 },
  { number: 26, name: "Ash-Shu'araa", name_arabic: "الشعراء", versesCount: 227 },
  { number: 27, name: "An-Naml", name_arabic: "النمل", versesCount: 93 },
  { number: 28, name: "Al-Qasas", name_arabic: "القصص", versesCount: 88 },
  { number: 29, name: "Al-Ankaboot", name_arabic: "العنكبوت", versesCount: 69 },
  { number: 30, name: "Ar-Room", name_arabic: "الروم", versesCount: 60 },
  { number: 31, name: "Luqman", name_arabic: "لقمان", versesCount: 34 },
  { number: 32, name: "As-Sajda", name_arabic: "السجدة", versesCount: 30 },
  { number: 33, name: "Al-Ahzaab", name_arabic: "الأحزاب", versesCount: 73 },
  { number: 34, name: "Saba", name_arabic: "سبإ", versesCount: 54 },
  { number: 35, name: "Faatir", name_arabic: "فاطر", versesCount: 45 },
  { number: 36, name: "Yaseen", name_arabic: "يس", versesCount: 83 },
  { number: 37, name: "As-Saaffaat", name_arabic: "الصافات", versesCount: 182 },
  { number: 38, name: "Saad", name_arabic: "ص", versesCount: 88 },
  { number: 39, name: "Az-Zumar", name_arabic: "الزمر", versesCount: 75 },
  { number: 40, name: "Ghafir", name_arabic: "غافر", versesCount: 85 },
  { number: 41, name: "Fussilat", name_arabic: "فصلت", versesCount: 54 },
  { number: 42, name: "Ash-Shura", name_arabic: "الشورى", versesCount: 53 },
  { number: 43, name: "Az-Zukhruf", name_arabic: "الزخرف", versesCount: 89 },
  { number: 44, name: "Ad-Dukhaan", name_arabic: "الدخان", versesCount: 59 },
  { number: 45, name: "Al-Jaathiya", name_arabic: "الجاثية", versesCount: 37 },
  { number: 46, name: "Al-Ahqaf", name_arabic: "الأحقاف", versesCount: 35 },
  { number: 47, name: "Muhammad", name_arabic: "محمد", versesCount: 38 },
  { number: 48, name: "Al-Fath", name_arabic: "الفتح", versesCount: 29 },
  { number: 49, name: "Al-Hujuraat", name_arabic: "الحجرات", versesCount: 18 },
  { number: 50, name: "Qaaf", name_arabic: "ق", versesCount: 45 },
  { number: 51, name: "Adh-Dhaariyat", name_arabic: "الذاريات", versesCount: 60 },
  { number: 52, name: "At-Tur", name_arabic: "الطور", versesCount: 49 },
  { number: 53, name: "An-Najm", name_arabic: "النجم", versesCount: 62 },
  { number: 54, name: "Al-Qamar", name_arabic: "القمر", versesCount: 55 },
  { number: 55, name: "Ar-Rahmaan", name_arabic: "الرحمن", versesCount: 78 },
  { number: 56, name: "Al-Waaqia", name_arabic: "الواقعة", versesCount: 96 },
  { number: 57, name: "Al-Hadid", name_arabic: "الحديد", versesCount: 29 },
  { number: 58, name: "Al-Mujaadila", name_arabic: "المجادلة", versesCount: 22 },
  { number: 59, name: "Al-Hashr", name_arabic: "الحشر", versesCount: 24 },
  { number: 60, name: "Al-Mumtahana", name_arabic: "الممتحنة", versesCount: 13 },
  { number: 61, name: "As-Saff", name_arabic: "الصف", versesCount: 14 },
  { number: 62, name: "Al-Jumu'ah", name_arabic: "الجمعة", versesCount: 11 },
  { number: 63, name: "Al-Munaafiqoon", name_arabic: "المنافقون", versesCount: 11 },
  { number: 64, name: "At-Taghaabun", name_arabic: "التغابن", versesCount: 18 },
  { number: 65, name: "At-Talaaq", name_arabic: "الطلاق", versesCount: 12 },
  { number: 66, name: "At-Tahrim", name_arabic: "التحريم", versesCount: 12 },
  { number: 67, name: "Al-Mulk", name_arabic: "الملك", versesCount: 30 },
  { number: 68, name: "Al-Qalam", name_arabic: "القلم", versesCount: 52 },
  { number: 69, name: "Al-Haaqqa", name_arabic: "الحاقة", versesCount: 52 },
  { number: 70, name: "Al-Ma'aarij", name_arabic: "المعارج", versesCount: 44 },
  { number: 71, name: "Nooh", name_arabic: "نوح", versesCount: 28 },
  { number: 72, name: "Al-Jinn", name_arabic: "الجن", versesCount: 28 },
  { number: 73, name: "Al-Muzzammil", name_arabic: "المزمل", versesCount: 20 },
  { number: 74, name: "Al-Muddaththir", name_arabic: "المدثر", versesCount: 56 },
  { number: 75, name: "Al-Qiyaama", name_arabic: "القيامة", versesCount: 40 },
  { number: 76, name: "Al-Insaan", name_arabic: "الانسان", versesCount: 31 },
  { number: 77, name: "Al-Mursalaat", name_arabic: "المرسلات", versesCount: 50 },
  { number: 78, name: "An-Naba", name_arabic: "النبإ", versesCount: 40 },
  { number: 79, name: "An-Naazi'aat", name_arabic: "النازعات", versesCount: 46 },
  { number: 80, name: "Abasa", name_arabic: "عبس", versesCount: 42 },
  { number: 81, name: "At-Takwir", name_arabic: "التكوير", versesCount: 29 },
  { number: 82, name: "Al-Infitaar", name_arabic: "الإنفطار", versesCount: 19 },
  { number: 83, name: "Al-Mutaffifin", name_arabic: "المطففين", versesCount: 36 },
  { number: 84, name: "Al-Inshiqaaq", name_arabic: "الإنشقاق", versesCount: 25 },
  { number: 85, name: "Al-Burooj", name_arabic: "البروج", versesCount: 22 },
  { number: 86, name: "At-Taariq", name_arabic: "الطارق", versesCount: 17 },
  { number: 87, name: "Al-A'laa", name_arabic: "الأعلى", versesCount: 19 },
  { number: 88, name: "Al-Ghaashiya", name_arabic: "الغاشية", versesCount: 26 },
  { number: 89, name: "Al-Fajr", name_arabic: "الفجر", versesCount: 30 },
  { number: 90, name: "Al-Balad", name_arabic: "البلد", versesCount: 20 },
  { number: 91, name: "Ash-Shams", name_arabic: "الشمس", versesCount: 15 },
  { number: 92, name: "Al-Lail", name_arabic: "الليل", versesCount: 21 },
  { number: 93, name: "Ad-Dhuhaa", name_arabic: "الضحى", versesCount: 11 },
  { number: 94, name: "Ash-Sharh", name_arabic: "الشرح", versesCount: 8 },
  { number: 95, name: "At-Tin", name_arabic: "التين", versesCount: 8 },
  { number: 96, name: "Al-Alaq", name_arabic: "العلق", versesCount: 19 },
  { number: 97, name: "Al-Qadr", name_arabic: "القدر", versesCount: 5 },
  { number: 98, name: "Al-Bayyina", name_arabic: "البينة", versesCount: 8 },
  { number: 99, name: "Az-Zalzala", name_arabic: "الزلزلة", versesCount: 8 },
  { number: 100, name: "Al-Aadiyaat", name_arabic: "العاديات", versesCount: 11 },
  { number: 101, name: "Al-Qaari'a", name_arabic: "القارعة", versesCount: 11 },
  { number: 102, name: "At-Takaathur", name_arabic: "التكاثر", versesCount: 8 },
  { number: 103, name: "Al-Asr", name_arabic: "العصر", versesCount: 3 },
  { number: 104, name: "Al-Humaza", name_arabic: "الهمزة", versesCount: 9 },
  { number: 105, name: "Al-Fil", name_arabic: "الفيل", versesCount: 5 },
  { number: 106, name: "Quraish", name_arabic: "قريش", versesCount: 4 },
  { number: 107, name: "Al-Maa'un", name_arabic: "الماعون", versesCount: 7 },
  { number: 108, name: "Al-Kawthar", name_arabic: "الكوثر", versesCount: 3 },
  { number: 109, name: "Al-Kaafiroon", name_arabic: "الكافرون", versesCount: 6 },
  { number: 110, name: "An-Nasr", name_arabic: "النصر", versesCount: 3 },
  { number: 111, name: "Al-Masad", name_arabic: "المسد", versesCount: 5 },
  { number: 112, name: "Al-Ikhlaas", name_arabic: "الإخلاص", versesCount: 4 },
  { number: 113, name: "Al-Falaq", name_arabic: "الفلق", versesCount: 5 },
  { number: 114, name: "An-Naas", name_arabic: "الناس", versesCount: 6 }
];