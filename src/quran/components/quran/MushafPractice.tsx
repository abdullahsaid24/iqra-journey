import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/quran/components/ui/card";
import { Button } from "@/quran/components/ui/button";
import { CompactSurahSelect } from "@/quran/components/quran/CompactSurahSelect";
import { CompactJuzSelect } from "@/quran/components/quran/CompactJuzSelect";
import { MushafPageComponent } from "@/quran/components/quran/MushafPage";
import { useQuranPageWords } from "@/quran/hooks/useQuranPageWords";
import { MushafAudioController } from "@/quran/components/quran/MushafAudioController";
import { usePageAudio } from "@/quran/hooks/usePageAudio";
import { Headphones, Play, Pause, SkipBack, SkipForward, Repeat, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";
import { JUZ_DATA } from "@/quran/types/juz";
import { getVerseMetadata } from "@/quran/lib/quran-api";
import { toast } from "sonner";
import { Input } from "@/quran/components/ui/input";

interface MushafPracticeProps {
  lessonId?: string;
  studentId?: string;
  initialSurah?: string;
  initialVerses?: string;
  requiredRepetitions?: number;
}

export const MushafPractice = ({ lessonId, studentId, initialSurah, initialVerses, requiredRepetitions }: MushafPracticeProps) => {
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  // How many times each ayah repeats before moving on - a listening aid the
  // student picks. It is deliberately NOT seeded from requiredRepetitions:
  // that is the teacher's goal for complete passes through the lesson, and
  // using it here made a goal of 5 repeat every single ayah five times.
  const [targetRepeatCount, setTargetRepeatCount] = useState<number>(1); // 1, 2, 3, 5, or Infinity
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVerseInitialized, setIsVerseInitialized] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const initializePage = async () => {
      if (initialSurah && initialVerses && !isInitialized) {
        try {
          const surah = AVAILABLE_SURAHS.find(s => s.name === initialSurah);
          if (surah) {
            const startVerse = initialVerses.split('-')[0].trim();
            const verseKey = `${surah.number}:${startVerse}`;
            const metadata = await getVerseMetadata(verseKey);
            setPageNumber(metadata.page_number);
          }
        } catch (error) {
          console.error("Failed to initialize homework page", error);
        }
        setIsInitialized(true);
      }
    };
    initializePage();
  }, [initialSurah, initialVerses, isInitialized]);

  /** The last ayah of the assigned range - finishing it is one repetition. */
  const lessonLastVerseKey = useMemo(() => {
    if (!initialSurah || !initialVerses) return undefined;
    const surah = AVAILABLE_SURAHS.find(s => s.name === initialSurah);
    if (!surah) return undefined;
    const parts = initialVerses.split('-').map(p => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    return last ? `${surah.number}:${last}` : undefined;
  }, [initialSurah, initialVerses]);

  const { data: audioData, isLoading: audioLoading } = usePageAudio(pageNumber);
  const { data: practicePage, isLoading: practicePageLoading } = useQuranPageWords(pageNumber);

  useEffect(() => {
    if (audioData && audioData.length > 0 && initialSurah && initialVerses && !isVerseInitialized) {
      const surah = AVAILABLE_SURAHS.find(s => s.name === initialSurah);
      if (surah) {
        const startVerse = initialVerses.split('-')[0].trim();
        const verseKey = `${surah.number}:${startVerse}`;
        const startIndex = audioData.findIndex(a => a.verse_key === verseKey);
        
        if (startIndex !== -1) {
          setCurrentVerseIndex(startIndex);
        }
      }
      setIsVerseInitialized(true);
    }
  }, [audioData, initialSurah, initialVerses, isVerseInitialized]);
  
  const currentVerseKey = audioData?.[currentVerseIndex]?.verse_key;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= 604) {
      setPageNumber(newPage);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < 604) setPageNumber(pageNumber + 1);
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const handlePageComplete = () => {
    if (pageNumber < 604) {
      setPageNumber(pageNumber + 1);
      // isPlaying remains true, so it should auto-play the next page
    } else {
      setIsPlaying(false);
    }
  };

  const handleJuzChange = async (juzNumber: string) => {
    const juz = JUZ_DATA.find(j => j.number === parseInt(juzNumber));
    if (juz) {
      try {
        const verseKey = `${juz.startSurah}:${juz.startVerse}`;
        const metadata = await getVerseMetadata(verseKey);
        setPageNumber(metadata.page_number);
        toast.success(`Navigated to Juz ${juzNumber}`);
      } catch (error) {
        toast.error("Failed to navigate to Juz");
      }
    }
  };

  const handleSurahChange = async (surahName: string) => {
    const surah = AVAILABLE_SURAHS.find(s => s.name === surahName);
    if (surah) {
      try {
        const verseKey = `${surah.number}:1`;
        const metadata = await getVerseMetadata(verseKey);
        setPageNumber(metadata.page_number);
        toast.success(`Navigated to ${surahName}`);
      } catch (error) {
        toast.error("Failed to navigate to Surah");
      }
    }
  };

  return (
    <Card className="overflow-hidden border-quran-primary/20 shadow-sm mt-8">
      <CardHeader className="bg-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-quran-primary" />
          <CardTitle className="text-xl text-slate-800">Mushaf Practice</CardTitle>
        </div>
        <CardDescription className="text-base text-slate-600 font-medium">
          Continuous page-by-page reading with ayah repetition for rigorous memorization.
        </CardDescription>
      </CardHeader>
      
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 border-r border-slate-200 bg-white p-4 space-y-8 shrink-0">
          
          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">Navigation</h3>
            
            <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <Button variant="ghost" size="icon" onClick={handlePrevPage} disabled={pageNumber <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Page</span>
                <Input 
                  type="number" 
                  min={1} 
                  max={604} 
                  value={pageNumber}
                  onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                  className="w-16 h-8 text-center"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextPage} disabled={pageNumber >= 604}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CompactJuzSelect selectedJuz="" onJuzChange={handleJuzChange} />
              <CompactSurahSelect selectedSurah="" onSurahChange={handleSurahChange} />
            </div>
          </div>

          {/* Audio Controls */}
          <div className="space-y-6">
            <h3 className="font-semibold text-slate-700">Audio Controls</h3>
            
            <div className="flex items-center justify-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => currentVerseIndex > 0 && setCurrentVerseIndex(currentVerseIndex - 1)}
                disabled={currentVerseIndex === 0 || !audioData}
                className="w-10 h-10 rounded-full hover:bg-slate-200"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </Button>

              <Button
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full bg-quran-primary hover:bg-quran-primary/90 text-white shadow-md transform transition hover:scale-105"
                disabled={!audioData || audioData.length === 0}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => audioData && currentVerseIndex < audioData.length - 1 && setCurrentVerseIndex(currentVerseIndex + 1)}
                disabled={!audioData || currentVerseIndex >= audioData.length - 1}
                className="w-10 h-10 rounded-full hover:bg-slate-200"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </Button>
            </div>
            
            <div className="text-center text-sm font-medium text-slate-500">
              {currentVerseKey ? `Active Verse: ${currentVerseKey}` : (audioLoading ? "Loading audio..." : "No audio available")}
            </div>

            {/* Repetition Settings */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Repeat className="w-4 h-4" /> Ayah Repetition
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, Infinity].map((count) => (
                  <Button
                    key={count}
                    variant={targetRepeatCount === count ? "default" : "outline"}
                    size="sm"
                    className={targetRepeatCount === count ? "bg-quran-primary text-white" : "text-slate-600"}
                    onClick={() => setTargetRepeatCount(count)}
                  >
                    {count === Infinity ? '∞' : `${count}×`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - the mushaf page */}
        <div className="flex-1 bg-mushaf-cream min-h-[600px] flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <MushafPageComponent
              page={practicePage}
              isLoading={practicePageLoading}
              selectedVerseKeys={currentVerseKey ? [currentVerseKey] : []}
              onVerseSelect={(key) => {
                // Find index of clicked verse and jump to it
                if (audioData) {
                  const index = audioData.findIndex(a => a.verse_key === key);
                  if (index !== -1) {
                    setCurrentVerseIndex(index);
                    setIsPlaying(true);
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <MushafAudioController 
        pageNumber={pageNumber}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        currentVerseIndex={currentVerseIndex}
        setCurrentVerseIndex={setCurrentVerseIndex}
        targetRepeatCount={targetRepeatCount}
        onPageComplete={handlePageComplete}
        lessonId={lessonId}
        studentId={studentId}
        lessonLastVerseKey={lessonLastVerseKey}
        // Refresh the "3 of 5" counter on the page above without a reload.
        onListenRecorded={() =>
          queryClient.invalidateQueries({ queryKey: ["practice-lessons", studentId] })
        }
      />
    </Card>
  );
};
