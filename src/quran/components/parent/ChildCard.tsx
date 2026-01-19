
import { Card, CardContent, CardHeader, CardTitle } from "@/quran/components/ui/card";
import { ChevronRight, BookOpen } from "lucide-react";

interface ChildStats {
  lessons_completed: number;
  total_mistakes: number;
  passing_rate: number;
}

interface ChildCardProps {
  id: string;
  name: string;
  currentLesson?: {
    surah: string;
    verses: string;
  };
  stats?: ChildStats;
  onClick: (childId: string) => void;
}

export const ChildCard = ({ id, name, currentLesson, stats, onClick }: ChildCardProps) => {
  return (
    <Card 
      key={id} 
      className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-md border-quran-border/30 transition-all hover:shadow-lg cursor-pointer animate-fade-in"
      onClick={() => onClick(id)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-quran-primary/10 to-quran-primary/5">
        <CardTitle className="text-xl font-semibold text-quran-primary">
          {name}
        </CardTitle>
        <ChevronRight className="h-4 w-4 text-quran-primary" />
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <BookOpen className="mt-1 h-5 w-5 text-quran-secondary" />
            <div>
              <p className="font-medium text-quran-primary">Current Lesson</p>
              <p className="text-sm text-quran-bg font-medium">
                {currentLesson 
                  ? `Surah ${currentLesson.surah}: Verses ${currentLesson.verses}`
                  : "No lesson assigned yet"}
              </p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="parent-dashboard-stat">
                <p className="text-sm text-quran-primary font-medium">Lessons Completed</p>
                <p className="text-lg font-semibold text-quran-bg">
                  {stats.lessons_completed}
                </p>
              </div>
              <div className="parent-dashboard-stat">
                <p className="text-sm text-quran-primary font-medium">Total Mistakes</p>
                <p className="text-lg font-semibold text-quran-bg">
                  {stats.total_mistakes}
                </p>
              </div>
              <div className="parent-dashboard-stat">
                <p className="text-sm text-quran-primary font-medium">Passing Rate</p>
                <p className="text-lg font-semibold text-quran-bg">
                  {Math.round(stats.passing_rate)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
