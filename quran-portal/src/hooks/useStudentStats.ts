
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfMonth, endOfMonth } from "date-fns";

export const useStudentStats = (studentId: string | undefined, selectedMonth: Date = new Date()) => {
  return useQuery({
    queryKey: ['student', studentId, selectedMonth.toISOString()],
    queryFn: async () => {
      if (!studentId) return null;

      // First get student and teacher info
      const { data: studentInfo, error: studentInfoError } = await supabase
        .rpc('get_student_teacher_info', {
          student_id: studentId
        });

      if (studentInfoError) {
        console.error('Error fetching student info:', studentInfoError);
        toast.error('Failed to fetch student information');
        throw studentInfoError;
      }

      // Get student details
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          class_id,
          classes!students_class_id_fkey (
            id,
            name
          )
        `)
        .eq('id', studentId)
        .maybeSingle();
      
      if (studentError) {
        console.error('Error fetching student:', studentError);
        toast.error('Failed to fetch student data');
        throw studentError;
      }

      if (!student) {
        toast.error('Student not found');
        return null;
      }

      // Get teacher information for the student's current class (in case they were transferred)
      let teacherInfo = null;
      if (student && student.class_id) {
        const { data: classTeachers, error: teachersError } = await supabase
          .from('class_teachers')
          .select('user_id')
          .eq('class_id', student.class_id);
        
        if (!teachersError && classTeachers && classTeachers.length > 0) {
          const response = await supabase.functions.invoke('list-users');

          if (!response.error && response.data?.users) {
            const teacherData = response.data.users.find((user: any) => 
              classTeachers.some((ct: any) => ct.user_id === user.id)
            );
            
            if (teacherData) {
              teacherInfo = {
                id: teacherData.id,
                name: `${teacherData.user_metadata?.first_name || ''} ${teacherData.user_metadata?.last_name || ''}`.trim(),
                email: teacherData.email
              };
            }
          }
        }
      }

      // Get monthly progress data for the selected month
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      const { data: monthlyStats, error: statsError } = await supabase
        .from('monthly_progress')
        .select('*')
        .eq('student_id', studentId)
        .gte('month', monthStart.toISOString())
        .lte('month', monthEnd.toISOString());

      if (statsError) {
        console.error('Error fetching monthly progress:', statsError);
        toast.error('Failed to fetch student statistics');
        throw statsError;
      }

      // Get current lesson
      const { data: currentLesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .maybeSingle();

      if (lessonError) {
        console.error('Error fetching current lesson:', lessonError);
        toast.error('Failed to fetch current lesson');
        throw lessonError;
      }

      // Get ALL homework assignments without filtering by status
      const { data: homeworkAssignments, error: homeworkError } = await supabase
        .from('homework_assignments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (homeworkError) {
        console.error('Error fetching homework assignments:', homeworkError);
        toast.error('Failed to fetch homework assignments');
        throw homeworkError;
      }

      // Get current homework assignment (if exists)
      let currentHomework = null;
      let pastHomework = [];

      if (homeworkAssignments && homeworkAssignments.length > 0) {
        // Sort all assignments by date (newest first)
        const sortedAssignments = [...homeworkAssignments].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Find assignments for the current lesson
        if (currentLesson) {
          // Find the most recent assignment for the current lesson regardless of status
          const currentLessonAssignments = sortedAssignments.filter(
            hw => hw.surah === currentLesson.surah && hw.verses === currentLesson.verses
          );
          
          // Use the most recent assignment for the current lesson
          if (currentLessonAssignments.length > 0) {
            currentHomework = currentLessonAssignments[0];
          } else {
            // If no assignments for the current lesson, use the most recent assignment
            currentHomework = sortedAssignments[0];
          }
        } else {
          // If no current lesson, use the most recent assignment
          currentHomework = sortedAssignments[0];
        }

        // All other assignments are past homework
        pastHomework = sortedAssignments.filter(hw => hw.id !== currentHomework?.id);
      }

      // Calculate aggregated stats
      const aggregatedStats = monthlyStats.reduce((acc, curr) => ({
        lessons_completed: (acc.lessons_completed || 0) + (curr.lessons_passed || 0),
        lessons_failed: (acc.lessons_failed || 0) + (curr.lessons_failed || 0),
      }), {
        lessons_completed: 0,
        lessons_failed: 0,
      });

      return {
        ...student,
        teacher: teacherInfo,
        student_stats: [{
          ...aggregatedStats,
        }],
        current_assignments: {
          current_lesson: currentLesson ? {
            surah: currentLesson.surah,
            verses: currentLesson.verses,
            status: currentHomework?.status || null,
            created_at: currentHomework?.created_at || null,
            id: currentHomework?.id || null
          } : null,
          past_homework: pastHomework,
        }
      };
    },
    enabled: !!studentId,
  });
};
