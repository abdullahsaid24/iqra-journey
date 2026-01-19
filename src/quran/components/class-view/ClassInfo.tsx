
import { Card } from "@/quran/components/ui/card";
import { Separator } from "@/quran/components/ui/separator";

interface ClassInfoProps {
  className: string;
  teacherIds: string[];
  isAdmin: boolean;
  teachers: any[];
  selectedStudentId: string | null;
  onStudentSelect?: (studentId: string) => void;
  onAssignTeacher?: (teacherId: string) => void;
  onRemoveTeacher?: (teacherId: string) => void;
}

export const ClassInfo = ({
  className,
}: ClassInfoProps) => {
  return (
    <Card className="bg-white/90 shadow-md border border-quran-border rounded-lg overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-quran-bg mb-2">{className}</h2>
          <Separator className="bg-quran-primary/30" />
        </div>
      </div>
    </Card>
  );
};
