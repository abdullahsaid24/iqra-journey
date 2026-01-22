import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePdfViewer } from "@/hooks/usePdfViewer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { debounce } from "lodash";

// Lesson to page mapping for Ahsanul Qawaid Book 1
// Exact mapping provided by user
const LESSON_TO_PAGE: Record<number, number> = {
  1: 3,
  2: 7,
  3: 8,
  4: 12,
  5: 13,
  6: 14,
  7: 16,
  8: 17,
  9: 18,
  10: 18, // at bottom of page
  11: 19, // at bottom of page
  12: 20,
  13: 21,
  14: 22,
  15: 23,
  16: 24,
  17: 25,
  18: 27,
  19: 29,
  20: 30,
  21: 30, // at bottom of page
  22: 32,
  23: 33,
  24: 33, // at bottom of page
  25: 34,
  26: 35,
  27: 35, // at bottom of page
  28: 36,
  29: 37,
};

// Get lesson number from page number (for display purposes)
// Returns the FIRST lesson that starts on this page, or the most recent lesson before it
const getLessonFromPage = (page: number): number => {
  // First check if any lesson starts exactly on this page
  for (let lesson = 1; lesson <= 29; lesson++) {
    if (LESSON_TO_PAGE[lesson] === page) {
      return lesson; // Return the first lesson that starts on this page
    }
  }

  // Otherwise find the most recent lesson that started before this page
  let currentLesson = 1;
  for (let lesson = 1; lesson <= 29; lesson++) {
    const lessonPage = LESSON_TO_PAGE[lesson];
    if (lessonPage < page) {
      currentLesson = lesson;
    } else {
      break;
    }
  }
  return currentLesson;
};

interface AhsanulQawaidViewerProps {
  currentLesson?: { surah: string; verses: string } | null;
  onPageChange?: (pageNumber: number) => void;
  previewLesson?: string | null; // For live preview when form selection changes
}

export const AhsanulQawaidViewer = ({
  currentLesson,
  onPageChange,
  previewLesson
}: AhsanulQawaidViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageNumber, setPageNumber] = useState<number>(3); // Start at Lesson 1 (page 3)
  const [selectedLesson, setSelectedLesson] = useState<string>("1");

  const pdfUrl = "/ahsanul-qawaid/ahsanul-qawaid-book-1.pdf";

  const {
    renderPage,
    isLoading,
    error,
    numPages,
    pdfDoc
  } = usePdfViewer({
    pdfUrl,
    canvasRef,
    pageNumber,
    scale: 1.5 // Lower scale for faster rendering
  });

  // Render page when PDF loads or page changes
  useEffect(() => {
    if (pdfDoc && pageNumber > 0) {
      renderPage();
    }
  }, [pdfDoc, pageNumber]);

  // Navigate to lesson page when currentLesson changes
  useEffect(() => {
    if (currentLesson?.surah) {
      // Extract lesson number from surah field (e.g., "Lesson 5" -> 5)
      const lessonMatch = currentLesson.surah.match(/Lesson\s*(\d+)/i);
      if (lessonMatch) {
        const lessonNum = parseInt(lessonMatch[1]);
        const targetPage = LESSON_TO_PAGE[lessonNum];
        if (targetPage) {
          setPageNumber(targetPage);
          setSelectedLesson(lessonNum.toString());
        }
      }
    }
  }, [currentLesson]);

  // Navigate when previewLesson changes (from form dropdown selection)
  useEffect(() => {
    if (previewLesson) {
      const lessonNum = parseInt(previewLesson);
      if (!isNaN(lessonNum)) {
        const targetPage = LESSON_TO_PAGE[lessonNum];
        if (targetPage) {
          setPageNumber(targetPage);
          setSelectedLesson(lessonNum.toString());
          if (onPageChange) {
            onPageChange(targetPage);
          }
        }
      }
    }
  }, [previewLesson, onPageChange]);

  // Get current lesson from page number (for display)
  const currentLessonNum = useMemo(() => getLessonFromPage(pageNumber), [pageNumber]);

  // Handle page navigation (next/prev PAGE)
  const handleNextPage = () => {
    if (numPages && pageNumber < numPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      // Update selected lesson based on new page
      setSelectedLesson(getLessonFromPage(newPage).toString());
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
      // Update selected lesson based on new page
      setSelectedLesson(getLessonFromPage(newPage).toString());
      if (onPageChange) {
        onPageChange(newPage);
      }
      setTimeout(() => {
        viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // Handle lesson selection from dropdown (jumps to START of lesson)
  const handleLessonChange = (value: string) => {
    const lessonNum = parseInt(value);
    const targetPage = LESSON_TO_PAGE[lessonNum];
    if (targetPage) {
      setSelectedLesson(value);
      setPageNumber(targetPage);
      if (onPageChange) {
        onPageChange(targetPage);
      }
      setTimeout(() => {
        viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // Handle scroll to next page
  useEffect(() => {
    const handleScroll = debounce(() => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;

      // If we are at the bottom (within 10px of the very end, requiring scroll through the spacer)
      if (scrollPosition + 10 >= documentHeight) {
        if (pageNumber < (numPages || 0) && !isLoading) {
          handleNextPage();
        }
      }
    }, 300);

    window.addEventListener('scroll', handleScroll);
    return () => {
      handleScroll.cancel();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pageNumber, isLoading, numPages]);

  // Create lesson options (1-29)
  const lessonOptions = Array.from({ length: 29 }, (_, i) => (i + 1).toString());

  return (
    <Card ref={viewerRef} className="w-full overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50">
      <div className="relative w-full">
        {/* Top Navigation */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-emerald-200 bg-emerald-100 gap-1 sm:gap-2">
          <Button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1 || isLoading}
            variant="outline"
            size="sm"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-200 h-8 px-2 sm:px-3"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Select value={selectedLesson} onValueChange={handleLessonChange}>
                <SelectTrigger className="w-[140px] h-8 bg-white border-emerald-300 text-emerald-700">
                  <SelectValue placeholder="Select Lesson" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px]">
                  <div className="h-[200px] overflow-y-auto">
                    {lessonOptions.map(lesson => (
                      <SelectItem
                        key={lesson}
                        value={lesson}
                        className="text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                      >
                        Lesson {lesson}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-emerald-700 font-semibold text-xs sm:text-sm">
                Page {pageNumber} {numPages ? `/ ${numPages}` : ''} • Lesson {currentLessonNum}
              </span>
              <span className="text-xs text-emerald-600">
                Ahsanul Qawaid Book 1
              </span>
            </div>
          </div>

          <Button
            onClick={handleNextPage}
            disabled={!numPages || pageNumber >= numPages || isLoading}
            variant="outline"
            size="sm"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-200 h-8 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
          </Button>
        </div>

        {/* PDF Canvas */}
        <div className="min-h-[60vh] flex items-center justify-center p-1 sm:p-2 md:p-4 bg-white">
          {error ? (
            <div className="text-center p-8">
              <p className="text-red-500 mb-4">{error}</p>
              <p className="text-gray-500 text-sm">
                Please ensure the Ahsanul Qawaid PDF is placed in the public/ahsanul-qawaid folder.
              </p>
            </div>
          ) : (
            <div className="relative flex items-center justify-center w-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto shadow-lg border border-emerald-100 rounded"
              />
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-t border-emerald-200 bg-emerald-100">
          <Button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1 || isLoading}
            variant="outline"
            size="sm"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-200 h-8 px-2 sm:px-3"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-emerald-700 font-semibold text-xs sm:text-sm">
              Page {pageNumber} {numPages ? `/ ${numPages}` : ''} • Lesson {currentLessonNum}
            </span>
          </div>

          <Button
            onClick={handleNextPage}
            disabled={!numPages || pageNumber >= numPages || isLoading}
            variant="outline"
            size="sm"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-200 h-8 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
          </Button>
        </div>

        {/* Scroll Spacer - Requires user to scroll further to trigger next page */}
        <div className="h-48 w-full flex items-center justify-center text-emerald-700/40 text-sm pb-8">
          Scroll to next page
        </div>
      </div>
    </Card>
  );
};

