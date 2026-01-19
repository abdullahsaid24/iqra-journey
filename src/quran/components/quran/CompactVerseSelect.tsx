import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/quran/components/ui/select";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";
import { Input } from "@/quran/components/ui/input";
import { Search } from "lucide-react";

interface CompactVerseSelectProps {
  selectedVerse: string;
  onVerseChange: (value: string) => void;
  selectedSurah: string;
}

export const CompactVerseSelect = ({
  selectedVerse,
  onVerseChange,
  selectedSurah,
}: CompactVerseSelectProps) => {
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
    <Select
      value={selectedVerse}
      onValueChange={onVerseChange}
      disabled={!selectedSurah}
    >
      <SelectTrigger className="w-[100px] h-8 text-xs bg-white border-quran-border text-quran-bg">
        <SelectValue placeholder={selectedSurah ? "Verse" : "Select Surah"} />
      </SelectTrigger>
      <SelectContent className="bg-white max-h-[300px] z-50">
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
                  <span className="text-gray-900 text-xs">Verse {verse}</span>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-center text-gray-500 text-xs">No verses found</div>
            )
          ) : (
            <div className="p-2 text-center text-gray-500 text-xs">Select a Surah first</div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};
