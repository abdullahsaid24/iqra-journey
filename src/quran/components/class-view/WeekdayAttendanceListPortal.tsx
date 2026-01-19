
import { WeekdayAttendanceStudentList } from "./WeekdayAttendanceStudentList";
import { WeekdayAttendanceDialogHeader } from "./WeekdayAttendanceDialogHeader";

interface Student {
  id: string;
  name: string;
  absence_level?: number;
  consecutive_absences?: number;
  attendanceStatus: string | null;
}

interface Props {
  students: Student[];
  classTitle: string;
  classId?: string;
  onMarkPresent: (studentId: string) => void;
  onMarkAbsent: (studentId: string, name: string) => void;
  onMarkAllAbsent: () => void;
}

export function WeekdayAttendanceListPortal({
  students,
  classTitle,
  classId,
  onMarkPresent,
  onMarkAbsent,
  onMarkAllAbsent,
}: Props) {
  return (
    <>
      <WeekdayAttendanceDialogHeader title={classTitle} />
      <WeekdayAttendanceStudentList
        students={students || []}
        classId={classId}
        onMarkPresent={onMarkPresent}
        onMarkAbsent={onMarkAbsent}
        onMarkAllAbsent={onMarkAllAbsent}
      />
    </>
  );
}
