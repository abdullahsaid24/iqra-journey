
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
          name
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

      // Each child has one row, parked on the weekend side of a linked pair, and
      // belongs to both classes in that pair. Resolve the roster here rather than
      // with an embedded select on class_id, which would leave weekday classes
      // looking empty.
      const [{ data: links }, { data: allStudents }] = await Promise.all([
        supabase.from('class_links').select('weekday_class_id, weekend_class_id'),
        supabase.from('students').select('id, name, class_id').not('class_id', 'is', null),
      ]);

      const counterpartOf = new Map<string, string>();
      (links || []).forEach(l => {
        if (l.weekday_class_id && l.weekend_class_id) {
          counterpartOf.set(l.weekday_class_id, l.weekend_class_id);
          counterpartOf.set(l.weekend_class_id, l.weekday_class_id);
        }
      });

      const studentsByClass = new Map<string, { id: string; name: string }[]>();
      (allStudents || []).forEach(s => {
        const bucket = studentsByClass.get(s.class_id!) || [];
        bucket.push({ id: s.id, name: s.name });
        studentsByClass.set(s.class_id!, bucket);
      });

      const rosterFor = (classId: string) => {
        const own = studentsByClass.get(classId) || [];
        const linked = counterpartOf.get(classId);
        return linked ? [...own, ...(studentsByClass.get(linked) || [])] : own;
      };

      // For each class, fetch its teachers
      const classesWithTeachers = await Promise.all(classes.map(async (row) => {
        const classItem: ClassWithStudents = {
          ...row,
          students: rosterFor(row.id)
        } as ClassWithStudents;
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
