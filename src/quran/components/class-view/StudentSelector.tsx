import { Button } from "@/quran/components/ui/button";
import { ArrowLeft } from "lucide-react";
interface StudentSelectorProps {
  showBackButton: boolean;
  onBackClick: () => void;
  selectedStudentName?: string;
}
export const StudentSelector = ({
  showBackButton,
  onBackClick,
  selectedStudentName = ""
}: StudentSelectorProps) => {
  if (!showBackButton) return null;
  return <div className="flex items-center justify-between mb-4">
      <Button variant="outline" onClick={onBackClick} className="flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Class</span>
      </Button>
      
      {selectedStudentName && <div className="text-white font-medium text-lg flex items-center gap-2">
          <span>Student:</span>
          <span className="font-bold">{selectedStudentName}</span>
          
        </div>}
    </div>;
};
