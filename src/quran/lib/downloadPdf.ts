import { toast } from "sonner";

interface DownloadOptions {
  url: string;
  filename: string;
  onSuccess?: (localUrl?: string) => void;
  onError?: (error: Error) => void;
}

export const downloadPdf = async ({
  url,
  filename,
  onSuccess,
  onError
}: DownloadOptions): Promise<void> => {
  try {
    console.log(`Attempting to download PDF from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    toast.success(`${filename} downloaded successfully`);
    
    // We cannot directly access the downloaded file due to browser security restrictions
    // Instead, we return the object URL and inform the user they'll need to select the file
    onSuccess?.(objectUrl);
    
    // Delay revoking the URL to ensure download completes
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 5000);
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
    toast.error(`Failed to download ${filename}`);
    onError?.(error as Error);
  }
};

export const getDefaultQuranPdfUrl = (): string => {
  // Using the DigitalKhatt Mushaf PDF URL
  return 'https://digitalkhatt.org/cdn/digitalmushaf/mushaf.pdf';
};

// Check if the local PDF exists in the public directory
export const checkLocalPdfExists = async (): Promise<boolean> => {
  try {
    console.log("Checking if local PDF exists...");
    const response = await fetch('/quran-pdf/mushaf.pdf', { 
      method: 'HEAD',
      cache: 'no-store' // Prevent caching to ensure we're checking the current state
    });
    const exists = response.ok;
    console.log(`Local PDF exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error('Error checking local PDF existence:', error);
    return false;
  }
};
