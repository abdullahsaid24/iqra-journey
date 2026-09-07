
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";

// A student attending both a weekday and weekend class has a separate current
// lesson in each, so the class has to be part of the lookup and the cache key.
export function useCurrentLesson(studentId: string | undefined, classId?: string) {
  return useQuery({
    queryKey: ['current-lesson', studentId, classId],
    queryFn: async () => {
      if (!studentId) return null;

      // Annotated any: chaining a conditional filter onto Supabase's typed
      // builder exceeds TypeScript's instantiation depth here (TS2589).
      const base: any = supabase
        .from("lessons")
        .select("*")
        .eq("student_id", studentId)
        .eq("is_active", true);

      const { data, error } = await (
        classId ? base.eq("class_id", classId) : base
      )
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
