
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { QuranPdfDownloader } from "./QuranPdfDownloader";

interface PdfSelectorProps {
  onPdfSelected: (pdfUrl: string) => void;
}

export function PdfSelector({ onPdfSelected }: PdfSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setIsSelecting(false);
    
    if (!file) {
      toast.error("No file selected");
      return;
    }
    
    if (file.type !== 'application/pdf') {
      toast.error("Please select a PDF file");
      return;
    }
    
    console.log("File selected:", file.name);
    const pdfUrl = URL.createObjectURL(file);
    onPdfSelected(pdfUrl);
    toast.success(`${file.name} loaded successfully`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
      <div>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-file-input"
          disabled={isSelecting}
        />
        <label htmlFor="pdf-file-input">
          <Button
            variant="outline"
            className="cursor-pointer gap-2"
            disabled={isSelecting}
            onClick={() => setIsSelecting(true)}
            asChild
          >
            <span>
              <Upload className="h-4 w-4" />
              Select Quran PDF
            </span>
          </Button>
        </label>
      </div>
      
      <div className="text-center text-sm text-muted-foreground">or</div>
      
      <QuranPdfDownloader onDownloadComplete={() => {
        toast.info("Please select the downloaded file using the 'Select Quran PDF' button");
      }} />
    </div>
  );
}
