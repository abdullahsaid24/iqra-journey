import { useEffect, useState } from "react";
import { Badge } from "@/quran/components/ui/badge";
import { supabase } from "@/quran/lib/supabase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/quran/components/ui/tooltip";
interface MonthlyAbsenceBadgeProps {
  studentId: string;
  classId: string;
}
export const MonthlyAbsenceBadge = ({
  studentId,
  classId
}: MonthlyAbsenceBadgeProps) => {
  const [absenceCount, setAbsenceCount] = useState(0);
  useEffect(() => {
    const fetchMonthlyAbsences = async () => {
      try {
        // Get the first day of the current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const {
          data,
          error
        } = await supabase.from('weekday_attendance').select('status').eq('student_id', studentId).eq('class_id', classId).eq('status', 'absent').gte('attendance_date', firstDayOfMonth).lte('attendance_date', lastDayOfMonth);
        if (error) throw error;
        setAbsenceCount(data?.length || 0);
      } catch (error) {
        console.error('Error fetching monthly absences:', error);
      }
    };
    if (studentId && classId) {
      fetchMonthlyAbsences();
    }
  }, [studentId, classId]);
  if (absenceCount === 0) {
    return null;
  }
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="destructive" className="ml-2 bg-neutral-950">
            {absenceCount} {absenceCount === 1 ? 'absence' : 'absences'} this month
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-neutral-950">This student has been absent {absenceCount} {absenceCount === 1 ? 'time' : 'times'} this month</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;
};
