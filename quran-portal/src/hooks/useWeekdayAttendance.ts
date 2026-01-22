
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Student {
  id: string;
  name: string;
  absence_level?: number;
  consecutive_absences?: number;
  attendanceStatus: string | null;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent';
  note?: string;
}

export const useWeekdayAttendance = (classId: string) => {
  const queryClient = useQueryClient();
  const [linkedWeekdayClassId, setLinkedWeekdayClassId] = useState<string | null>(null);
  
  // Query to check for linked classes
  useEffect(() => {
    const fetchLinkedClass = async () => {
      if (!classId) return;
      
      try {
        console.log("Checking for linked classes for classId:", classId);
        
        // Check if this is a weekend class with a linked weekday class
        const { data: linkedClass, error } = await supabase
          .from("class_links")
          .select("weekday_class_id, weekend_class_id")
          .or(`weekday_class_id.eq.${classId},weekend_class_id.eq.${classId}`)
          .single();
        
        console.log("Linked class data:", linkedClass, "Error:", error);
          
        if (linkedClass && linkedClass.weekend_class_id === classId) {
          // This is a weekend class, store its linked weekday class
          console.log("This is a weekend class linked to weekday class:", linkedClass.weekday_class_id);
          setLinkedWeekdayClassId(linkedClass.weekday_class_id);
        } else {
          console.log("This is not a linked class or is a weekday class itself");
          setLinkedWeekdayClassId(null);
        }
      } catch (error) {
        console.error('Error checking for linked class:', error);
        setLinkedWeekdayClassId(null);
      }
    };
    
    fetchLinkedClass();
  }, [classId]);
  
  const { data: classData, error: classError } = useQuery({
    queryKey: ['class-attendance', classId],
    queryFn: async () => {
      if (!classId) return null;

      try {
        console.log("Fetching class attendance data for:", classId);
        
        // Fetch the class details and its students with absence tracking fields
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select(`
            id,
            name,
            students!fk_students_class (
              id,
              name,
              absence_level,
              consecutive_absences
            )
          `)
          .eq('id', classId)
          .single();

        if (classError) {
          console.error('Error fetching class:', classError);
          return null;
        }

        // Get attendance records for today to mark which students are already processed
        const today = new Date().toISOString().split('T')[0];
        const { data: attendanceData } = await supabase
          .from('weekday_attendance')
          .select('student_id, status')
          .eq('class_id', classData.id)
          .eq('attendance_date', today);

        const attendanceMap = new Map();
        attendanceData?.forEach(record => {
          attendanceMap.set(record.student_id, record.status);
        });

        // Add attendance status to each student
        const studentsWithAttendance: Student[] = classData.students?.map(student => ({
          ...student,
          attendanceStatus: attendanceMap.get(student.id) || null
        })) || [];

        console.log("Class data fetched:", {
          class_id: classData.id,
          class_name: classData.name,
          students: studentsWithAttendance.length
        });

        return {
          class_id: classData.id,
          class_name: classData.name,
          students: studentsWithAttendance
        };
      } catch (err) {
        console.error('Error in class attendance query:', err);
        return null;
      }
    },
    enabled: !!classId
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ 
      studentId, 
      status, 
      note 
    }: AttendanceRecord) => {
      if (!classData?.class_id) {
        throw new Error('Class data not found');
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error('No authenticated user found');
      }

      const today = new Date().toISOString().split('T')[0];

      // Use upsert with the onConflict parameter
      const { error } = await supabase
        .from('weekday_attendance')
        .upsert({
          student_id: studentId,
          class_id: classData.class_id,
          attendance_date: today,
          status,
          note,
          created_by: session.session.user.id
        }, {
          onConflict: 'student_id,class_id,attendance_date'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-attendance', classId] });
      // Also invalidate notification presets to ensure updated absence levels are reflected
      queryClient.invalidateQueries({ queryKey: ['notification-presets'] });
    },
    onError: (error) => {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  });

  return {
    classData,
    classError,
    markAttendance: markAttendanceMutation.mutate,
    linkedWeekdayClassId
  };
};
