
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'listUsers'
          }
        });
        
        if (response.error) {
          throw response.error;
        }
        
        return response.data || [];
      } catch (error) {
        console.error('Error in user fetch function:', error);
        throw error;
      }
    },
    staleTime: 0,
    gcTime: 300000,
    retry: 2
  });
};
