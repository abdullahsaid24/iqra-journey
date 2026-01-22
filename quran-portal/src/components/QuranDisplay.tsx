import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CurrentLessonDisplay } from "./quran/CurrentLessonDisplay";
import { LessonDialog } from "./quran/LessonDialog";
import { debounce } from "lodash";
import { TanzilViewer } from "./quran/TanzilViewer";
import { AhsanulQawaidViewer } from "./quran/AhsanulQawaidViewer";
import { NoorAlBayanViewer } from "./quran/NoorAlBayanViewer";
import { DigitalKhattProvider } from './quran/DigitalKhattProvider';
import { getVerseMetadata } from "@/lib/quran-api";
import { formatLessonDisplay } from "@/lib/utils";

interface QuranDisplayProps {
  currentPage: number;
  isLoading: boolean;
  studentId: string;
  classId?: string;
  onDone?: () => void;
}

type LessonType = 'current_lesson' | 'goal_setting' | 'ahsanul_qawaid_book_1' | 'noor_al_bayan' | 'full_quran';

export const QuranDisplay = ({
  currentPage: initialPage,
  isLoading,
  studentId,
  classId,
  onDone,
}: QuranDisplayProps) => {
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<LessonType>('current_lesson');
  const [currentLesson, setCurrentLesson] = useState<{
    surah: string;
    verses: string;
    lesson_type?: string;
  } | null>(null);
  const [selectedStartVerse, setSelectedStartVerse] = useState<string | null>(null);
  const [selectedEndVerse, setSelectedEndVerse] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [formPreviewValue, setFormPreviewValue] = useState<string | null>(null);

  // Check if this is a Monday or Friday class (restricted mode)
  const isRestrictedClass = classId === 'a6184b1b-6299-4d0c-9f17-6cbf68591a35' || classId === 'c44e5a86-41ef-4714-90c8-542bf6fdf9e4';

  // Removed: lesson type is now set from fetched data in fetchCurrentLesson

  const fetchCurrentLesson = useCallback(async () => {
    if (!studentId) return;

    try {
      const { data: lessons, error } = await supabase
        .from("lessons")
        .select("surah, verses, lesson_type")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (lessons && lessons.length > 0) {
        const lesson = lessons[0];
        setCurrentLesson({
          surah: lesson.surah,
          verses: lesson.verses,
          lesson_type: lesson.lesson_type || undefined,
        });
        
        // Set lesson type from database, fallback to defaults
        if (lesson.lesson_type) {
          setSelectedType(lesson.lesson_type as LessonType);
        } else if (isRestrictedClass) {
          setSelectedType('ahsanul_qawaid_book_1');
        } else {
          setSelectedType('current_lesson');
        }
      } else {
        setCurrentLesson(null);
        // Set default for new students
        setSelectedType(isRestrictedClass ? 'ahsanul_qawaid_book_1' : 'current_lesson');
      }
    } catch (error) {
      console.error("Error fetching lesson:", error);
      toast.error("Failed to fetch current lesson");
    }
  }, [studentId, isRestrictedClass]);

  useEffect(() => {
    const debouncedFetch = debounce(() => {
      fetchCurrentLesson();
    }, 300);
    
    debouncedFetch();

    return () => {
      debouncedFetch.cancel();
    };
  }, [fetchCurrentLesson]);

  const handleLessonUpdate = (lesson: { surah: string; verses: string }) => {
    setCurrentLesson(lesson);
    
    // Extract the first verse to navigate to that page
    if (lesson.verses) {
      const versesParts = lesson.verses.split("-");
      if (versesParts.length > 0) {
        const firstVersePart = versesParts[0];
        handleNavigateToVerse(firstVersePart);
      }
    }
  };

  const handleTypeChange = (type: LessonType) => {
    setSelectedType(type);
  };

  const handleVerseSelect = (verseKey: string, position: 'start' | 'end') => {
    if (position === 'start') {
      setSelectedStartVerse(verseKey);
      if (selectedEndVerse) {
        // Validate that end verse comes after start verse
        const [startSurah, startVerse] = verseKey.split(':').map(Number);
        const [endSurah, endVerse] = selectedEndVerse.split(':').map(Number);
        
        if (endSurah < startSurah || (endSurah === startSurah && endVerse < startVerse)) {
          setSelectedEndVerse(null);
        }
      }
    } else {
      setSelectedEndVerse(verseKey);
    }
  };
  
  const handleNavigateToVerse = async (verseKey: string) => {
    try {
      if (verseKey && verseKey.includes(':')) {
        const metadata = await getVerseMetadata(verseKey);
        setCurrentPage(metadata.page_number);
      }
    } catch (error) {
      console.error("Error navigating to verse:", error);
    }
  };

  // Handle form start value change (for live preview in PDF viewers)
  const handleFormStartChange = (startValue: string) => {
    setFormPreviewValue(startValue);
  };

  return (
    <DigitalKhattProvider>
      <div className="space-y-4">
        <CurrentLessonDisplay
          currentLesson={currentLesson}
          currentPage={currentPage}
          onLessonComplete={() => setShowLessonDialog(true)}
          studentId={studentId}
          onLessonUpdate={handleLessonUpdate}
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
          selectedStartVerse={selectedStartVerse}
          selectedEndVerse={selectedEndVerse}
          onNavigateToVerse={handleNavigateToVerse}
          restrictedMode={isRestrictedClass}
          classId={classId}
          onDone={onDone}
          onFormStartChange={handleFormStartChange}
        />

        {selectedType === 'ahsanul_qawaid_book_1' ? (
          <AhsanulQawaidViewer 
            currentLesson={currentLesson}
            onPageChange={setCurrentPage}
            previewLesson={formPreviewValue}
          />
        ) : selectedType === 'noor_al_bayan' ? (
          <NoorAlBayanViewer 
            currentLesson={currentLesson}
            onPageChange={setCurrentPage}
            previewPage={formPreviewValue}
          />
        ) : !isRestrictedClass && (
          <TanzilViewer 
            currentPage={currentPage}
            currentLesson={currentLesson}
            onVerseSelect={handleVerseSelect}
            selectedStartVerse={selectedStartVerse}
            selectedEndVerse={selectedEndVerse}
            onPageChange={setCurrentPage}
          />
        )}

        <LessonDialog
          showDialog={showLessonDialog}
          onOpenChange={setShowLessonDialog}
          studentId={studentId}
          onLessonUpdate={handleLessonUpdate}
        />
      </div>
    </DigitalKhattProvider>
  );
};
