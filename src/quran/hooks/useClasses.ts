
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { ClassWithStudents } from "@/quran/types/dashboard";

export const useClasses = (userRole: string | null) => {
  return useQuery({
    queryKey: ['classes', userRole],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      let query = supabase
        .from('classes')
        .select(`
          id,
          name,
          students!fk_students_class (
            id,
            name
          )
        `);

      if (userRole === 'teacher') {
        const { data: teacherClasses, error: teacherError } = await supabase
          .from('class_teachers')
          .select('class_id')
          .eq('user_id', session.user.id);

        if (teacherError) {
          console.error('Error fetching teacher classes:', teacherError);
          return [];
        }

        const classIds = teacherClasses.map(tc => tc.class_id);
        if (classIds.length === 0) return [];

        query = query.in('id', classIds);
      }

      const { data: classes, error: classesError } = await query;
      
      if (classesError) {
        console.error('Error fetching classes:', classesError);
        return [];
      }

      // For each class, fetch its teachers
      const classesWithTeachers = await Promise.all(classes.map(async (classItem) => {
        const { data: teacherLinks, error: teachersError } = await supabase
          .from('class_teachers')
          .select('user_id')
          .eq('class_id', classItem.id);

        if (teachersError) {
          console.error('Error fetching teachers:', teachersError);
          return classItem;
        }

        if (teacherLinks && teacherLinks.length > 0) {
          const response = await supabase.functions.invoke('manage-users', {
            body: {
              action: 'listUsers'
            }
          });

          if (!response.data) {
            console.error('Failed to fetch users:', response.error);
            return classItem;
          }

          const users = response.data;
          const teachers = teacherLinks
            .map(link => {
              const user = users.find((u: any) => u.id === link.user_id);
              return user ? { user_id: user.id, email: user.email } : null;
            })
            .filter(Boolean);

          return {
            ...classItem,
            teachers
          };
        }

        return classItem;
      }));

      return classesWithTeachers;
    }
  });
};
