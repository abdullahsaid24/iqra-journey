
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadPdf, getDefaultQuranPdfUrl } from "@/lib/downloadPdf";

interface QuranPdfDownloaderProps {
  onDownloadComplete?: (pdfUrl?: string) => void;
}

export function QuranPdfDownloader({ onDownloadComplete }: QuranPdfDownloaderProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    console.log("Starting PDF download...");
    
    try {
      await downloadPdf({
        url: getDefaultQuranPdfUrl(),
        filename: 'mushaf.pdf',
        onSuccess: (objectUrl) => {
          console.log("Download completed successfully");
          // In a browser context, we can't directly access the downloaded file,
          // so we inform the user to select it manually
          onDownloadComplete?.(objectUrl);
        },
        onError: (error) => {
          console.error('Download failed:', error);
        }
      });
    } catch (error) {
      console.error("Unexpected error during download:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isDownloading ? 'Downloading...' : 'Download Quran PDF'}
    </Button>
  );
}
