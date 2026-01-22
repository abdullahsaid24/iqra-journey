import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePdfViewer } from "@/hooks/usePdfViewer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { debounce } from "lodash";

// The PDF has an extra page at the beginning (cover), so PDF pages are offset by 1
// Book page 1 = PDF page 2, Book page 10 = PDF page 11, etc.
const PDF_PAGE_OFFSET = 1;

// Convert book page to PDF page
const bookPageToPdfPage = (bookPage: number): number => bookPage + PDF_PAGE_OFFSET;

// Convert PDF page to book page
const pdfPageToBookPage = (pdfPage: number): number => Math.max(1, pdfPage - PDF_PAGE_OFFSET);

interface NoorAlBayanViewerProps {
  currentLesson?: { surah: string; verses: string } | null;
  onPageChange?: (pageNumber: number) => void;
  previewPage?: string | null; // For live preview when form selection changes
}

export const NoorAlBayanViewer = ({
  currentLesson,
  onPageChange,
  previewPage
}: NoorAlBayanViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfPageNumber, setPdfPageNumber] = useState<number>(2); // Start at PDF page 2 (book page 1)
  const [selectedBookPage, setSelectedBookPage] = useState<string>("1");

  const pdfUrl = "/noor-al-bayan/noor-al-bayan.pdf";

  const {
    renderPage,
    isLoading,
    error,
    numPages,
    pdfDoc
  } = usePdfViewer({
    pdfUrl,
    canvasRef,
    pageNumber: pdfPageNumber,
    scale: 1.5
  });

  // Calculate the current book page from PDF page
  const currentBookPage = pdfPageToBookPage(pdfPageNumber);

  // Calculate total book pages (PDF pages minus the cover)
  const totalBookPages = numPages ? numPages - PDF_PAGE_OFFSET : 97;

  // Render page when PDF loads or page changes
  useEffect(() => {
    if (pdfDoc && pdfPageNumber > 0) {
      renderPage();
    }
  }, [pdfDoc, pdfPageNumber]);

  // Navigate to page when currentLesson changes (uses verses field as book page number)
  useEffect(() => {
    if (currentLesson?.verses) {
      // Extract book page number from verses field (e.g., "5" or "5-10" -> 5)
      const pageMatch = currentLesson.verses.match(/^(\d+)/);
      if (pageMatch) {
        const bookPage = parseInt(pageMatch[1]);
        const pdfPage = bookPageToPdfPage(bookPage);
        if (bookPage >= 1 && (!numPages || pdfPage <= numPages)) {
          setPdfPageNumber(pdfPage);
          setSelectedBookPage(bookPage.toString());
        }
      }
    }
  }, [currentLesson, numPages]);

  // Navigate when previewPage changes (from form dropdown selection)
  useEffect(() => {
    if (previewPage) {
      const bookPage = parseInt(previewPage);
      if (!isNaN(bookPage) && bookPage >= 1) {
        const pdfPage = bookPageToPdfPage(bookPage);
        if (!numPages || pdfPage <= numPages) {
          setPdfPageNumber(pdfPage);
          setSelectedBookPage(bookPage.toString());
          if (onPageChange) {
            onPageChange(pdfPage);
          }
        }
      }
    }
  }, [previewPage, numPages, onPageChange]);

  // Handle page navigation (navigates by PDF page, but respects book page boundaries)
  const handleNextPage = () => {
    if (numPages && pdfPageNumber < numPages) {
      const newPdfPage = pdfPageNumber + 1;
      setPdfPageNumber(newPdfPage);
      setSelectedBookPage(pdfPageToBookPage(newPdfPage).toString());
      if (onPageChange) {
        onPageChange(newPdfPage);
      }
      setTimeout(() => {
        viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const handlePrevPage = () => {
    // Don't go before PDF page 2 (book page 1)
    if (pdfPageNumber > bookPageToPdfPage(1)) {
      const newPdfPage = pdfPageNumber - 1;
      setPdfPageNumber(newPdfPage);
      setSelectedBookPage(pdfPageToBookPage(newPdfPage).toString());
      if (onPageChange) {
        onPageChange(newPdfPage);
      }
      setTimeout(() => {
        viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // Handle page selection from dropdown (book page number)
  const handlePageSelect = (value: string) => {
    const bookPage = parseInt(value);
    const pdfPage = bookPageToPdfPage(bookPage);
    if (bookPage >= 1 && (!numPages || pdfPage <= numPages)) {
      setSelectedBookPage(value);
      setPdfPageNumber(pdfPage);
      if (onPageChange) {
        onPageChange(pdfPage);
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
        if (pdfPageNumber < (numPages || 0) && !isLoading) {
          handleNextPage();
        }
      }
    }, 300);

    window.addEventListener('scroll', handleScroll);
    return () => {
      handleScroll.cancel();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pdfPageNumber, isLoading, numPages]);

  // Create page options based on total book pages
  const pageOptions = Array.from({ length: totalBookPages }, (_, i) => (i + 1).toString());

  return (
    <Card ref={viewerRef} className="w-full overflow-hidden rounded-lg border border-amber-200 bg-amber-50">
      <div className="relative w-full">
        {/* Top Navigation */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-amber-200 bg-amber-100 gap-1 sm:gap-2">
          <Button
            onClick={handlePrevPage}
            disabled={currentBookPage <= 1 || isLoading}
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-200 h-8 px-2 sm:px-3"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Select value={selectedBookPage} onValueChange={handlePageSelect}>
                <SelectTrigger className="w-[120px] h-8 bg-white border-amber-300 text-amber-700">
                  <SelectValue placeholder="Select Page" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px]">
                  <div className="h-[200px] overflow-y-auto">
                    {pageOptions.map(page => (
                      <SelectItem
                        key={page}
                        value={page}
                        className="text-amber-700 hover:bg-amber-50 cursor-pointer"
                      >
                        Page {page}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-amber-700 font-semibold text-xs sm:text-sm">
                Page {currentBookPage} / {totalBookPages}
              </span>
              <span className="text-xs text-amber-600">
                Noor Al Bayan
              </span>
            </div>
          </div>

          <Button
            onClick={handleNextPage}
            disabled={currentBookPage >= totalBookPages || isLoading}
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-200 h-8 px-2 sm:px-3"
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
                Please ensure the Noor Al Bayan PDF is placed in the public/noor-al-bayan folder.
              </p>
            </div>
          ) : (
            <div className="relative flex items-center justify-center w-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto shadow-lg border border-amber-100 rounded"
              />
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-t border-amber-200 bg-amber-100">
          <Button
            onClick={handlePrevPage}
            disabled={currentBookPage <= 1 || isLoading}
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-200 h-8 px-2 sm:px-3"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-amber-700 font-semibold text-xs sm:text-sm">
              Page {currentBookPage} / {totalBookPages}
            </span>
          </div>

          <Button
            onClick={handleNextPage}
            disabled={currentBookPage >= totalBookPages || isLoading}
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-200 h-8 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
          </Button>
        </div>

        {/* Scroll Spacer - Requires user to scroll further to trigger next page */}
        <div className="h-48 w-full flex items-center justify-center text-amber-700/40 text-sm pb-8">
          Scroll to next page
        </div>
      </div>
    </Card>
  );
};

