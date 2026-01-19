
import { formatLessonDisplay } from "@/quran/lib/utils";

interface StudentInfoProps {
  name: string;
  currentLesson?: {
    surah: string;
    verses: string;
  };
  mistakesCount: number;
}

export const StudentInfo = ({ name, currentLesson, mistakesCount }: StudentInfoProps) => {
  return (
    <div className="mb-4 sm:mb-6">
      <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-bold text-quran-bg text-center">
        {name}'s Progress
      </h2>
      <p className="text-base sm:text-lg text-quran-bg text-center mb-2">
        Current Lesson: {currentLesson ? formatLessonDisplay(currentLesson.surah, currentLesson.verses) : "Not assigned yet"}
      </p>
      <p className="text-sm text-gray-600 text-center">
        Mistakes recorded: {mistakesCount}
      </p>
    </div>
  );
};
