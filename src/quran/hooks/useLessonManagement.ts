
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";
import { formatLessonDisplay, cleanVerseReferences } from "@/quran/lib/utils";

interface UseLessonManagementProps {
  studentId: string;
  currentLesson?: { surah: string; verses: string } | null;
  selectedStartVerse?: string | null;
  selectedEndVerse?: string | null;
  onNavigateToVerse?: (verseKey: string) => void;
  onLessonUpdate: (lesson: { surah: string; verses: string }) => void;
}

export const useLessonManagement = ({
  studentId,
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
  }, [studentId, currentLesson]);

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
      const surahName = lesson.surah;
      
      // Clean and extract only numeric parts from verse references
      const versesString = lesson.verses || '';
      const verseParts = versesString.split('-').map(v => v.replace(/[^0-9]/g, ''));
      
      const startVerseNum = verseParts[0] || '';
      const endVerseNum = verseParts.length > 1 ? verseParts[1] : startVerseNum;
      
      setStartSurah(surahName);
      setEndSurah(surahName);
      setStartVerses(startVerseNum);
      setEndVerses(endVerseNum);
      
      setCurrentLessonSurah(surahName);
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
      const { data: lessons, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (lessons && lessons.length > 0) {
        const currentLesson = lessons[0];
        const surah = currentLesson.surah;
        
        // Clean and extract only numeric parts from verse references
        const versesString = currentLesson.verses || '';
        const verseParts = versesString.split('-').map(v => v.replace(/[^0-9]/g, ''));
        
        const startVerseNum = verseParts[0] || '';
        const endVerseNum = verseParts.length > 1 ? verseParts[1] : startVerseNum;
        
        setStartSurah(surah);
        setEndSurah(surah);
        setStartVerses(startVerseNum);
        setEndVerses(endVerseNum);
        setCurrentLessonSurah(surah);
      }
    } catch (error) {
      console.error("Error fetching current lesson:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfPassedLesson = async () => {
    try {
      const { data: assignments, error } = await supabase
        .from("homework_assignments")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "passed")
        .eq("type", "lesson")
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
