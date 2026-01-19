
import { useState } from "react";
import { useToast } from "@/quran/hooks/use-toast";
import { MistakeCounter } from "@/quran/components/student/MistakeCounter";
import { LessonActions } from "@/quran/components/student/LessonActions";
import { LessonStatus } from "@/quran/components/quran/LessonStatus";
import { formatLessonDisplay } from "@/quran/lib/utils";
import type { StudentData } from "@/quran/types/student";

interface StudentCardProps {
  id: string;
  name: string;
  currentLesson: {
    surah: string;
    verses: string;
  };
  onLessonComplete?: (surah: string, startVerse: string, endVerse: string) => void;
}

export const StudentCard = ({
  id,
  name,
  currentLesson,
  onLessonComplete,
}: StudentCardProps) => {
  const [mistakes, setMistakes] = useState(0);
  const { toast } = useToast();

  const getStatus = (mistakes: number) => {
    if (mistakes <= 1) return "success";
    if (mistakes <= 2) return "warning";
    return "error";
  };

  const handleIncrement = () => {
    setMistakes((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (mistakes > 0) {
      setMistakes((prev) => prev - 1);
    }
  };

  const handleNextLesson = () => {
    if (mistakes <= 2) {
      toast({
        title: "Select Next Lesson",
        description: `${name} has passed the current lesson. Please select verses from the Quran below.`,
      });
    }
  };

  const handleRepeat = () => {
    setMistakes(0);
    toast({
      title: "Lesson Reset",
      description: `${name}'s lesson has been reset.`,
      variant: "destructive",
    });
  };

  const handleStatusUpdate = () => {
    setMistakes(0);
  };

  const status = getStatus(mistakes);
  const formattedLesson = formatLessonDisplay(currentLesson.surah, currentLesson.verses);

  return (
    <div className="space-y-6">
      <div className="student-card">
        <div
          className={`status-indicator bg-quran-${status}`}
          aria-label={`Status: ${status}`}
        />
        <h3 className="mb-2 text-xl font-semibold text-quran-bg">{name}</h3>
        <div className="mb-4 text-sm text-quran-bg">
          <p>
            {formattedLesson}
          </p>
        </div>
        
        <MistakeCounter
          mistakes={mistakes}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
        />
        
        <div className="mb-4">
          <LessonStatus 
            studentId={id}
            currentLesson={currentLesson}
            onStatusUpdate={handleStatusUpdate}
            studentName={name}
          />
        </div>
        
        <LessonActions
          mistakes={mistakes}
          onNextLesson={handleNextLesson}
          onRepeat={handleRepeat}
        />
      </div>
    </div>
  );
};
