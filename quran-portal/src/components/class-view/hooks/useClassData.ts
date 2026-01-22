
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useClassData = (classId: string | undefined) => {
  return useQuery({
    queryKey: ['class', classId],
    queryFn: async () => {
      if (!classId) throw new Error('Class ID is required');

      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          students!fk_students_class (
            id,
            name,
            first_name,
            last_name
          ),
          class_teachers (
            user_id
          )
        `)
        .eq('id', classId)
        .maybeSingle();

      if (classError) throw classError;
      if (!classInfo) throw new Error('Class not found');

      return {
        ...classInfo,
        teacherIds: classInfo?.class_teachers?.map(ct => ct.user_id) || []
      };
    },
    retry: false
  });
};
