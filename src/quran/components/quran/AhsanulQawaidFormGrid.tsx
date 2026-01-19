import { AhsanulQawaidLessonSelect } from "./AhsanulQawaidLessonSelect";

interface AhsanulQawaidFormGridProps {
  startLesson: string;
  endLesson: string;
  onStartLessonChange: (value: string) => void;
  onEndLessonChange: (value: string) => void;
}

export const AhsanulQawaidFormGrid = ({
  startLesson,
  endLesson,
  onStartLessonChange,
  onEndLessonChange,
}: AhsanulQawaidFormGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="mb-2 font-semibold text-gray-700">Start</h3>
        <div className="space-y-2">
          <AhsanulQawaidLessonSelect
            selectedLesson={startLesson}
            onLessonChange={onStartLessonChange}
            label="Lesson #"
          />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-gray-700">End</h3>
        <div className="space-y-2">
          <AhsanulQawaidLessonSelect
            selectedLesson={endLesson}
            onLessonChange={onEndLessonChange}
            startFromLesson={startLesson}
            label="Lesson #"
          />
        </div>
      </div>
    </div>
  );
};
