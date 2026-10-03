import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { schoolDateOf } from "@/quran/lib/schoolDate";

/**
 * How many weeks a student has been carrying their current lesson.
 *
 * Counted from class sessions rather than from the student's own records: a
 * week where they were absent, failed, repeated, or simply never got marked
 * writes no lesson row, but it is still a week they spent on the same lesson.
 * So we find when the lesson was first given, then count the sessions that
 * class has held since.
 *
 * The session it was assigned on does not count - the first class after it
 * reads 1, the one after that 2.
 */

const contentKey = (lesson: { surah: string | null; verses: string | null; lesson_type: string | null }) =>
  [lesson.lesson_type ?? '', lesson.surah ?? '', lesson.verses ?? ''].join('|');

export const useLessonWeeks = (studentId?: string, classId?: string) => {
  return useQuery({
    queryKey: ['lesson-weeks', studentId, classId],
    queryFn: async () => {
      if (!studentId || !classId) return null;

      // Annotated any: these chains exceed TypeScript's instantiation depth
      // against Supabase's generated types (TS2589).
      const db = supabase as any;

      const { data: lessons, error } = await db
        .from('lessons')
        .select('id, surah, verses, lesson_type, created_at, is_active')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading lesson history:', error);
        return null;
      }
      if (!lessons || lessons.length === 0) return null;

      const activeIndex = lessons.findIndex((l: any) => l.is_active);
      if (activeIndex === -1) return null;

      // Walk back over consecutive rows holding the same lesson. Repeating a
      // lesson writes a fresh row each week, so the earliest row in that run is
      // when the student was actually first given it.
      const key = contentKey(lessons[activeIndex]);
      let firstIndex = activeIndex;
      while (firstIndex > 0 && contentKey(lessons[firstIndex - 1]) === key) {
        firstIndex -= 1;
      }

      const assignedOn = schoolDateOf(lessons[firstIndex].created_at);

      // Every date this class did something. Attendance is the clearest signal
      // that a class ran, with lesson and homework activity as backup for a
      // session where nobody happened to take the register.
      const [attendance, classLessons, classHomework] = await Promise.all([
        db.from('weekday_attendance')
          .select('attendance_date')
          .eq('class_id', classId)
          .gt('attendance_date', assignedOn),
        db.from('lessons')
          .select('created_at')
          .eq('class_id', classId)
          .gt('created_at', lessons[firstIndex].created_at),
        db.from('homework_assignments')
          .select('created_at')
          .eq('class_id', classId)
          .gt('created_at', lessons[firstIndex].created_at),
      ]);

      const sessionDates = new Set<string>();
      (attendance.data ?? []).forEach((r: any) => {
        if (r.attendance_date > assignedOn) sessionDates.add(r.attendance_date);
      });
      (classLessons.data ?? []).forEach((r: any) => {
        const d = schoolDateOf(r.created_at);
        if (d > assignedOn) sessionDates.add(d);
      });
      (classHomework.data ?? []).forEach((r: any) => {
        const d = schoolDateOf(r.created_at);
        if (d > assignedOn) sessionDates.add(d);
      });

      return { weeks: sessionDates.size, assignedOn };
    },
    enabled: !!studentId && !!classId,
    staleTime: 60_000,
  });
};
