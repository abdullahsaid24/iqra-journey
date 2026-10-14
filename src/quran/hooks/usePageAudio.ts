import { useQuery } from "@tanstack/react-query";

interface AudioFile {
  verse_key: string;
  url: string;
}

export interface PageAudioData {
  verse_key: string;
  audio_url: string;
}

const HUSARY_RECITER_ID = 6; // Mahmoud Khalil Al-Husary

export const usePageAudio = (pageNumber: number | null) => {
  return useQuery({
    queryKey: ['page-audio', pageNumber],
    queryFn: async (): Promise<PageAudioData[]> => {
      if (!pageNumber) return [];

      // 1. Fetch verses for the page to know which chapters and verses are on it
      const pageRes = await fetch(`https://api.quran.com/api/v4/verses/by_page/${pageNumber}?fields=verse_key`);
      if (!pageRes.ok) throw new Error("Failed to fetch page verses");
      const pageData = await pageRes.json();
      
      const verses: { verse_key: string }[] = pageData.verses;
      if (verses.length === 0) return [];

      // 2. Identify unique chapters on this page
      const chapterNumbers = [...new Set(verses.map(v => v.verse_key.split(':')[0]))];

      // 3. Fetch audio for all chapters on the page
      const audioPromises = chapterNumbers.map(chapter => 
        fetch(`https://api.quran.com/api/v4/recitations/${HUSARY_RECITER_ID}/by_chapter/${chapter}?per_page=300`)
          .then(res => res.json())
      );
      
      const audioResults = await Promise.all(audioPromises);
      
      // Flatten all audio files from the fetched chapters
      const allAudioFiles: AudioFile[] = [];
      audioResults.forEach(res => {
        if (res.audio_files) {
          allAudioFiles.push(...res.audio_files);
        }
      });

      // 4. Map the audio URLs to the verses on the page
      const pageAudio: PageAudioData[] = [];
      
      for (const verse of verses) {
        const audio = allAudioFiles.find(a => a.verse_key === verse.verse_key);
        let url = audio?.url || '';
        
        if (url && url.startsWith('//')) {
          url = `https:${url}`;
        }
        
        pageAudio.push({
          verse_key: verse.verse_key,
          audio_url: url
        });
      }

      return pageAudio;
    },
    enabled: !!pageNumber && pageNumber > 0 && pageNumber <= 604,
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });
};
