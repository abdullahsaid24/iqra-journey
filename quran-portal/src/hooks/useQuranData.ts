
import { useQuery } from "@tanstack/react-query";

interface QuranVerse {
  text_uthmani: string;
  verse_key: string;
}

interface QuranPageResponse {
  verses: QuranVerse[];
}

const fetchQuranPage = async (page: number): Promise<QuranPageResponse> => {
  try {
    console.log(`Fetching Quran page ${page}`);
    const response = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${page}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Quran page: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching Quran page:", error);
    throw error;
  }
};

export const useQuranData = (page: number) => {
  return useQuery({
    queryKey: ["quran-page", page],
    queryFn: () => fetchQuranPage(page),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    enabled: page > 0 && page <= 604,
    retry: 3,
  });
};
