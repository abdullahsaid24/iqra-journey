
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";

export const useStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} students`);
      return data || [];
    },
    staleTime: 0
  });
};
