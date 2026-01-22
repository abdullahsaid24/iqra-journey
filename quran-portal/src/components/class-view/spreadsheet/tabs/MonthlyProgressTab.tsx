
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile"; 
import type { StudentWithProgress, MonthlyProgress } from "@/types/student";

const defaultProgress: MonthlyProgress = {
  goal_current_lesson: null,
  lessons_passed: 0,
  lessons_failed: 0,
  review_near_passed: 0,
  review_near_failed: 0,
  review_far_passed: 0,
  review_far_failed: 0,
  active_days: 0
};

interface MonthlyProgressTabProps {
  classId?: string;
  onStudentSelect: (studentId: string) => void;
}

export const MonthlyProgressTab = ({ classId, onStudentSelect }: MonthlyProgressTabProps) => {
  const isMobile = useIsMobile();
  
  const { data: students, isLoading } = useQuery<StudentWithProgress[]>({
    queryKey: ['monthly-progress', classId],
    queryFn: async () => {
      const query = supabase
        .from('students')
        .select(`
          *,
          monthly_progress (
            lessons_passed,
            lessons_failed,
            review_near_passed,
            review_near_failed,
            review_far_passed,
            review_far_failed,
            goal_current_lesson,
            active_days
          )
        `)
        .order('name');

      if (classId) {
        query.eq('class_id', classId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as StudentWithProgress[];
    },
  });

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="rounded-md border mt-4 overflow-x-auto">
      <Table className={isMobile ? "min-w-[500px]" : "min-w-full"}>
        <TableHeader>
          <TableRow className="bg-quran-bg text-white">
            <TableHead className="min-w-[100px] text-white">Student</TableHead>
            <TableHead className="min-w-[80px] text-white">Lessons</TableHead>
            <TableHead className="min-w-[80px] text-white">Reviews</TableHead>
            {!isMobile && <TableHead className="min-w-[80px] text-white">Pass Rate</TableHead>}
            <TableHead className="min-w-[80px] text-white">Days Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(students || [])?.map((student, index) => {
            const progress = student.monthly_progress?.[0] || defaultProgress;
            const totalLessons = progress.lessons_passed + progress.lessons_failed;
            const passRate = totalLessons > 0 
              ? ((progress.lessons_passed / totalLessons) * 100).toFixed(1)
              : '0.0';
            
            const totalReviews = 
              progress.review_near_passed + 
              progress.review_far_passed;
              
            const rowBgColor = index % 2 === 0 
              ? "bg-quran-bg/5 hover:bg-quran-bg/15" 
              : "bg-quran-bg/10 hover:bg-quran-bg/20";

            return (
              <TableRow key={student.id} className={rowBgColor}>
                <TableCell 
                  className="font-medium whitespace-nowrap cursor-pointer hover:text-quran-primary hover:underline"
                  onClick={() => onStudentSelect(student.id)}
                >
                  {student.name}
                </TableCell>
                <TableCell className="whitespace-nowrap">{progress.lessons_passed}</TableCell>
                <TableCell className="whitespace-nowrap">{totalReviews}</TableCell>
                {!isMobile && <TableCell className="whitespace-nowrap">{passRate}%</TableCell>}
                <TableCell className="whitespace-nowrap">{progress.active_days} days</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
