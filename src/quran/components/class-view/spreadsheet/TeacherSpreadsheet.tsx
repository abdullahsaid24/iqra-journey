
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/quran/components/ui/tabs";
import { CurrentStatusTab } from "./tabs/CurrentStatusTab";
import { MonthlyProgressTab } from "./tabs/MonthlyProgressTab";
import { Card } from "@/quran/components/ui/card";
import { useIsMobile } from "@/quran/hooks/use-mobile";

interface TeacherSpreadsheetProps {
  onStudentSelect: (studentId: string) => void;
}

export const TeacherSpreadsheet = ({ onStudentSelect }: TeacherSpreadsheetProps) => {
  const { classId } = useParams();
  const isMobile = useIsMobile();

  const handleStudentSelect = (studentId: string) => {
    // Scroll to top of the page when a student is selected
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onStudentSelect(studentId);
  };

  return (
    <Card className="p-1 sm:p-2 md:p-4 w-full overflow-hidden">
      <Tabs defaultValue="current-status" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-auto">
          <TabsTrigger value="current-status" className="text-[10px] xs:text-[11px] sm:text-sm py-1 sm:py-2 px-1 sm:px-3">
            <span className={isMobile ? "text-[10px]" : "text-sm"}>Current Status</span>
          </TabsTrigger>
          <TabsTrigger value="monthly-progress" className="text-[10px] xs:text-[11px] sm:text-sm py-1 sm:py-2 px-1 sm:px-3">
            <span className={isMobile ? "text-[10px]" : "text-sm"}>Monthly Progress</span>
          </TabsTrigger>
        </TabsList>
        <div className="mt-1 sm:mt-2 md:mt-4 overflow-x-auto">
          <TabsContent value="current-status">
            <CurrentStatusTab classId={classId} onStudentSelect={handleStudentSelect} />
          </TabsContent>
          <TabsContent value="monthly-progress">
            <MonthlyProgressTab classId={classId} onStudentSelect={handleStudentSelect} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};
