
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/quran/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/quran/components/ui/scroll-area";
import { toast } from "sonner";
import { QuranSearch } from "./QuranSearch";
import { useIsMobile } from "@/quran/hooks/use-mobile";

interface InteractiveQuranProps {
  onVerseSelect?: (verseKey: string) => void;
  isSelectionMode?: boolean;
  selectedStartVerse?: string | null;
  selectedEndVerse?: string | null;
  currentLesson?: {
    surah: string;
    verses: string;
  };
}

interface QuranVerse {
  text_uthmani: string;
  verse_key: string;
}

export const InteractiveQuran = ({
  onVerseSelect,
  isSelectionMode = false,
  selectedStartVerse = null,
  selectedEndVerse = null,
  currentLesson,
}: InteractiveQuranProps) => {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["quran-page", currentPage],
    queryFn: async () => {
      const response = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${currentPage}`);
      if (!response.ok) throw new Error("Failed to fetch Quran page");
      return response.json();
    },
  });

  const handlePageChange = (direction: "next" | "prev") => {
    if (direction === "next" && currentPage < 604) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleQuranSearch = async (type: "surah" | "ayah" | "juz", value: string) => {
    try {
      if (type === "ayah") {
        const [surah, ayah] = value.split(":");
        // Get page number via API
        const response = await fetch(`https://api.quran.com/api/v4/verses/by_key/${value}?fields=page_number`);
        if (!response.ok) throw new Error("Failed to get verse metadata");
        const data = await response.json();
        setCurrentPage(data.verse.page_number);
        setSelectedVerse(value);
        toast.success(`Navigated to Surah ${surah}, Verse ${ayah}`);
      }
    } catch (error) {
      console.error("Error navigating to verse:", error);
      toast.error("Failed to navigate to the selected verse");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 sm:h-96 items-center justify-center rounded-lg bg-white/90">
        <p className="text-quran-bg">Loading Quran page...</p>
      </div>
    );
  }

  if (error) {
    toast.error("Failed to load Quran page");
    return null;
  }

  return (
    <div className="space-y-2 sm:space-y-4 rounded-lg border border-quran-border bg-white shadow-md">
      <div className="sticky top-0 z-10 border-b border-quran-border bg-white p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <QuranSearch onSelect={handleQuranSearch} />

          <div className="flex items-center gap-1 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              onClick={() => handlePageChange("prev")}
              disabled={currentPage === 1}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="border-quran-border bg-white text-quran-bg hover:bg-quran-light hover:text-white text-xs sm:text-sm"
            >
              <ChevronLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className={isMobile ? "hidden" : "inline"}>Previous</span>
              <span className={isMobile ? "inline" : "hidden"}>Prev</span>
            </Button>
            <span className="text-quran-bg font-semibold text-xs sm:text-sm whitespace-nowrap">
              {currentPage}/604
            </span>
            <Button
              onClick={() => handlePageChange("next")}
              disabled={currentPage === 604}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="border-quran-border bg-white text-quran-bg hover:bg-quran-light hover:text-white text-xs sm:text-sm"
            >
              <span className={isMobile ? "hidden" : "inline"}>Next</span>
              <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[300px] sm:h-[400px] md:h-[500px] rounded-md px-2 sm:px-4 md:px-6">
        <div className="space-y-4 sm:space-y-6 digitalkhatt-container">
          {data?.verses?.map((verse: QuranVerse) => {
            const [surah, ayah] = verse.verse_key.split(":");
            const isStartVerse = verse.verse_key === selectedStartVerse;
            const isEndVerse = verse.verse_key === selectedEndVerse;
            const isCurrentLessonVerse = currentLesson?.verses?.includes(verse.verse_key);
            const isSelectedVerse = verse.verse_key === selectedVerse;

            return (
              <span
                key={verse.verse_key}
                onClick={() => onVerseSelect?.(verse.verse_key)}
                className={`inline cursor-pointer font-arabic text-lg sm:text-xl md:text-2xl leading-loose text-black transition-all ${
                  isStartVerse
                    ? "border-b-2 border-quran-success"
                    : isEndVerse
                    ? "border-b-2 border-quran-error"
                    : isCurrentLessonVerse
                    ? "bg-quran-light/20"
                    : isSelectedVerse
                    ? "bg-quran-primary/10"
                    : isSelectionMode
                    ? "hover:text-quran-primary"
                    : ""
                }`}
              >
                {verse.text_uthmani}{" "}
                <span className="mx-1 inline-block text-xs sm:text-sm text-quran-secondary verse-number">
                  ﴿{ayah}﴾
                </span>{" "}
              </span>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
