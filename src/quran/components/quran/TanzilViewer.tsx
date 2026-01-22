
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/quran/components/ui/card";
import { Button } from "@/quran/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { debounce } from "lodash";
import { getVerseMetadata } from "@/quran/lib/quran-api";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";
import { JUZ_DATA } from "@/quran/types/juz";
import { CompactSurahSelect } from "./CompactSurahSelect";
import { CompactVerseSelect } from "./CompactVerseSelect";
import { CompactJuzSelect } from "./CompactJuzSelect";
import { MushafPdfViewer } from "./MushafPdfViewer";

interface TanzilViewerProps {
  currentPage?: number;
  currentLesson?: { surah: string; verses: string } | null;
  onVerseSelect?: (verseKey: string, position: 'start' | 'end') => void;
  selectedStartVerse?: string | null;
  selectedEndVerse?: string | null;
  onPageChange?: (pageNumber: number) => void;
}

export const TanzilViewer = ({
  currentPage: initialPage = 1,
  onVerseSelect,
  selectedStartVerse = null,
  selectedEndVerse = null,
  currentLesson,
  onPageChange
}: TanzilViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [navigationJuz, setNavigationJuz] = useState<string>("");
  const [navigationSurah, setNavigationSurah] = useState<string>("");
  const [navigationVerse, setNavigationVerse] = useState<string>("");

  // No longer need to fetch word data - using PDF instead
  const isLoading = false;
  const error = null;

  // Build selected verse keys array
  const getSelectedVerseKeys = (): string[] => {
    if (!selectedStartVerse) return [];
    if (!selectedEndVerse) return [selectedStartVerse];

    const keys: string[] = [];
    const [startSurah, startVerse] = selectedStartVerse.split(':').map(Number);
    const [endSurah, endVerse] = selectedEndVerse.split(':').map(Number);

    for (let s = startSurah; s <= endSurah; s++) {
      const startV = s === startSurah ? startVerse : 1;
      const endV = s === endSurah ? endVerse : 999;

      for (let v = startV; v <= endV; v++) {
        keys.push(`${s}:${v}`);
      }
    }

    return keys;
  };

  // Update page number when initialPage prop changes
  useEffect(() => {
    if (initialPage && initialPage !== pageNumber) {
      setPageNumber(initialPage);
    }
  }, [initialPage]);

  // Handle verse selection
  const handleVerseClick = (verseKey: string) => {
    if (!onVerseSelect) return;

    if (!selectedStartVerse) {
      onVerseSelect(verseKey, 'start');
      toast.info(`Selected start verse: ${verseKey}`);
    } else if (!selectedEndVerse) {
      // Validate verse order
      const [startSurah, startVerse] = selectedStartVerse.split(':').map(Number);
      const [endSurah, endVerse] = verseKey.split(':').map(Number);

      if (endSurah < startSurah || (endSurah === startSurah && endVerse < startVerse)) {
        toast.error("End verse must come after start verse");
        return;
      }

      onVerseSelect(verseKey, 'end');
      toast.success(`Selected end verse: ${verseKey}`);
    } else {
      // Reset selection
      onVerseSelect(verseKey, 'start');
      toast.info(`New selection starting from: ${verseKey}`);
    }
  };

  // Handle page navigation
  const handleNextPage = () => {
    if (pageNumber < 604) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
      setTimeout(() => {
        viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
      setTimeout(() => {
        viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // Handle navigation to specific verse
  const handleNavigateToVerse = async () => {
    if (!navigationSurah || !navigationVerse) {
      toast.error("Please select both surah and verse");
      return;
    }

    try {
      const surahData = AVAILABLE_SURAHS.find(s => s.name === navigationSurah);
      if (!surahData) {
        toast.error("Invalid surah selected");
        return;
      }

      const verseKey = `${surahData.number}:${navigationVerse}`;
      const metadata = await getVerseMetadata(verseKey);

      setPageNumber(metadata.page_number);
      if (onPageChange) {
        onPageChange(metadata.page_number);
      }

      toast.success(`Navigated to ${navigationSurah}, Verse ${navigationVerse}`);
    } catch (error) {
      console.error("Error navigating to verse:", error);
      toast.error("Failed to navigate to the selected verse");
    }
  };

  // Handle Juz selection - navigate to the beginning of the Juz
  const handleJuzChange = async (juzNumber: string) => {
    setNavigationJuz(juzNumber);
    const juz = JUZ_DATA.find(j => j.number === parseInt(juzNumber));
    if (juz) {
      const surah = AVAILABLE_SURAHS.find(s => s.number === juz.startSurah);
      if (surah) {
        setNavigationSurah(surah.name);
        setNavigationVerse(juz.startVerse.toString());

        // Navigate to the Juz starting page
        try {
          const verseKey = `${juz.startSurah}:${juz.startVerse}`;
          const metadata = await getVerseMetadata(verseKey);
          setPageNumber(metadata.page_number);
          if (onPageChange) {
            onPageChange(metadata.page_number);
          }
          toast.success(`Navigated to Juz ${juzNumber}`);
        } catch (error) {
          console.error("Error navigating to Juz:", error);
          toast.error("Failed to navigate to the selected Juz");
        }
      }
    }
  };

  // Effect to navigate to the selected verse's page when currentLesson changes
  useEffect(() => {
    const navigateToVerse = async () => {
      if (!currentLesson?.surah || !currentLesson?.verses) return;

      try {
        // Find the surah number by name
        const surahData = AVAILABLE_SURAHS.find(s => s.name === currentLesson.surah);
        if (!surahData) {
          console.error("Surah not found:", currentLesson.surah);
          return;
        }

        // Parse the verses string to get the starting verse
        const versesParts = currentLesson.verses.split('-');
        if (versesParts.length === 0) return;

        const startVerse = versesParts[0].trim();

        // Construct the proper verse key format (surahNumber:verseNumber)
        const verseKey = `${surahData.number}:${startVerse}`;

        // Get the page number for this verse
        const metadata = await getVerseMetadata(verseKey);
        setPageNumber(metadata.page_number);
        if (onPageChange) {
          onPageChange(metadata.page_number);
        }
      } catch (error) {
        console.error("Error navigating to verse:", error);
      }
    };

    navigateToVerse();
  }, [currentLesson]);

  // Effect for selected verses (for highlighting)
  useEffect(() => {
    const highlightSelectedVerse = async () => {
      if (selectedStartVerse && !selectedEndVerse) {
        try {
          const metadata = await getVerseMetadata(selectedStartVerse);
          setPageNumber(metadata.page_number);
          if (onPageChange) {
            onPageChange(metadata.page_number);
          }
        } catch (error) {
          console.error("Error navigating to selected verse:", error);
        }
      }
    };

    highlightSelectedVerse();
  }, [selectedStartVerse]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load Quran content");
    }
  }, [error]);

  // Handle scroll to next page
  useEffect(() => {
    const handleScroll = debounce(() => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;

      // If we are at the bottom (within 10px of the very end, requiring scroll through the spacer)
      if (scrollPosition + 10 >= documentHeight) {
        // We use the function ref to ensure we check the condition against the latest state
        // or simply rely on the dependency array recreating the handler
        if (pageNumber < 604 && !isLoading) {
          handleNextPage();
        }
      }
    }, 300);

    window.addEventListener('scroll', handleScroll);
    return () => {
      handleScroll.cancel();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pageNumber, isLoading]);

  // For PDF viewer, we don't have verse data, so show empty surah names
  const surahNames: string[] = [];
  const selectedVerseKeys = getSelectedVerseKeys();

  return (
    <Card ref={viewerRef} className="w-full overflow-hidden rounded-lg border border-mushaf-border bg-mushaf-parchment">
      <div className="relative w-full">
        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-mushaf-border bg-mushaf-cream gap-1 sm:gap-2">
          <Button
            onClick={handleNextPage}
            disabled={pageNumber >= 604 || isLoading}
            variant="outline"
            size="sm"
            className="border-mushaf-border text-mushaf-brown hover:bg-mushaf-gold/20 h-8 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
          </Button>

          <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              <CompactJuzSelect
                selectedJuz={navigationJuz}
                onJuzChange={handleJuzChange}
              />
              <CompactSurahSelect
                selectedSurah={navigationSurah}
                onSurahChange={(surah) => {
                  setNavigationSurah(surah);
                  setNavigationVerse("");
                }}
              />
              <CompactVerseSelect
                selectedVerse={navigationVerse}
                onVerseChange={setNavigationVerse}
                selectedSurah={navigationSurah}
              />
              <Button
                onClick={handleNavigateToVerse}
                disabled={!navigationSurah || !navigationVerse || isLoading}
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs border-mushaf-border text-mushaf-brown hover:bg-mushaf-gold/20"
              >
                Go
              </Button>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-mushaf-brown font-semibold text-xs sm:text-sm">
                Page {pageNumber} / 604
              </span>
              {surahNames.length > 0 && (
                <span className="font-quran text-xs text-mushaf-teal">
                  {surahNames.join(' - ')}
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1 || isLoading}
            variant="outline"
            size="sm"
            className="border-mushaf-border text-mushaf-brown hover:bg-mushaf-gold/20 h-8 px-2 sm:px-3"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
        </div>

        <div className="w-full bg-mushaf-cream">
          <MushafPdfViewer
            pageNumber={pageNumber}
            isLoading={isLoading}
            onVerseSelect={handleVerseClick}
            selectedVerseKeys={selectedVerseKeys}
          />
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-t border-mushaf-border bg-mushaf-cream">
          <Button
            onClick={handleNextPage}
            disabled={pageNumber >= 604 || isLoading}
            variant="outline"
            size="sm"
            className="border-mushaf-border text-mushaf-brown hover:bg-mushaf-gold/20 h-8 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-mushaf-brown font-semibold text-xs sm:text-sm">
              Page {pageNumber} / 604
            </span>
            {surahNames.length > 0 && (
              <span className="font-quran text-xs text-mushaf-teal">
                {surahNames.join(' - ')}
              </span>
            )}
          </div>

          <Button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1 || isLoading}
            variant="outline"
            size="sm"
            className="border-mushaf-border text-mushaf-brown hover:bg-mushaf-gold/20 h-8 px-2 sm:px-3"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
        </div>

        {/* Scroll Spacer - Requires user to scroll further to trigger next page */}
        <div className="h-48 w-full flex items-center justify-center text-mushaf-brown/40 text-sm pb-8">
          Scroll to next page
        </div>
      </div>
    </Card>
  );
};
