import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { MushafPractice } from "@/quran/components/quran/MushafPractice";
import { Button } from "@/quran/components/ui/button";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { useUserRole } from "@/quran/hooks/useUserRole";
import { formatLessonDisplay } from "@/quran/lib/utils";

interface PracticeLesson {
  id: string;
  surah: string;
  verses: string;
  class_id: string | null;
  required_repetitions: number | null;
  listen_count: number | null;
  className: string;
}

const LessonPractice = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { userRole } = useUserRole();
  const [chosenLessonId, setChosenLessonId] = useState<string | null>(null);

  /**
   * The lessons this student is currently on.
   *
   * Previously this took the most recently created lesson with no filter at
   * all, which is wrong twice over: a finished lesson still counts as "most
   * recent", and a student enrolled in both a weekday and a weekend class has
   * one active lesson in each. Taking whichever row was written last handed
   * them the other class's lesson. Only active lessons count, and when there is
   * more than one the student picks.
   */
  const { data: lessons, isLoading } = useQuery({
    queryKey: ["practice-lessons", studentId],
    queryFn: async (): Promise<PracticeLesson[]> => {
      if (!studentId) return [];

      // Annotated any: these chains exceed TypeScript's instantiation depth
      // against Supabase's generated types (TS2589), and the generated types
      // predate class_id / listen_count.
      const db = supabase as any;

      const { data, error } = await db
        .from("lessons")
        .select("id, surah, verses, class_id, required_repetitions, listen_count, created_at")
        .eq("student_id", studentId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data?.length) return [];

      const classIds = [...new Set(data.map((l: any) => l.class_id).filter(Boolean))];
      const names = new Map<string, string>();
      if (classIds.length) {
        const { data: classes } = await db.from("classes").select("id, name").in("id", classIds);
        (classes ?? []).forEach((c: any) => names.set(c.id, c.name));
      }

      return data.map((l: any) => ({
        id: l.id,
        surah: l.surah,
        verses: l.verses,
        class_id: l.class_id,
        required_repetitions: l.required_repetitions,
        listen_count: l.listen_count,
        className: l.class_id ? (names.get(l.class_id) ?? "Class") : "Class",
      }));
    },
    enabled: !!studentId,
  });

  const goBack = () => {
    if (userRole === "parent") {
      navigate("/quran/parent-dashboard");
    } else {
      navigate(`/quran/student/${studentId}/stats`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-quran-primary" />
      </div>
    );
  }

  const currentLesson =
    lessons?.find((l) => l.id === chosenLessonId) ?? lessons?.[0] ?? null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <Button variant="ghost" size="icon" onClick={goBack} className="hover:bg-slate-200 shrink-0">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Lesson Practice</h1>
        </div>

        {/* A student in two classes has a lesson in each, and they differ. */}
        {lessons && lessons.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {lessons.map((lesson) => (
              <Button
                key={lesson.id}
                variant={currentLesson?.id === lesson.id ? "default" : "outline"}
                size="sm"
                onClick={() => setChosenLessonId(lesson.id)}
                className={currentLesson?.id === lesson.id ? "bg-quran-primary text-white" : ""}
              >
                {lesson.className}
              </Button>
            ))}
          </div>
        )}

        {currentLesson ? (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-quran-primary/10 rounded-full flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-quran-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Current Lesson</h2>
                <p className="text-slate-600 font-medium">
                  {formatLessonDisplay(currentLesson.surah, currentLesson.verses)}
                </p>
                {lessons && lessons.length > 1 && (
                  <p className="text-sm text-slate-500">{currentLesson.className}</p>
                )}
              </div>
            </div>

            {(currentLesson.required_repetitions ?? 0) > 0 && (
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">Repetitions Goal</p>
                <p className="text-lg font-bold text-quran-primary">
                  {currentLesson.listen_count ?? 0} / {currentLesson.required_repetitions}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No active lesson</h2>
            <p className="text-slate-500">You don't have a current lesson assigned.</p>
          </div>
        )}

        <MushafPractice
          key={currentLesson?.id ?? "none"}
          lessonId={currentLesson?.id}
          studentId={studentId}
          initialSurah={currentLesson?.surah}
          initialVerses={currentLesson?.verses}
          requiredRepetitions={currentLesson?.required_repetitions ?? undefined}
        />
      </div>
    </div>
  );
};

export default LessonPractice;
