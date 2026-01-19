
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
  
  const handleUpdateLesson = async () => {
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

    const toastId = toast.loading("Updating lesson and sending notification...");

    try {
      const { data: homework, error: homeworkError } = await supabase.from("homework_assignments").insert({
        student_id: studentId,
        surah: surahRange,
        verses: verses,
        status: 'passed',
        assigned_by: session.user.id,
        type: 'lesson'
      }).select().single();

      if (homeworkError) throw homeworkError;

      const { error: lessonError } = await supabase.from("lessons").insert({
        student_id: studentId,
        surah: surahRange,
        verses: verses,
        lesson_type: lessonType
      });

      if (lessonError) throw lessonError;

      if (updateLesson) {
        const { error: nextLessonError } = await supabase.from("lessons").insert({
          student_id: studentId,
          surah: nextWeekSurahRange,
          verses: nextWeekVersesRange,
          lesson_type: lessonType
        });

        if (nextLessonError) throw nextLessonError;
      }

      try {
        const response = await supabase.functions.invoke('send-sms', {
          body: {
            student_id: studentId,
            lesson_id: homework?.id,
            is_passing: true,
            is_homework: false,
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
      toast.success("Lesson updated successfully");
    } catch (error: any) {
      console.error("Error updating lesson:", error);
      toast.error("Failed to update lesson");
    }
  };

  return (
    <Button 
      onClick={handleUpdateLesson}
      className="w-full bg-quran-primary text-white hover:bg-quran-primary/90"
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "Update Lesson & Send Notification"}
    </Button>
  );
};
