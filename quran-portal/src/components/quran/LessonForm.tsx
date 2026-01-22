
import { useState, useEffect } from "react";
import { useLessonManagement } from "@/hooks/useLessonManagement";
import { LessonFormGrid } from "./LessonFormGrid";
import { AhsanulQawaidFormGrid } from "./AhsanulQawaidFormGrid";
import { NoorAlBayanFormGrid } from "./NoorAlBayanFormGrid";
import { FullQuranFormGrid } from "./FullQuranFormGrid";
import { LessonSubmitSection } from "./LessonSubmitSection";

type LessonType = 'current_lesson' | 'goal_setting' | 'ahsanul_qawaid_book_1' | 'noor_al_bayan' | 'full_quran';

interface LessonFormProps {
  studentId: string;
  onLessonUpdate: (lesson: { surah: string; verses: string }) => void;
  currentLesson?: { surah: string; verses: string } | null;
  selectedStartVerse?: string | null;
  selectedEndVerse?: string | null;
  onNavigateToVerse?: (verseKey: string) => void;
  lessonType?: LessonType;
  classId?: string;
  onDone?: () => void;
  onFormStartChange?: (startValue: string) => void; // Notify when start page/lesson changes in form
}

export const LessonForm = ({ 
  studentId, 
  onLessonUpdate, 
  currentLesson, 
  selectedStartVerse, 
  selectedEndVerse,
  onNavigateToVerse,
  lessonType = 'current_lesson',
  classId,
  onDone,
  onFormStartChange
}: LessonFormProps) => {
  // For Ahsanul Qawaid lessons
  const [startLesson, setStartLesson] = useState<string>("");
  const [endLesson, setEndLesson] = useState<string>("");

  // For Noor Al Bayan pages
  const [startPage, setStartPage] = useState<string>("");
  const [endPage, setEndPage] = useState<string>("");

  // For Full Quran surahs  
  const [fullQuranStartSurah, setFullQuranStartSurah] = useState<string>("");
  const [fullQuranEndSurah, setFullQuranEndSurah] = useState<string>("");

  // Prefill form fields based on lesson type and current lesson
  useEffect(() => {
    if (!currentLesson) return;
    
    const versesString = currentLesson.verses || '';
    const verseParts = versesString.split('-').map(v => v.trim());
    const startValue = verseParts[0] || '';
    const endValue = verseParts.length > 1 ? verseParts[1] : startValue;
    
    if (lessonType === 'ahsanul_qawaid_book_1') {
      setStartLesson(startValue);
      setEndLesson(endValue);
    } else if (lessonType === 'noor_al_bayan') {
      setStartPage(startValue);
      setEndPage(endValue);
    } else if (lessonType === 'full_quran') {
      // For full_quran, the surah name is stored in the 'verses' field
      const surahName = currentLesson.verses || currentLesson.surah;
      setFullQuranStartSurah(surahName);
      setFullQuranEndSurah(surahName);
    }
  }, [currentLesson, lessonType]);

  const {
    startSurah,
    setStartSurah,
    endSurah,
    setEndSurah,
    startVerses,
    setStartVerses,
    endVerses,
    setEndVerses,
    currentLessonSurah,
    isLoading,
    handleVerseSelectionChange
  } = useLessonManagement({
    studentId,
    currentLesson,
    selectedStartVerse,
    selectedEndVerse,
    onNavigateToVerse,
    onLessonUpdate
  });

  const handleStartSurahChange = (value: string) => {
    setStartSurah(value);
    setEndSurah(value);
    if (startVerses) {
      handleVerseSelectionChange('start', value, startVerses);
    }
  };

  const handleStartLessonChange = (value: string) => {
    setStartLesson(value);
    setEndLesson(value);
    onFormStartChange?.(value);
  };

  const handleStartPageChange = (value: string) => {
    setStartPage(value);
    setEndPage(value);
    onFormStartChange?.(value);
  };

  const handleFullQuranStartSurahChange = (value: string) => {
    setFullQuranStartSurah(value);
    setFullQuranEndSurah(value);
  };

  const renderLessonForm = () => {
    if (lessonType === 'ahsanul_qawaid_book_1') {
      return (
        <AhsanulQawaidFormGrid
          startLesson={startLesson}
          endLesson={endLesson}
          onStartLessonChange={handleStartLessonChange}
          onEndLessonChange={setEndLesson}
        />
      );
    }

    if (lessonType === 'noor_al_bayan') {
      return (
        <NoorAlBayanFormGrid
          startPage={startPage}
          endPage={endPage}
          onStartPageChange={handleStartPageChange}
          onEndPageChange={setEndPage}
        />
      );
    }

    if (lessonType === 'full_quran') {
      return (
        <FullQuranFormGrid
          startSurah={fullQuranStartSurah}
          endSurah={fullQuranEndSurah}
          onStartSurahChange={handleFullQuranStartSurahChange}
          onEndSurahChange={setFullQuranEndSurah}
        />
      );
    }

    return (
      <LessonFormGrid
        startSurah={startSurah}
        endSurah={endSurah}
        startVerses={startVerses}
        endVerses={endVerses}
        onStartSurahChange={handleStartSurahChange}
        onEndSurahChange={setEndSurah}
        onStartVerseChange={setStartVerses}
        onEndVerseChange={setEndVerses}
        currentLessonSurah={currentLessonSurah}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Current lesson section */}
      <div className="mt-4 border-t pt-4">
        <h3 className="text-sm font-medium mb-2">Current Lesson Assignment</h3>
        {renderLessonForm()}
      </div>

      <LessonSubmitSection 
        studentId={studentId}
        isLoading={isLoading}
        startSurah={lessonType === 'ahsanul_qawaid_book_1' ? startLesson : lessonType === 'noor_al_bayan' ? startPage : lessonType === 'full_quran' ? fullQuranStartSurah : startSurah}
        endSurah={lessonType === 'ahsanul_qawaid_book_1' ? endLesson : lessonType === 'noor_al_bayan' ? endPage : lessonType === 'full_quran' ? fullQuranEndSurah : endSurah}
        startVerses={lessonType === 'ahsanul_qawaid_book_1' ? startLesson : lessonType === 'noor_al_bayan' ? startPage : lessonType === 'full_quran' ? fullQuranStartSurah : startVerses}
        endVerses={lessonType === 'ahsanul_qawaid_book_1' ? endLesson : lessonType === 'noor_al_bayan' ? endPage : lessonType === 'full_quran' ? fullQuranEndSurah : endVerses}
        updateLesson={false}
        nextWeekStartSurah=""
        nextWeekEndSurah=""
        nextWeekStartVerses=""
        nextWeekEndVerses=""
        onLessonUpdate={onLessonUpdate}
        lessonType={lessonType}
        classId={classId}
        onDone={onDone}
      />
    </div>
  );
};
