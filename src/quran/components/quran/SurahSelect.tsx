
import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/quran/components/ui/select";
import { Label } from "@/quran/components/ui/label";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";
import { ScrollArea } from "@/quran/components/ui/scroll-area";
import { Input } from "@/quran/components/ui/input";
import { Search } from "lucide-react";

interface SurahSelectProps {
  selectedSurah: string;
  onSurahChange: (value: string) => void;
  startFromSurah?: string;
}

export const SurahSelect = ({
  selectedSurah,
  onSurahChange,
  startFromSurah
}: SurahSelectProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredSurahs = AVAILABLE_SURAHS.filter(surah => {
    // Filter by search query
    const matchesSearch = surah.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      surah.name_arabic?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      surah.number.toString().includes(searchQuery);
    
    // If startFromSurah is provided, only show surahs from that number onwards
    if (startFromSurah) {
      const startSurahNumber = AVAILABLE_SURAHS.find(s => s.name === startFromSurah)?.number || 1;
      return matchesSearch && surah.number >= startSurahNumber;
    }
    
    return matchesSearch;
  });

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="surah" className="text-right font-semibold text-gray-700">
        Surah
      </Label>
      <div className="col-span-3">
        <Select value={selectedSurah} onValueChange={onSurahChange}>
          <SelectTrigger className="bg-white text-gray-900 border-gray-200">
            <SelectValue placeholder="Select Surah" />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[300px]">
            <div className="p-2 sticky top-0 z-10 bg-white border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input 
                  placeholder="Search surah..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="pl-8 h-8 text-sm bg-white" 
                />
              </div>
            </div>
            <div className="h-[200px] overflow-y-auto">
              {filteredSurahs.length > 0 ? (
                filteredSurahs.map(surah => (
                  <SelectItem 
                    key={surah.number} 
                    value={surah.name} 
                    className="text-gray-900 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-900">{surah.name}</span>
                      <span className="font-arabic text-lg text-gray-900">
                        {surah.name_arabic}
                      </span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-gray-500">No surahs found</div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
