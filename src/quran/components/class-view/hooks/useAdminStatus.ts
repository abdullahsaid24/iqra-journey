
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";

export const useAdminStatus = () => {
  return useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .in('role', ['admin', 'teacher'])
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin/teacher role:', error);
        return false;
      }
      
      return !!data;
    }
  });
};
