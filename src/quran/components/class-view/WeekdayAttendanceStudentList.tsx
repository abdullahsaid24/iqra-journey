
import { ScrollArea } from "@/quran/components/ui/scroll-area";
import { WeekdayAttendanceStudentRow } from "./WeekdayAttendanceStudentRow";
import { Button } from "@/quran/components/ui/button";
import { UserX } from "lucide-react";

interface Student {
  id: string;
  name: string;
  absence_level?: number;
  consecutive_absences?: number;
  attendanceStatus: string | null;
}

interface WeekdayAttendanceStudentListProps {
  students: Student[];
  classId?: string;
  onMarkPresent: (studentId: string) => void;
  onMarkAbsent: (studentId: string, name: string) => void;
  onMarkAllAbsent: () => void;
}

export function WeekdayAttendanceStudentList({
  students,
  classId,
  onMarkPresent,
  onMarkAbsent,
  onMarkAllAbsent,
}: WeekdayAttendanceStudentListProps) {
  // Sort students so that already marked ones are at the bottom
  const sortedStudents = [...(students || [])].sort((a, b) => {
    if (a.attendanceStatus === null && b.attendanceStatus !== null) return -1;
    if (a.attendanceStatus !== null && b.attendanceStatus === null) return 1;
    return 0;
  });

  const unmarkedStudents = students.filter(s => s.attendanceStatus === null);
  const hasMarkedStudents = students.some(s => s.attendanceStatus !== null);
  const showBulkButton = unmarkedStudents.length > 0 && hasMarkedStudents;

  return (
    <div className="space-y-4">
      {showBulkButton && (
        <Button
          onClick={onMarkAllAbsent}
          variant="outline"
          className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
        >
          <UserX className="h-4 w-4 mr-2" />
          Mark Absent for Rest ({unmarkedStudents.length} student{unmarkedStudents.length !== 1 ? 's' : ''})
        </Button>
      )}
      
      <ScrollArea className="h-[400px] w-full pr-4">
        <div className="space-y-4">
          {sortedStudents.map(student => (
            <WeekdayAttendanceStudentRow
              key={student.id}
              student={student}
              classId={classId}
              onMarkPresent={onMarkPresent}
              onMarkAbsent={onMarkAbsent}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
