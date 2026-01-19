
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import type { User } from "@/quran/types/user";

export const useTeacherData = () => {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      // First check auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      // Get teacher/admin roles
      const { data: teacherRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['teacher', 'admin']);

      if (rolesError) throw rolesError;

      if (teacherRoles && teacherRoles.length > 0) {
        const response = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'listUsers'
          }
        });

        if (!response.data) {
          console.error('Failed to fetch users:', response.error);
          throw new Error('Failed to fetch users');
        }

        const users = response.data;
        const userIds = teacherRoles.map(role => role.user_id);

        return users
          .filter((user: User) => userIds.includes(user.id))
          .map((user: User) => ({
            id: user.id,
            email: user.email,
            role: teacherRoles.find(r => r.user_id === user.id)?.role,
            first_name: user.first_name,
            last_name: user.last_name
          }))
          .filter((teacher: { id: string; email: string | null }): teacher is { id: string; email: string } => 
            teacher.email != null
          );
      }

      return [];
    }
  });
};
