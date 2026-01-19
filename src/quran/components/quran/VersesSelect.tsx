
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/quran/components/ui/select";
import { Label } from "@/quran/components/ui/label";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";
import { Input } from "@/quran/components/ui/input";
import { Search } from "lucide-react";

interface VersesSelectProps {
  selectedVerses: string;
  onVersesChange: (value: string) => void;
  selectedSurah: string;
}

export const VersesSelect = ({
  selectedVerses,
  onVersesChange,
  selectedSurah,
}: VersesSelectProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const selectedSurahData = AVAILABLE_SURAHS.find(surah => surah.name === selectedSurah);
  const totalVerses = selectedSurahData?.versesCount || 0;
  
  // Create the array of verses
  const versesArray = Array.from({ length: totalVerses }, (_, i) => (i + 1).toString());
  
  // Filter verses based on search query
  const filteredVerses = versesArray.filter(verse => 
    verse.includes(searchQuery)
  );

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right font-semibold text-gray-700">Verse</Label>
      <div className="col-span-3">
        <Select
          value={selectedVerses}
          onValueChange={onVersesChange}
          disabled={!selectedSurah}
        >
          <SelectTrigger className="bg-white text-gray-900 border-gray-200">
            <SelectValue placeholder={selectedSurah ? "Select verse" : "Select a Surah first"} />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[300px]">
            <div className="p-2 sticky top-0 z-10 bg-white border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
                <Input 
                  placeholder="Search verse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm bg-white text-black"
                  disabled={!selectedSurah}
                />
              </div>
            </div>
            <div className="h-[200px] overflow-y-auto">
              {selectedSurah ? (
                filteredVerses.length > 0 ? (
                  filteredVerses.map((verse) => (
                    <SelectItem 
                      key={verse} 
                      value={verse}
                      className="text-gray-900 hover:bg-gray-100 cursor-pointer"
                    >
                      <span className="text-gray-900">Verse {verse}</span>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-gray-500">No verses found</div>
                )
              ) : (
                <div className="p-2 text-center text-gray-500">Select a Surah first</div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
