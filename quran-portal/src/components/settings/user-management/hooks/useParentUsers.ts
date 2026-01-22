
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useParentUsers = () => {
  return useQuery({
    queryKey: ['parent-users'],
    queryFn: async () => {
      try {
        console.log('Fetching parent users...');
        const { data, error } = await supabase.functions.invoke('get-parent-users');
        
        if (error) {
          console.error('Failed to fetch parent users:', error);
          throw error;
        }

        console.log(`Successfully fetched ${data?.length || 0} parent users`);
        return data || [];
      } catch (error) {
        console.error("Error fetching parent users:", error);
        throw error;
      }
    },
    staleTime: 60000,
  });
};
