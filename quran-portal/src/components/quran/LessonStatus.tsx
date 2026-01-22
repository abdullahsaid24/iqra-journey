
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import { NotificationPresetSelect } from "./NotificationPresetSelect";
import { useQueryClient } from "@tanstack/react-query";
import { formatLessonDisplay } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface LessonStatusProps {
  studentId: string;
  currentLesson: { surah: string; verses: string } | null;
  onStatusUpdate: (lesson: { surah: string; verses: string }) => void;
  studentName?: string;
  classId?: string;
  onDone?: () => void;
}

export const LessonStatus = ({ studentId, currentLesson, onStatusUpdate, studentName, classId, onDone }: LessonStatusProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [presetDialog, setPresetDialog] = useState<null | "failed" | "pending" | "repeat">(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLessonStatus = async (
    status: 'failed' | 'pending' | 'passed' | 'repeat', 
    customMessage?: string,
    newLesson?: { surah: string; verses: string }
  ) => {
    if (!studentId) {
      toast.error("No student selected");
      return;
    }

    if (!currentLesson) {
      toast.error("No active lesson to mark");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to update lesson status");
        return;
      }

      const toastId = toast.loading(`Marking lesson as ${status === 'pending' ? 'absent' : status}...`);

      const { data: homework, error } = await supabase.from("homework_assignments").insert({
        student_id: studentId,
        surah: currentLesson.surah,
        verses: currentLesson.verses,
        status: status === 'repeat' ? 'pending' : status,
        assigned_by: user.id,
        type: 'lesson'
      }).select().single();

      if (error) throw error;

      if (newLesson) {
        const { error: lessonError } = await supabase.from("lessons").insert({
          student_id: studentId,
          surah: newLesson.surah,
          verses: newLesson.verses,
        });

        if (lessonError) throw lessonError;
      }

      let finalMessage = customMessage;
      
      if (status === 'passed') {
        const formattedLesson = formatLessonDisplay(currentLesson.surah, currentLesson.verses);
        const passMessage = `{{student_name}} has passed their lesson on ${formattedLesson}`;
        finalMessage = passMessage;
      } else if (status === 'repeat') {
        const formattedLesson = formatLessonDisplay(currentLesson.surah, currentLesson.verses);
        finalMessage = customMessage?.replace('{{lesson}}', formattedLesson) || `{{student_name}} is repeating their lesson on ${formattedLesson}`;
      }

      if (newLesson && status !== 'passed') {
        const nextLessonDisplay = formatLessonDisplay(newLesson.surah, newLesson.verses);
        const nextWeekSuffix = `\n\nNext week's lesson: ${nextLessonDisplay}`;
        finalMessage = customMessage ? `${customMessage}${nextWeekSuffix}` : nextWeekSuffix;
      }

      if (finalMessage) {
        console.log("Processing message before sending:", finalMessage);
        
        // Replace placeholder variables in the message
        let processedMessage = finalMessage;
        
        // Replace student name placeholder
        if (studentName) {
          processedMessage = processedMessage.replace(/{{student_name}}/g, studentName);
        }
        
        // Replace surah and verses placeholders with actual values
        if (currentLesson) {
          processedMessage = processedMessage.replace(/{{surah}}/g, currentLesson.surah);
          processedMessage = processedMessage.replace(/{{verses}}/g, currentLesson.verses);
        }
        
        // Ensure phone number is properly formatted
        processedMessage = processedMessage.replace(/\(?(\d{3})\)?[-\s]?(\d{3})[-\s]?(\d{4})/, '(780) $2-$3');
        processedMessage = processedMessage.replace(/990-7823/, '(780) 990-7823');
        processedMessage = processedMessage.replace(/780[-\s]?990[-\s]?7823/, '(780) 990-7823');
        processedMessage = processedMessage.replace(/(?:\(780\)\s*){2,}/g, '(780) ');
        
        finalMessage = processedMessage.trim();
        console.log("Processed message after placeholder substitution:", finalMessage);
      }

      try {
        console.log("Sending SMS with message:", finalMessage);
        const response = await supabase.functions.invoke('send-sms', {
          body: {
            student_id: studentId,
            lesson_id: homework?.id,
            is_passing: status === 'passed',
            is_homework: false,
            debug_mode: true,
            sms_message: finalMessage
          }
        });

        if (response.error) {
          console.error("Error sending SMS notification:", response.error);
          toast.warning("Status updated but SMS notification failed", {
            position: "top-center"
          });
        } else if (response.data?.sent > 0) {
          toast.success(`SMS notifications sent to ${response.data.sent} phone number${response.data.sent > 1 ? 's' : ''}`, {
            position: "top-center"
          });
        } else if (response.data?.errors && response.data.errors.length > 0) {
          console.log("SMS notification errors:", response.data.errors);
          toast.warning(`Status updated but SMS failed: ${response.data.errors[0].substring(0, 50)}...`, {
            position: "top-center"
          });
        } else {
          console.log("SMS notification response:", response.data);
          toast.warning("Status updated but no SMS notifications were sent", {
            position: "top-center"
          });
        }
        
        // Always call onDone to return to class list immediately
        onDone?.();
      } catch (smsError) {
        console.error("Error sending SMS notification:", smsError);
        toast.warning("Status updated but SMS notification failed", {
          position: "top-center"
        });
        
        // Still call onDone even if SMS fails
        onDone?.();
      }

      toast.dismiss(toastId);
      toast.success(`Lesson marked as ${status === 'pending' ? 'absent' : status}${newLesson ? ' and next lesson updated' : ''}`);

      if (newLesson) {
        onStatusUpdate(newLesson);
      } else if (currentLesson) {
        onStatusUpdate(currentLesson);
      }

      queryClient.invalidateQueries({ queryKey: ['current-status'] });
    } catch (error: any) {
      console.error("Error updating lesson status:", error);
      toast.error(`Failed to update lesson status: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setPresetDialog(null);
    }
  };

  const openPresetForStatus = (status: 'failed' | 'pending' | 'repeat') => {
    setPresetDialog(status);
  };

  const handlePresetSelect = (message: string, newLesson?: { surah: string; verses: string }) => {
    console.log("Selected preset message in LessonStatus:", message);
    setPresetDialog(null);
    if (presetDialog) {
      handleLessonStatus(presetDialog, message, newLesson);
    }
  };

  return (
    <div className="flex gap-1 sm:gap-2">
      <Button
        onClick={() => openPresetForStatus('failed')}
        disabled={isSubmitting}
        className="bg-red-600 hover:bg-red-700 text-white h-8 sm:h-10 px-3 sm:px-4 text-sm"
      >
        Fail
      </Button>
      <Button
        onClick={() => openPresetForStatus('pending')}
        disabled={isSubmitting}
        className="bg-amber-600 hover:bg-amber-700 text-white h-8 sm:h-10 px-3 sm:px-4 text-sm"
      >
        Absent
      </Button>
      <Button
        onClick={() => openPresetForStatus('repeat')}
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-10 px-3 sm:px-4 text-sm"
      >
        Repeat
      </Button>
      <NotificationPresetSelect
        open={!!presetDialog}
        onOpenChange={(open) => setPresetDialog(open ? presetDialog : null)}
        type={presetDialog === "failed" ? "lesson_fail" : presetDialog === "repeat" ? "lesson_repeat" : "lesson_absent"}
        onSelect={handlePresetSelect}
        studentName={studentName}
        studentId={studentId}
        classId={classId}
      />
    </div>
  );
};
