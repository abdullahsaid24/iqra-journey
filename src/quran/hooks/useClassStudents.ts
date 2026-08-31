
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { getClassScope } from "@/quran/lib/classLinks";
import { toast } from "sonner";

export const useClassStudents = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      if (!classId) return null;

      // Each child has a single row parked on the weekend side of the pair, so
      // the roster is the class plus its linked counterpart.
      const scope = await getClassScope(classId);

      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_stats(*)
        `)
        .in('class_id', scope);

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
