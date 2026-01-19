
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";

export const useClassStudents = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      if (!classId) return null;

      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_stats(*)
        `)
        .eq('class_id', classId);
      
      if (error) {
        console.error('Error fetching class students:', error);
        toast.error('Failed to fetch class students');
        throw error;
      }
      return data;
    },
    enabled: !!classId,
  });
};
