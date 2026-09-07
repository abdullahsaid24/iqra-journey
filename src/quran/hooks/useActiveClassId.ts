import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/quran/lib/supabase";

/**
 * Which class the teacher is working in.
 *
 * A student has one row but belongs to both classes of a linked weekday/weekend
 * pair, and their lessons and homework are separate in each. Links from a class
 * roster carry ?class=<id>; when that is absent - a bookmark, a parent opening
 * their child, a direct link - fall back to the student's own class_id, which
 * sits on the weekend side of the pair.
 *
 * Returns undefined while loading so callers can hold their query rather than
 * fetching the wrong class's lessons and flashing them on screen.
 */
export const useActiveClassId = (studentId: string | undefined) => {
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get('class') || undefined;

  const { data: fallback, isLoading } = useQuery({
    queryKey: ['student-class', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from('students')
        .select('class_id')
        .eq('id', studentId)
        .maybeSingle();
      if (error) {
        console.error('Error resolving student class:', error);
        return null;
      }
      return data?.class_id ?? null;
    },
    enabled: !!studentId && !fromUrl,
  });

  if (fromUrl) return { classId: fromUrl, isLoading: false };
  return { classId: fallback ?? undefined, isLoading };
};
