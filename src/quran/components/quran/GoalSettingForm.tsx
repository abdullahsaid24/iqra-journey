
import { useState } from "react";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { SurahSelect } from "./SurahSelect";
import { VersesSelect } from "./VersesSelect";
import { JuzSelect } from "./JuzSelect";
import { Button } from "@/quran/components/ui/button";
import { startOfMonth } from "date-fns";
import { JUZ_DATA } from "@/quran/types/juz";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";

interface GoalSettingFormProps {
  studentId: string;
  onGoalSet: () => void;
}

export const GoalSettingForm = ({ studentId, onGoalSet }: GoalSettingFormProps) => {
  const [selectedJuz, setSelectedJuz] = useState<string>("");
  const [selectedSurah, setSelectedSurah] = useState<string>("");
  const [selectedVerse, setSelectedVerse] = useState<string>("");

  // Handle Juz selection - auto-fill Surah and Verse to the start of the Juz
  const handleJuzChange = (juzNumber: string) => {
    setSelectedJuz(juzNumber);
    const juz = JUZ_DATA.find(j => j.number === parseInt(juzNumber));
    if (juz) {
      const surah = AVAILABLE_SURAHS.find(s => s.number === juz.startSurah);
      if (surah) {
        setSelectedSurah(surah.name);
        setSelectedVerse(juz.startVerse.toString());
      }
    }
  };

  const handleSetGoal = async () => {
    if (!selectedSurah || !selectedVerse) {
      toast.error("Please select both surah and verse");
      return;
    }

    const currentMonth = startOfMonth(new Date());
    const goalText = `${selectedSurah}:${selectedVerse}`;

    try {
      const { error } = await supabase
        .from("monthly_progress")
        .upsert({
          student_id: studentId,
          month: currentMonth.toISOString(),
          goal_current_lesson: goalText,
        }, {
          onConflict: 'student_id,month'
        });

      if (error) throw error;

      toast.success("Goal set successfully");
      onGoalSet();
    } catch (error) {
      console.error("Error setting goal:", error);
      toast.error("Failed to set goal");
    }
  };

  return (
    <div className="space-y-4">
      <JuzSelect
        selectedJuz={selectedJuz}
        onJuzChange={handleJuzChange}
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SurahSelect
            selectedSurah={selectedSurah}
            onSurahChange={setSelectedSurah}
          />
        </div>
        <div>
          <VersesSelect
            selectedVerses={selectedVerse}
            onVersesChange={setSelectedVerse}
            selectedSurah={selectedSurah}
          />
        </div>
      </div>
      <Button
        onClick={handleSetGoal}
        className="w-full bg-quran-primary text-white hover:bg-quran-primary/90"
      >
        Set Goal
      </Button>
    </div>
  );
};
