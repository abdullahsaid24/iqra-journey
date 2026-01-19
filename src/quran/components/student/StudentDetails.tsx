
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/quran/components/ui/button";
import { QuranDisplay } from "@/quran/components/QuranDisplay";
import { StudentActions } from "./StudentActions";
import { StudentInfo } from "./StudentInfo";
import { BarChart2 } from "lucide-react";
import { useIsMobile } from "@/quran/hooks/use-mobile";
import { TransferClassButton } from "./TransferClassButton";
import type { StudentData } from "@/quran/types/student";

interface StudentDetailsProps {
  studentData: StudentData;
  onLessonComplete: (surah: string, startVerse: string, endVerse: string) => Promise<void>;
  classId?: string;
}

export const StudentDetails = ({ studentData, onLessonComplete, classId }: StudentDetailsProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isQuranDisplayOpen, setIsQuranDisplayOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mistakes, setMistakes] = useState<Array<{ surah: string; ayah: number; word: string }>>([]);

  const handleQuranDisplayToggle = () => {
    setIsQuranDisplayOpen(!isQuranDisplayOpen);
  };

  const handleViewStats = () => {
    navigate(`/quran/student/${studentData.id}/stats`);
  };

  return (
    <div className="min-h-screen bg-quran-bg p-2 sm:p-4 md:p-8">
      <div className="container mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:text-quran-primary text-xs sm:text-sm w-full sm:w-auto"
            size={isMobile ? "sm" : "default"}
          >
            Back to Class
          </Button>
          <Button
            onClick={handleViewStats}
            className="bg-white text-quran-primary hover:bg-quran-primary hover:text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto mt-2 sm:mt-0"
            size={isMobile ? "sm" : "default"}
          >
            <BarChart2 className="h-3 w-3 sm:h-4 sm:w-4" />
            View Progress Stats
          </Button>
        </div>

        <div className="relative rounded-lg bg-white p-3 sm:p-4 md:p-6 shadow-md">
          <StudentInfo
            name={studentData.name}
            currentLesson={studentData.currentLesson}
            mistakesCount={mistakes.length}
          />

          <StudentActions
            studentId={studentData.id}
            classId={studentData.class_id}
            onQuranDisplayToggle={handleQuranDisplayToggle}
          />
          
          <div className="flex flex-wrap gap-2 mt-4">
            {studentData.class_id && (
              <TransferClassButton 
                studentId={studentData.id} 
                currentClassId={studentData.class_id} 
              />
            )}
          </div>
        </div>

        <QuranDisplay
          currentPage={currentPage}
          isLoading={false}
          studentId={studentData.id}
          classId={classId}
        />
      </div>
    </div>
  );
};
