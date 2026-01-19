import { useState, useEffect, useCallback, RefObject, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';

// For consistent versioning
const pdfVersion = pdfjs.version;

// Configure the worker properly for Vite environment
// For pdfjs-dist v5.x, the worker is at /build/pdf.worker.min.mjs
if (typeof window !== 'undefined' && 'Worker' in window) {
  // Use unpkg with the correct path for v5.x
  const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.mjs`;
  console.log(`Setting PDF.js worker source to ${workerSrc}`);
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
}

// Global PDF document cache to avoid reloading
const pdfCache: Map<string, pdfjs.PDFDocumentProxy> = new Map();

// Get or load a PDF from cache
async function getCachedPdf(url: string): Promise<pdfjs.PDFDocumentProxy> {
  const cached = pdfCache.get(url);
  if (cached) {
    return cached;
  }

  const loadingTask = pdfjs.getDocument({
    url,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfVersion}/cmaps/`,
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  pdfCache.set(url, pdf);
  return pdf;
}

interface UsePdfViewerProps {
  pdfUrl: string;
  canvasRef: RefObject<HTMLCanvasElement>;
  pageNumber: number;
  scale?: number;
}

interface UsePdfViewerResult {
  renderPage: () => void;
  isLoading: boolean;
  error: string | null;
  numPages: number;
  pdfDoc: pdfjs.PDFDocumentProxy | null;
  goToNextPage: () => void;
  goToPrevPage: () => void;
}

export function usePdfViewer({
  pdfUrl,
  canvasRef,
  pageNumber,
  scale = 1.5
}: UsePdfViewerProps): UsePdfViewerResult {
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const isRenderingRef = useRef<boolean>(false);

  // Load the PDF document from cache
  useEffect(() => {
    let cancelled = false;

    const loadPDF = async () => {
      if (!pdfUrl) {
        setError("No PDF URL provided");
        setIsLoading(false);
        return;
      }

      // Check if already cached to avoid unnecessary loading state
      const cached = pdfCache.get(pdfUrl);
      if (cached) {
        setPdfDoc(cached);
        setNumPages(cached.numPages);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load PDF (will be cached for next time)
        const pdf = await getCachedPdf(pdfUrl);

        if (!cancelled) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading PDF:', err);
          setError('Failed to load the PDF. Please try again.');
          setIsLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Render the current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) {
      console.log('renderPage: missing pdfDoc or canvas');
      return;
    }

    // Cancel any ongoing render task
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // Ignore cancel errors
      }
      renderTaskRef.current = null;
      isRenderingRef.current = false; // Reset so we can start a new render
    }

    // If already rendering the same page, skip
    if (isRenderingRef.current) {
      return;
    }

    try {
      isRenderingRef.current = true;

      // Validate page number
      if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
        console.error(`Invalid page number: ${pageNumber}, total pages: ${pdfDoc.numPages}`);
        return;
      }

      // Get the page (PDF.js handles page caching internally)
      const page = await pdfDoc.getPage(pageNumber);

      // Check if canvas still exists (component might have unmounted)
      if (!canvasRef.current) {
        return;
      }

      // Set canvas dimensions
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      // pdfjs-dist v5.x requires 'canvas' property in addition to 'canvasContext'
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      };

      const renderTask = page.render(renderContext as any);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      setError(null);
    } catch (err: unknown) {
      // Ignore cancel errors
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') {
        return;
      }
      console.error('Error rendering PDF page:', err);
      setError('Failed to render the page. Please try again.');
    } finally {
      isRenderingRef.current = false;
      renderTaskRef.current = null;
    }
  }, [pdfDoc, canvasRef, pageNumber, scale]);

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    if (pdfDoc && pageNumber < numPages) {
      return true;
    }
    return false;
  }, [pdfDoc, pageNumber, numPages]);

  // Navigate to previous page
  const goToPrevPage = useCallback(() => {
    if (pdfDoc && pageNumber > 1) {
      return true;
    }
    return false;
  }, [pdfDoc, pageNumber]);

  return {
    renderPage,
    isLoading,
    error,
    numPages,
    pdfDoc,
    goToNextPage,
    goToPrevPage
  };
}
