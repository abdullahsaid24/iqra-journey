
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";

export function useCurrentLesson(studentId: string | undefined) {
  return useQuery({
    queryKey: ['current-lesson', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("student_id", studentId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      // If no lesson found, return default Al-Fatihah lesson
      if (!data || data.length === 0) {
        return { surah: "Al-Fatihah", verses: "1-7" };
      }
      
      return { surah: data[0].surah, verses: data[0].verses };
    },
    enabled: !!studentId
  });
}
