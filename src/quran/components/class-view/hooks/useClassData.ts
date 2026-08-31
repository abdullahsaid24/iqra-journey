
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { getClassScope } from "@/quran/lib/classLinks";

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
          class_teachers (
            user_id
          )
        `)
        .eq('id', classId)
        .maybeSingle();

      if (classError) throw classError;
      if (!classInfo) throw new Error('Class not found');

      // Students are held on the weekend side of a linked pair and belong to
      // both classes, so the roster is the class plus its counterpart rather
      // than an embedded select filtered on class_id.
      const scope = await getClassScope(classId);

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, first_name, last_name')
        .in('class_id', scope)
        .order('name');

      if (studentsError) throw studentsError;

      return {
        ...classInfo,
        students: students || [],
        teacherIds: classInfo?.class_teachers?.map(ct => ct.user_id) || []
      };
    },
    retry: false
  });
};
