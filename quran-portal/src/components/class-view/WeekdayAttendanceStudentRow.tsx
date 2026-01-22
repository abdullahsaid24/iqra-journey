import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MonthlyAbsenceBadge } from "@/components/attendance/MonthlyAbsenceBadge";
interface StudentRowProps {
  student: {
    id: string;
    name: string;
    absence_level?: number;
    consecutive_absences?: number;
    attendanceStatus: string | null;
  };
  onMarkPresent: (studentId: string) => void;
  onMarkAbsent: (studentId: string, name: string) => void;
  classId?: string;
}
export function WeekdayAttendanceStudentRow({
  student,
  onMarkPresent,
  onMarkAbsent,
  classId
}: StudentRowProps) {
  const absenceLevel = student.absence_level || 1;
  const consecutiveAbsences = student.consecutive_absences || 0;
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
      student.attendanceStatus 
        ? 'bg-gray-50 border-gray-200 opacity-75' 
        : 'bg-white border-gray-200 hover:shadow-sm'
    }`}>
      <div className="flex items-center gap-3">
        <span className="font-medium text-gray-900">
          {student.name}
        </span>
        {classId && (
          <MonthlyAbsenceBadge studentId={student.id} classId={classId} />
        )}
      </div>
      
      {!student.attendanceStatus ? (
        <div className="flex items-center gap-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-green-50 hover:bg-green-100 text-green-800 border-green-300 hover:border-green-400 font-medium"
            onClick={() => onMarkPresent(student.id)}
          >
            Present
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                absenceLevel === 3 ? 'destructive' : 
                absenceLevel === 2 ? 'outline' : 
                'secondary'
              } 
              className={`text-xs px-2 py-1 font-medium ${
                absenceLevel === 3 
                  ? 'bg-red-100 text-red-800 border-red-300' 
                  : absenceLevel === 2 
                    ? 'bg-amber-50 text-amber-800 border-amber-300' 
                    : 'bg-gray-100 text-gray-800 border-gray-300'
              }`}
            >
              Level {absenceLevel}
            </Badge>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-red-50 hover:bg-red-100 text-red-800 border-red-300 hover:border-red-400 font-medium"
              onClick={() => onMarkAbsent(student.id, student.name)}
            >
              Absent
            </Button>
          </div>
        </div>
      ) : (
        <Badge 
          className={`font-medium px-3 py-1 ${
            student.attendanceStatus === 'present' 
              ? 'bg-green-100 text-green-800 border-green-300' 
              : 'bg-red-100 text-red-800 border-red-300'
          }`}
        >
          {student.attendanceStatus === 'present' ? 'Present' : 'Absent'}
        </Badge>
      )}
    </div>
  );
}