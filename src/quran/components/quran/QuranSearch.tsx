
import { useState, useEffect } from "react";
import { Button } from "@/quran/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { SearchDialog } from "./SearchDialog";
import { supabase } from "@/quran/lib/supabase";

interface QuranSearchProps {
  onSelect: (type: "surah" | "ayah" | "juz", value: string) => void;
  studentId?: string;
}

export const QuranSearch = ({ onSelect, studentId }: QuranSearchProps) => {
  const [open, setOpen] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [currentLesson, setCurrentLesson] = useState<{
    surah: string;
    verses: string;
  } | null>(null);

  // Fetch current lesson when component mounts if studentId is provided
  useEffect(() => {
    if (studentId) {
      fetchCurrentLesson();
    }
  }, [studentId]);

  const fetchCurrentLesson = async () => {
    try {
      const { data: lessons, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (lessons && lessons.length > 0) {
        setCurrentLesson({
          surah: lessons[0].surah,
          verses: lessons[0].verses,
        });
      }
    } catch (error) {
      console.error("Error fetching current lesson:", error);
    }
  };

  const handleSelect = (value: string) => {
    if (!selectedSurah) {
      // Surah was selected
      const surahNumber = Number(value.split("-")[0]);
      setSelectedSurah(surahNumber);
      toast.success(`Selected Surah ${surahNumber}. Please select a verse.`);
    } else {
      // Verse was selected
      onSelect("ayah", `${selectedSurah}:${value}`);
      setOpen(false);
      setSelectedSurah(null);
      toast.success("Navigating to selected verse...");
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="border-quran-border bg-white text-quran-bg hover:bg-quran-light"
        onClick={() => {
          setOpen(true);
          setSelectedSurah(null);
        }}
      >
        <Search className="mr-2 h-4 w-4" />
        Search Quran
      </Button>

      <SearchDialog 
        open={open} 
        setOpen={setOpen} 
        selectedSurah={selectedSurah} 
        onSelect={handleSelect} 
        currentLesson={currentLesson}
      />
    </div>
  );
};
