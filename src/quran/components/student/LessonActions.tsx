import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/quran/components/ui/button";

interface LessonActionsProps {
  mistakes: number;
  onNextLesson: () => void;
  onRepeat: () => void;
}

export const LessonActions = ({
  mistakes,
  onNextLesson,
  onRepeat,
}: LessonActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onNextLesson}
        className="flex-1 bg-quran-primary text-white hover:bg-quran-bg"
        variant={mistakes <= 2 ? "default" : "secondary"}
        disabled={mistakes > 2}
      >
        <span className="mr-2">Next Lesson</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button 
        onClick={onRepeat} 
        variant="outline" 
        className="flex-1 border-quran-border text-quran-bg hover:bg-quran-bg hover:text-white"
      >
        <span className="mr-2">Repeat</span>
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
