import { Button } from "@/components/ui/button";
import { Book, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TransferClassButton } from "./TransferClassButton";

interface StudentActionsProps {
  studentId: string;
  classId?: string;
  onQuranDisplayToggle: () => void;
}

export const StudentActions = ({ studentId, classId, onQuranDisplayToggle }: StudentActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-2">
      {classId && <TransferClassButton studentId={studentId} currentClassId={classId} />}
      <Button
        variant="outline"
        className="bg-white text-quran-bg hover:bg-gray-100"
        onClick={onQuranDisplayToggle}
      >
        <Book className="mr-2 h-4 w-4" />
        Go to Lesson
      </Button>
      <Button
        variant="outline"
        className="bg-white text-quran-bg hover:bg-gray-100"
        onClick={() => navigate(`/student/${studentId}/stats`)}
      >
        <BarChart2 className="mr-2 h-4 w-4" />
        Stats Report
      </Button>
    </div>
  );
};
