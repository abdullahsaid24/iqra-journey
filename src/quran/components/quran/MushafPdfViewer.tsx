import { useEffect, useRef, useState } from "react";
import { usePdfViewer } from "@/quran/hooks/usePdfViewer";
import { useQuranPageWords } from "@/quran/hooks/useQuranPageWords";
import type { MushafWord } from "@/quran/types/mushaf";
import { Loader2 } from "lucide-react";

interface MushafPdfViewerProps {
  pageNumber: number; // Quran page number (1-604)
  isLoading?: boolean;
  onVerseSelect?: (verseKey: string) => void;
  selectedVerseKeys?: string[];
}

// PDF path - user needs to copy the PDF to public folder
const PDF_URL = "/mushaf-al-madinah/mushaf-al-madinah.pdf";

// Map Quran page number to PDF page number
// Quran page 1 starts at PDF page 4
const PDF_PAGE_OFFSET = 3; // Quran page 1 = PDF page 4

const getPdfPageNumber = (quranPage: number): number => {
  return quranPage + PDF_PAGE_OFFSET;
};

export const MushafPdfViewer = ({
  pageNumber,
  isLoading: externalLoading = false,
  onVerseSelect,
  selectedVerseKeys = []
}: MushafPdfViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const pdfPageNumber = getPdfPageNumber(pageNumber);

  // Fetch verse data for clickable overlay
  const { data: mushafPage, isLoading: wordsLoading } = useQuranPageWords(pageNumber);

  const {
    renderPage,
    isLoading: pdfLoading,
    error,
    numPages,
    pdfDoc
  } = usePdfViewer({
    pdfUrl: PDF_URL,
    canvasRef,
    pageNumber: pdfPageNumber,
    scale: 3.0 // High scale for crisp quality at large display size
  });

  // Update canvas size when it renders (using ResizeObserver for efficiency)
  useEffect(() => {
    if (!canvasRef.current) return;

    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setCanvasSize({ width: rect.width, height: rect.height });
        }
      }
    };

    // Use ResizeObserver if available, otherwise fallback to event listener
    let resizeObserver: ResizeObserver | null = null;
    
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
      });
      resizeObserver.observe(canvasRef.current);
    } else {
      // Fallback for browsers without ResizeObserver
      window.addEventListener('resize', updateCanvasSize);
      updateCanvasSize(); // Initial update
    }

    // Also update after a short delay to catch initial render
    const timeoutId = setTimeout(updateCanvasSize, 100);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateCanvasSize);
      }
      clearTimeout(timeoutId);
    };
  }, [pdfPageNumber, pdfLoading]);

  // Render page when PDF loads or page number changes
  useEffect(() => {
    if (!pdfLoading && pdfDoc && pdfPageNumber > 0) {
      // Delay to ensure canvas is ready after mount/remount
      const timeoutId = setTimeout(() => {
        if (canvasRef.current) {
          renderPage();
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [pdfPageNumber, pdfLoading, pdfDoc, renderPage]);

  // Handle verse click
  const handleVerseClick = (verseKey: string) => {
    if (onVerseSelect) {
      onVerseSelect(verseKey);
    }
  };

  // Calculate verse positions for overlay - create clickable areas for each verse on each line
  // These values are calibrated for the standard Madani Mushaf PDF layout
  const getVersePositions = () => {
    if (!mushafPage || !canvasSize.height || !canvasSize.width) return [];

    // Calibrated values for Madani Mushaf PDF layout
    // The decorative border + header (juz/surah info)
    const topMargin = canvasSize.height * 0.055;
    // The footer (page number area + bottom border)
    const bottomMargin = canvasSize.height * 0.065;
    // The decorative side borders + juz markers area
    const sideMargin = canvasSize.width * 0.115;
    
    const contentHeight = canvasSize.height - topMargin - bottomMargin;
    const contentWidth = canvasSize.width - (sideMargin * 2);
    const lineHeight = contentHeight / 15;

    const versePositions: Array<{
      verseKey: string;
      verseNumber: number;
      top: number;
      left: number;
      width: number;
      height: number;
    }> = [];

    // Process each line and create clickable areas for verses within it
    mushafPage.lines.forEach((line) => {
      if (line.words.length === 0) return;

      const lineNumber = line.lineNumber;
      const top = topMargin + (lineNumber - 1) * lineHeight;
      
      // Group consecutive words by verse on this line
      const verseSegments: Array<{ verseKey: string; startIndex: number; endIndex: number }> = [];
      let currentSegment: { verseKey: string; startIndex: number; endIndex: number } | null = null;
      
      line.words.forEach((word, wordIndex) => {
        const verseKey = word.verse_key;
        if (!currentSegment || currentSegment.verseKey !== verseKey) {
          if (currentSegment) {
            verseSegments.push(currentSegment);
          }
          currentSegment = { verseKey, startIndex: wordIndex, endIndex: wordIndex };
        } else {
          currentSegment.endIndex = wordIndex;
        }
      });
      if (currentSegment) {
        verseSegments.push(currentSegment);
      }

      const totalWords = line.words.length;
      
      // Create clickable area for each verse segment on this line
      verseSegments.forEach((segment) => {
        const [, verseNum] = segment.verseKey.split(':').map(Number);
        
        // Calculate position based on word indices
        // Arabic is RTL: word 0 is rightmost, last word is leftmost
        // So we need to flip: startRatio maps to RIGHT side, endRatio maps to LEFT side
        const startRatio = segment.startIndex / totalWords;
        const endRatio = (segment.endIndex + 1) / totalWords;
        
        // In RTL: right edge = (1 - startRatio), left edge = (1 - endRatio)
        const rightEdge = sideMargin + ((1 - startRatio) * contentWidth);
        const leftEdge = sideMargin + ((1 - endRatio) * contentWidth);
        const width = rightEdge - leftEdge;
        
        // Calculate the maximum allowed bottom position
        const maxBottom = canvasSize.height - bottomMargin;
        const boxBottom = top + lineHeight;
        
        // Only add if the box is within the visible text area
        if (boxBottom <= maxBottom && top >= topMargin) {
          versePositions.push({
            verseKey: segment.verseKey,
            verseNumber: verseNum,
            top: top,
            left: leftEdge,
            width: Math.max(width, contentWidth * 0.03), // Minimum 3% width
            height: Math.min(lineHeight, maxBottom - top) // Cap height to not exceed bottom
          });
        }
      });
    });

    return versePositions;
  };

  const versePositions = getVersePositions();
  // Only show full loading on initial load, not page changes
  const isInitialLoading = pdfLoading && !pdfDoc;
  const isLoading = externalLoading || isInitialLoading;

  if (error) {
    return (
      <div className="mushaf-page-container">
        <div className="mushaf-traditional-border">
          <div className="mushaf-page">
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-center p-8">
              <p className="text-red-600 mb-4">Error loading PDF: {error}</p>
              <p className="text-sm text-gray-600">
                Please ensure the PDF file is located at: <code className="bg-gray-100 px-2 py-1 rounded">public/mushaf-al-madinah/mushaf-al-madinah.pdf</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mushaf-page-container">
      <div className="mushaf-traditional-border">
        <div className="mushaf-page">
          <div className="flex items-center justify-center p-0 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-mushaf-cream/80 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-mushaf-gold" />
              </div>
            )}
            <div className="relative inline-block w-full">
              <canvas
                ref={canvasRef}
                className="w-full h-auto shadow-lg relative"
                style={{
                  minHeight: "85vh",
                  width: "100%",
                  height: "auto"
                }}
              />
              {/* Clickable verse overlay */}
              {canvasSize.width > 0 && canvasSize.height > 0 && versePositions.length > 0 && !wordsLoading && (
                <div
                  ref={overlayRef}
                  className="absolute top-0 left-0 pointer-events-auto"
                  style={{
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                  }}
                >
                  {versePositions.map((pos, index) => {
                    const isSelected = selectedVerseKeys.includes(pos.verseKey);
                    return (
                      <div
                        key={`${pos.verseKey}-${index}`}
                        onClick={() => handleVerseClick(pos.verseKey)}
                        className={`absolute cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-yellow-200/30 border-2 border-yellow-400' 
                            : 'hover:bg-blue-200/20'
                        }`}
                        style={{
                          top: `${pos.top}px`,
                          left: `${pos.left}px`,
                          width: `${pos.width}px`,
                          height: `${pos.height}px`,
                        }}
                        title={`Verse ${pos.verseNumber} (${pos.verseKey})`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

