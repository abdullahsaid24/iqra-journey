
import { Button } from "@/quran/components/ui/button";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { cleanVerseReferences } from "@/quran/lib/utils";
import { useNavigate } from "react-router-dom";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";

interface LessonSubmitSectionProps {
  studentId: string;
  isLoading: boolean;
  startSurah: string;
  endSurah: string;
  startVerses: string;
  endVerses: string;
  updateLesson: boolean;
  requiredRepetitions?: number;
  nextWeekStartSurah: string;
  nextWeekEndSurah: string;
  nextWeekStartVerses: string;
  nextWeekEndVerses: string;
  onLessonUpdate: (lesson: { surah: string; verses: string }) => void;
  classId?: string;
  lessonType?: string;
  onDone?: () => void;
}

export const LessonSubmitSection = ({
  studentId,
  isLoading,
  startSurah,
  endSurah,
  startVerses,
  endVerses,
  updateLesson,
  requiredRepetitions = 1,
  nextWeekStartSurah,
  nextWeekEndSurah,
  nextWeekStartVerses,
  nextWeekEndVerses,
  onLessonUpdate,
  classId,
  lessonType = 'current_lesson',
  onDone
}: LessonSubmitSectionProps) => {
  const navigate = useNavigate();
  
  /**
   * Save the work the student is now on, and tell the parents.
   *
   * markPassed true is the normal end of a recitation: the lesson is recorded
   * as passed, and the pass message goes out - which already names the new
   * lesson as well as the pass.
   *
   * markPassed false is for setting the homework on its own - giving them next
   * week's portion, or correcting what was entered, without having heard them
   * read. The parents still get a message, but the homework one rather than a
   * pass or a fail, and nothing is credited as a pass.
   */
  const submitLesson = async ({ markPassed }: { markPassed: boolean }) => {
    if (!studentId) {
      toast.error("No student selected");
      return;
    }

    if (!startSurah || !startVerses || !endSurah || !endVerses) {
      toast.error("Please select both start and end lessons");
      return;
    }

    let surahRange = '';
    let verses = '';
    let nextWeekSurahRange = '';
    let nextWeekVersesRange = '';

    if (lessonType === 'ahsanul_qawaid_book_1') {
      // For Ahsanul Qawaid lessons, format as "Lesson X" or "Lesson X-Y"
      surahRange = startSurah === endSurah ? `Lesson ${startSurah}` : `Lesson ${startSurah}-${endSurah}`;
      verses = startSurah === endSurah ? startSurah : `${startSurah}-${endSurah}`;
      
      if (updateLesson) {
        if (!nextWeekStartSurah || !nextWeekStartVerses || !nextWeekEndSurah || !nextWeekEndVerses) {
          toast.error("Please select both start and end lessons for next week");
          return;
        }
        nextWeekSurahRange = nextWeekStartSurah === nextWeekEndSurah ? `Lesson ${nextWeekStartSurah}` : `Lesson ${nextWeekStartSurah}-${nextWeekEndSurah}`;
        nextWeekVersesRange = nextWeekStartSurah === nextWeekEndSurah ? nextWeekStartSurah : `${nextWeekStartSurah}-${nextWeekEndSurah}`;
      }
    } else if (lessonType === 'noor_al_bayan') {
      // For Noor Al Bayan lessons, format as "Page X" or "Page X-Y"
      surahRange = startSurah === endSurah ? `Page ${startSurah}` : `Page ${startSurah}-${endSurah}`;
      verses = startSurah === endSurah ? startSurah : `${startSurah}-${endSurah}`;
      
      if (updateLesson) {
        if (!nextWeekStartSurah || !nextWeekStartVerses || !nextWeekEndSurah || !nextWeekEndVerses) {
          toast.error("Please select both start and end pages for next week");
          return;
        }
        nextWeekSurahRange = nextWeekStartSurah === nextWeekEndSurah ? `Page ${nextWeekStartSurah}` : `Page ${nextWeekStartSurah}-${nextWeekEndSurah}`;
        nextWeekVersesRange = nextWeekStartSurah === nextWeekEndSurah ? nextWeekStartSurah : `${nextWeekStartSurah}-${nextWeekEndSurah}`;
      }
    } else if (lessonType === 'full_quran') {
      // For Full Quran lessons, format as "Page X" or "Page X-Y"
      surahRange = startSurah === endSurah ? `Page ${startSurah}` : `Page ${startSurah}-${endSurah}`;
      verses = startSurah === endSurah ? startSurah : `${startSurah}-${endSurah}`;
      
      if (updateLesson) {
        if (!nextWeekStartSurah || !nextWeekStartVerses || !nextWeekEndSurah || !nextWeekEndVerses) {
          toast.error("Please select both start and end pages for next week");
          return;
        }
        nextWeekSurahRange = nextWeekStartSurah === nextWeekEndSurah ? `Page ${nextWeekStartSurah}` : `Page ${nextWeekStartSurah}-${nextWeekEndSurah}`;
        nextWeekVersesRange = nextWeekStartSurah === nextWeekEndSurah ? nextWeekStartSurah : `${nextWeekStartSurah}-${nextWeekEndSurah}`;
      }
    } else {
      // Original logic for Quran lessons
      surahRange = startSurah === endSurah ? startSurah : `${startSurah}-${endSurah}`;
      
      // Clean verse numbers to remove any prefixes and just keep numbers
      const startVerseClean = startVerses.replace(/[^0-9]/g, '');
      const endVerseClean = endVerses.replace(/[^0-9]/g, '');
      verses = `${startVerseClean}-${endVerseClean}`;
      
      if (updateLesson) {
        if (!nextWeekStartSurah || !nextWeekStartVerses || !nextWeekEndSurah || !nextWeekEndVerses) {
          toast.error("Please select both start and end lessons for next week");
          return;
        }

        nextWeekSurahRange = nextWeekStartSurah === nextWeekEndSurah ? nextWeekStartSurah : `${nextWeekStartSurah}-${nextWeekEndSurah}`;
        
        // Clean next week verse numbers too
        const nextWeekStartVerseClean = nextWeekStartVerses.replace(/[^0-9]/g, '');
        const nextWeekEndVerseClean = nextWeekEndVerses.replace(/[^0-9]/g, '');
        nextWeekVersesRange = `${nextWeekStartVerseClean}-${nextWeekEndVerseClean}`;
      }
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Your session has expired. Please log in again.");
      return;
    }

    const toastId = toast.loading(
      markPassed
        ? "Updating lesson and sending notification..."
        : "Updating homework and sending notification..."
    );

    try {
      // The assignment row is what the message is built from - send-sms reads
      // its surah and verses to fill {{surah}} and {{verses}} - so it is always
      // written, and only its status differs.
      //
      // 'passed' is what records the pass: it moves the student to Completed,
      // counts towards monthly_progress, increments total_verses_read and
      // resets failure_level. 'pending' means assigned but not yet assessed,
      // which is exactly what updating homework is, and leaves all of that
      // alone - update_lesson_failure_level only acts on 'passed' and 'failed'.
      //
      // type stays 'lesson'. A check constraint, homework_assignments_type_check,
      // rejects anything else; every row in the table is type 'lesson'.
      const { data: homework, error: homeworkError } = await supabase
        .from("homework_assignments")
        .insert({
          student_id: studentId,
          class_id: classId,
          surah: surahRange,
          verses: verses,
          status: markPassed ? 'passed' : 'pending',
          assigned_by: session.user.id,
          type: 'lesson'
        })
        .select()
        .single();

      if (homeworkError) throw homeworkError;

      const { error: lessonError } = await supabase.from("lessons").insert({
        student_id: studentId,
        class_id: classId,
        surah: surahRange,
        verses: verses,
        lesson_type: lessonType,
        required_repetitions: requiredRepetitions
      }).select().single();

      if (lessonError) throw lessonError;

      if (updateLesson) {
        const { error: nextLessonError } = await supabase.from("lessons").insert({
          student_id: studentId,
          class_id: classId,
          surah: nextWeekSurahRange,
          verses: nextWeekVersesRange,
          lesson_type: lessonType,
          required_repetitions: 1
        });

        if (nextLessonError) throw nextLessonError;
      }

      try {
        // Both paths message the parents; the flags choose which template.
        // is_passing picks lesson_pass - "has passed their lesson today! Their
        // new lesson is ..." - while is_homework picks homework_assigned -
        // "New homework has been assigned ... Please practice ...". Neither is
        // hardcoded here, so the wording stays editable per class in Settings.
        const response = await supabase.functions.invoke('send-sms', {
          body: {
            student_id: studentId,
            lesson_id: homework?.id,
            is_passing: markPassed,
            is_homework: !markPassed,
          }
        });

        if (response.error) {
          console.error("SMS notification error:", response.error);
          toast.warning("Lesson updated but notification failed");
        } else {
          if (response.data?.sent > 0) {
            toast.success(`Notifications sent to ${response.data.sent} phone number${response.data.sent > 1 ? "s" : ""}`);
          } else {
            toast.warning("Lesson updated but no notifications were sent");
          }
        }

        // Always call onDone to return to class list immediately
        onDone?.();
      } catch (smsError) {
        console.error("Error sending notification:", smsError);
        toast.warning("Lesson updated but notification failed");

        // Still call onDone even if SMS fails
        onDone?.();
      }

      onLessonUpdate({
        surah: surahRange,
        verses: verses,
      });

      toast.dismiss(toastId);
      toast.success(
        markPassed
          ? "Lesson updated successfully"
          : "Homework updated. No pass or fail was recorded."
      );
    } catch (error: any) {
      // The loading toast was never dismissed here, so a failure left it
      // spinning forever and the real reason only reached the console.
      toast.dismiss(toastId);
      console.error("Error updating lesson:", error);
      toast.error(
        `Failed to update lesson: ${error?.message ?? "unknown error"}`,
        { duration: 10000 }
      );
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={() => submitLesson({ markPassed: true })}
        className="w-full bg-quran-primary text-white hover:bg-quran-primary/90"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Passed — Update Lesson & Send Notification"}
      </Button>

      {/*
        For setting the homework on its own. Kept as a separate button rather
        than a checkbox on the one above, so the teacher cannot leave a setting
        switched on by accident and silently stop a week of pass messages.
      */}
      <Button
        onClick={() => submitLesson({ markPassed: false })}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        Update Homework Only — no pass or fail
      </Button>
      <p className="text-xs text-slate-500 text-center">
        Sends the homework message instead of a pass or fail, and records no result.
      </p>
    </div>
  );
};
