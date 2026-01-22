import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABLE_SURAHS } from "@/types/quran";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CompactSurahSelectProps {
  selectedSurah: string;
  onSurahChange: (value: string) => void;
}

export const CompactSurahSelect = ({
  selectedSurah,
  onSurahChange,
}: CompactSurahSelectProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredSurahs = AVAILABLE_SURAHS.filter(surah => 
    surah.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    surah.name_arabic?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    surah.number.toString().includes(searchQuery)
  );

  return (
    <Select value={selectedSurah} onValueChange={onSurahChange}>
      <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-quran-border text-quran-bg">
        <SelectValue placeholder="Select Surah" />
      </SelectTrigger>
      <SelectContent className="bg-white max-h-[300px] z-50">
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
                  <span className="text-gray-900 text-xs">{surah.name}</span>
                  <span className="font-arabic text-sm text-gray-900">
                    {surah.name_arabic}
                  </span>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-center text-gray-500 text-xs">No surahs found</div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};