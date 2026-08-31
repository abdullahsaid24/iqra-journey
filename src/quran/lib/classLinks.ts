import { supabase } from "@/quran/lib/supabase";

/**
 * A student has one row, held on the weekend side of a linked weekday/weekend
 * pair, and appears in both classes of that pair. Roster queries therefore have
 * to look at the class *and* its counterpart rather than class_id alone.
 *
 * class_links is a single hop - get_all_linked_classes does a direct lookup with
 * no recursion - so a class has at most one counterpart.
 */
export const getClassScope = async (classId: string): Promise<string[]> => {
  if (!classId) return [];

  const { data, error } = await supabase
    .from('class_links')
    .select('weekday_class_id, weekend_class_id')
    .or(`weekday_class_id.eq.${classId},weekend_class_id.eq.${classId}`)
    .maybeSingle();

  if (error) {
    console.error('Error resolving linked class:', error);
    return [classId];
  }
  if (!data) return [classId];

  const counterpart =
    data.weekday_class_id === classId ? data.weekend_class_id : data.weekday_class_id;

  return counterpart ? [classId, counterpart] : [classId];
};
