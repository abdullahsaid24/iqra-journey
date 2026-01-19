import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/quran/components/ui/select";
import { Label } from "@/quran/components/ui/label";

interface QuranPageSelectProps {
  selectedPage: string;
  onPageChange: (value: string) => void;
  startFromPage?: string;
  label: string;
}

export const QuranPageSelect = ({
  selectedPage,
  onPageChange,
  startFromPage,
  label
}: QuranPageSelectProps) => {
  // Create pages 1-604 for full Quran
  const pages = Array.from({ length: 604 }, (_, i) => (i + 1).toString());
  
  // If startFromPage is provided, filter to show only pages from that number onwards
  const availablePages = startFromPage 
    ? pages.filter(page => parseInt(page) >= parseInt(startFromPage))
    : pages;

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="page" className="text-right font-semibold text-gray-700">
        {label}
      </Label>
      <div className="col-span-3">
        <Select value={selectedPage} onValueChange={onPageChange}>
          <SelectTrigger className="bg-white text-gray-900 border-gray-200">
            <SelectValue placeholder="Select page number" />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[300px]">
            <div className="h-[200px] overflow-y-auto">
              {availablePages.map(page => (
                <SelectItem 
                  key={page} 
                  value={page} 
                  className="text-gray-900 hover:bg-gray-100 cursor-pointer"
                >
                  <span className="text-gray-900">Page {page}</span>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
