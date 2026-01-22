
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AVAILABLE_SURAHS } from "@/types/quran";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedSurah: number | null;
  onSelect: (value: string) => void;
  currentLesson?: {
    surah: string;
    verses: string;
  } | null;
}

export const SearchDialog = ({
  open,
  setOpen,
  selectedSurah,
  onSelect,
  currentLesson,
}: SearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<Array<{id: string, label: string}>>([]);
  
  // Reset search when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      // Set initial filtered items when dialog opens
      if (!selectedSurah) {
        // If we have a current lesson, highlight it in the list
        const items = AVAILABLE_SURAHS.map(surah => ({
          id: `${surah.number}-`,
          label: surah.name,
          isCurrent: currentLesson && currentLesson.surah.includes(surah.name)
        }));
        
        setFilteredItems(items);
        
        // If there's a current lesson, scroll to it or set it as initial search term
        if (currentLesson) {
          const surahName = currentLesson.surah.split('-')[0].trim();
          const surah = AVAILABLE_SURAHS.find(s => s.name === surahName);
          if (surah) {
            // Set the search query to help locate the current lesson surah
            setSearchQuery(surahName.substring(0, 3));
          }
        }
      } else {
        const surah = AVAILABLE_SURAHS.find(s => s.number === selectedSurah);
        if (surah) {
          // If we have a current lesson and it matches the selected surah,
          // extract the verse number to use as initial search
          let initialSearchQuery = "";
          if (currentLesson) {
            const surahParts = currentLesson.surah.split('-');
            const surahName = surahParts[0].trim();
            
            if (surah.name === surahName) {
              const verseParts = currentLesson.verses.split('-');
              const verseNumber = verseParts[0].split(':')[1];
              initialSearchQuery = verseNumber;
            }
          }
          
          setFilteredItems(
            Array.from({ length: surah.versesCount }, (_, i) => i + 1).map(verse => ({
              id: `${verse}`,
              label: `Verse ${verse}`,
              isCurrent: currentLesson && 
                currentLesson.verses.includes(`${selectedSurah}:${verse}`)
            }))
          );
          
          setSearchQuery(initialSearchQuery);
        }
      }
    }
  }, [open, selectedSurah, currentLesson]);

  // Update filtered items when search query or selected surah changes
  useEffect(() => {
    if (!selectedSurah) {
      // Filter surahs
      const filtered = AVAILABLE_SURAHS
        .filter(surah => 
          surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          surah.number.toString().includes(searchQuery)
        )
        .map(surah => ({
          id: `${surah.number}-`,
          label: surah.name,
          isCurrent: currentLesson && currentLesson.surah.includes(surah.name)
        }));
      setFilteredItems(filtered);
    } else {
      // Filter verses for the selected surah
      const surah = AVAILABLE_SURAHS.find(s => s.number === selectedSurah);
      if (!surah) return;

      const verses = Array.from({ length: surah.versesCount }, (_, i) => i + 1)
        .filter(verse => 
          searchQuery === "" || verse.toString().includes(searchQuery)
        )
        .map(verse => ({
          id: `${verse}`,
          label: `Verse ${verse}`,
          isCurrent: currentLesson && 
            currentLesson.verses.includes(`${selectedSurah}:${verse}`)
        }));
      setFilteredItems(verses);
    }
  }, [searchQuery, selectedSurah, currentLesson]);

  const handleItemClick = (id: string) => {
    onSelect(id);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const selectedSurahName = selectedSurah 
    ? AVAILABLE_SURAHS.find(s => s.number === selectedSurah)?.name 
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogTitle>
          {selectedSurah ? `Select verse from ${selectedSurahName}` : "Select surah"}
        </DialogTitle>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={selectedSurah ? "Search verse..." : "Search surah..."}
            className="pl-9 w-full"
            autoComplete="off"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <ScrollArea className="h-72 mt-2">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    (item as any).isCurrent 
                      ? 'bg-quran-light/60 font-medium' 
                      : 'hover:bg-quran-light'
                  }`}
                  onClick={() => handleItemClick(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No results found
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
