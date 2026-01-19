
import { useState, useEffect } from "react";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/quran/components/ui/alert-dialog";
import { Button } from "@/quran/components/ui/button";
import { SurahSelect } from "./SurahSelect";
import { VersesSelect } from "./VersesSelect";
import { formatLessonDisplay } from "@/quran/lib/utils";

interface LessonDialogProps {
  showDialog: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onLessonUpdate: (lesson: { surah: string; verses: string }) => void;
}

export const LessonDialog = ({
  showDialog,
  onOpenChange,
  studentId,
  onLessonUpdate,
}: LessonDialogProps) => {
  const [selectedSurah, setSelectedSurah] = useState<string>("");
  const [selectedVerses, setSelectedVerses] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedSurah || !selectedVerses) {
      toast.error("Please select both surah and verses");
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if session exists before making the request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Your session has expired. Please log in again.");
        setIsSubmitting(false);
        return;
      }
      
      const { error } = await supabase.from("lessons").insert({
        student_id: studentId,
        surah: selectedSurah,
        verses: selectedVerses,
      });

      if (error) throw error;

      onLessonUpdate({
        surah: selectedSurah,
        verses: selectedVerses,
      });

      toast.success(`Lesson updated to ${formatLessonDisplay(selectedSurah, selectedVerses)}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error("Failed to save lesson");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  useEffect(() => {
    if (showDialog) {
      setSelectedSurah("");
      setSelectedVerses("");
    }
  }, [showDialog]);

  return (
    <AlertDialog 
      open={showDialog} 
      onOpenChange={(open) => {
        if (!isSubmitting) {
          onOpenChange(open);
        }
      }}
    >
      <AlertDialogContent 
        onClick={handleContentClick} 
        className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto"
        onPointerDownCapture={(e) => e.stopPropagation()}
        onPointerUpCapture={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Update Lesson</AlertDialogTitle>
          <AlertDialogDescription>
            Select the surah and verses for the next lesson.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4 py-4" onClick={handleContentClick}>
          <SurahSelect
            selectedSurah={selectedSurah}
            onSurahChange={setSelectedSurah}
          />
          <VersesSelect
            selectedVerses={selectedVerses}
            onVersesChange={setSelectedVerses}
            selectedSurah={selectedSurah}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => {
            e.stopPropagation();
            if (!isSubmitting) {
              onOpenChange(false);
            }
          }}>
            Cancel
          </AlertDialogCancel>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting || !selectedSurah || !selectedVerses}
          >
            Save
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
