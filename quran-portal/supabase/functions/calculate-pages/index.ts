
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const API_BASE_URL = "https://api.quran.com/api/v4";

async function fetchSurahList() {
  console.log('Fetching surah list from Quran API...');
  const response = await fetch(`${API_BASE_URL}/chapters?language=en`);
  if (!response.ok) {
    console.error('Failed to fetch surah list:', response.status, response.statusText);
    throw new Error("Failed to fetch surah list");
  }
  const data = await response.json();
  console.log('Successfully fetched surah list. Total surahs:', data.chapters.length);
  return data.chapters;
}

async function getVerseMetadata(verseKey: string): Promise<{ page_number: number }> {
  console.log(`Fetching metadata for verse key: ${verseKey}`);
  const url = `${API_BASE_URL}/verses/by_key/${verseKey}?fields=page_number`;
  console.log('Making request to:', url);
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch verse metadata for ${verseKey}:`, response.status, response.statusText);
    throw new Error("Failed to fetch verse metadata");
  }
  const data = await response.json();
  console.log(`Verse ${verseKey} is on page:`, data.verse.page_number);
  return { page_number: data.verse.page_number };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Received request to calculate pages');
    const { surah, verses } = await req.json();
    console.log('Input parameters:', { surah, verses });

    // Convert surah name to number using the full list
    console.log('Fetching surah list to convert surah name to number...');
    const surahList = await fetchSurahList();
    const surahData = surahList.find((s: any) => s.name_simple.toLowerCase() === surah.toLowerCase());
    if (!surahData) {
      console.error('Surah not found:', surah);
      throw new Error(`Surah ${surah} not found`);
    }
    console.log('Found surah:', { 
      name: surahData.name_simple, 
      number: surahData.id, 
      totalVerses: surahData.verses_count 
    });

    const surahNumber = surahData.id;
    console.log('Parsing verse range:', verses);
    const [startVerse, endVerse] = verses.split('-').map((v: string) => parseInt(v.trim()));
    console.log('Parsed verse range:', { startVerse, endVerse });

    // Get page numbers for start and end verses
    const startKey = `${surahNumber}:${startVerse}`;
    const endKey = `${surahNumber}:${endVerse}`;
    console.log('Generated verse keys:', { startKey, endKey });

    console.log('Fetching page numbers for start and end verses...');
    const [startMeta, endMeta] = await Promise.all([
      getVerseMetadata(startKey),
      getVerseMetadata(endKey)
    ]);

    console.log('Retrieved page numbers:', {
      startPage: startMeta.page_number,
      endPage: endMeta.page_number
    });

    // Calculate total pages
    const totalPages = endMeta.page_number - startMeta.page_number + 1;
    console.log('Calculated total pages:', totalPages);

    return new Response(
      JSON.stringify({ 
        pages: totalPages,
        details: {
          surah: {
            name: surahData.name_simple,
            number: surahNumber
          },
          verses: {
            start: startVerse,
            end: endVerse
          },
          pages: {
            start: startMeta.page_number,
            end: endMeta.page_number,
            total: totalPages
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in calculate-pages function:', error);
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
