
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";
import { formatLessonDisplay, cleanVerseReferences, splitSurahRange } from "@/quran/lib/utils";

interface UseLessonManagementProps {
  studentId: string;
  /** Lessons and homework are per class - a student attending both a weekday
   *  and weekend class has separate work in each. */
  classId?: string;
  currentLesson?: { surah: string; verses: string } | null;
  selectedStartVerse?: string | null;
  selectedEndVerse?: string | null;
  onNavigateToVerse?: (verseKey: string) => void;
  onLessonUpdate: (lesson: { surah: string; verses: string }) => void;
}

export const useLessonManagement = ({
  studentId,
  classId,
  currentLesson,
  selectedStartVerse,
  selectedEndVerse,
  onNavigateToVerse,
  onLessonUpdate
}: UseLessonManagementProps) => {
  const [startSurah, setStartSurah] = useState<string>("");
  const [endSurah, setEndSurah] = useState<string>("");
  const [startVerses, setStartVerses] = useState<string>("");
  const [endVerses, setEndVerses] = useState<string>("");
  const [currentLessonSurah, setCurrentLessonSurah] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasPassed, setHasPassed] = useState<boolean>(false);

  useEffect(() => {
    if (studentId) {
      if (currentLesson) {
        prefillFromCurrentLesson(currentLesson);
      } else {
        fetchCurrentLesson();
      }
      checkIfPassedLesson();
    }
  }, [studentId, classId, currentLesson]);

  useEffect(() => {
    if (selectedStartVerse && selectedStartVerse.includes(':')) {
      const [surahNum, verseNum] = selectedStartVerse.split(':');
      const surahName = AVAILABLE_SURAHS.find(s => s.number === parseInt(surahNum))?.name;
      
      if (surahName) {
        setStartSurah(surahName);
        // Just use the numeric part of the verse
        const numericVerse = verseNum.replace(/[^0-9]/g, '');
        setStartVerses(numericVerse);
        if (!selectedEndVerse) {
          setEndSurah(surahName);
          setEndVerses(numericVerse);
        }
      }
    }

    if (selectedEndVerse && selectedEndVerse.includes(':')) {
      const [surahNum, verseNum] = selectedEndVerse.split(':');
      const surahName = AVAILABLE_SURAHS.find(s => s.number === parseInt(surahNum))?.name;
      
      if (surahName) {
        setEndSurah(surahName);
        // Just use the numeric part of the verse
        const numericVerse = verseNum.replace(/[^0-9]/g, '');
        setEndVerses(numericVerse);
      }
    }
  }, [selectedStartVerse, selectedEndVerse]);

  const prefillFromCurrentLesson = (lesson: { surah: string; verses: string }) => {
    try {
      // A lesson across two surahs is stored as "Al-Ankaboot-Yaseen". Setting
      // both dropdowns to that whole string matched no option and left them
      // blank, so it is split back into its two real surah names.
      const { start: startSurahName, end: endSurahName } = splitSurahRange(lesson.surah);

      // Clean and extract only numeric parts from verse references
      const versesString = lesson.verses || '';
      const verseParts = versesString.split('-').map(v => v.replace(/[^0-9]/g, ''));

      const startVerseNum = verseParts[0] || '';
      const endVerseNum = verseParts.length > 1 ? verseParts[1] : startVerseNum;

      setStartSurah(startSurahName);
      setEndSurah(endSurahName);
      setStartVerses(startVerseNum);
      setEndVerses(endVerseNum);

      setCurrentLessonSurah(startSurahName);
      setIsLoading(false);
    } catch (error) {
      console.error("Error prefilling from current lesson:", error);
      setIsLoading(false);
      fetchCurrentLesson();
    }
  };

  const fetchCurrentLesson = async () => {
    setIsLoading(true);
    try {
      // Annotated any: chaining a conditional filter onto Supabase's typed
      // builder exceeds TypeScript's instantiation depth here (TS2589).
      const lessonBase: any = supabase
        .from("lessons")
        .select("*")
        .eq("student_id", studentId);

      const { data: lessons, error } = await (
        classId ? lessonBase.eq("class_id", classId) : lessonBase
      )
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (lessons && lessons.length > 0) {
        const currentLesson = lessons[0];
        // Same two-surah range as above - split before it reaches a dropdown.
        const { start: startSurahName, end: endSurahName } = splitSurahRange(currentLesson.surah);

        // Clean and extract only numeric parts from verse references
        const versesString = currentLesson.verses || '';
        const verseParts = versesString.split('-').map(v => v.replace(/[^0-9]/g, ''));

        const startVerseNum = verseParts[0] || '';
        const endVerseNum = verseParts.length > 1 ? verseParts[1] : startVerseNum;

        setStartSurah(startSurahName);
        setEndSurah(endSurahName);
        setStartVerses(startVerseNum);
        setEndVerses(endVerseNum);
        setCurrentLessonSurah(startSurahName);
      }
    } catch (error) {
      console.error("Error fetching current lesson:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfPassedLesson = async () => {
    try {
      // See note above - same TS2589 depth limit.
      const passedBase: any = supabase
        .from("homework_assignments")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "passed")
        .eq("type", "lesson");

      const { data: assignments, error } = await (
        classId ? passedBase.eq("class_id", classId) : passedBase
      )
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (assignments && assignments.length > 0) {
        const mostRecentAssignment = assignments[0];
        const assignmentTime = new Date(mostRecentAssignment.created_at);
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - assignmentTime.getTime();
        const minutesDifference = Math.floor(timeDifference / (1000 * 60));
        
        if (minutesDifference < 30) {
          setHasPassed(true);
        }
      }
    } catch (error) {
      console.error("Error checking for passed lessons:", error);
    }
  };

  const handleVerseSelectionChange = async (type: 'start' | 'end', surah: string, verse: string) => {
    if (!surah || !verse || !onNavigateToVerse) return;
    
    const surahData = AVAILABLE_SURAHS.find(s => s.name === surah);
    if (!surahData) return;
    
    const verseKey = `${surahData.number}:${verse}`;
    if (type === 'start') {
      onNavigateToVerse(verseKey);
    }
  };

  return {
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
    hasPassed,
    handleVerseSelectionChange
  };
};

export default useLessonManagement;
