import { useEffect, useRef } from "react";
import { usePageAudio } from "@/quran/hooks/usePageAudio";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";

interface MushafAudioControllerProps {
  pageNumber: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentVerseIndex: number;
  setCurrentVerseIndex: (index: number) => void;
  targetRepeatCount: number; // how many times each ayah repeats: 1, 2, 3, 5, Infinity
  onPageComplete?: () => void;
  lessonId?: string;
  studentId?: string;
  /**
   * The last ayah of the assigned lesson. Finishing it is what counts as one
   * repetition of the lesson - not reaching the end of the printed page, which
   * is what was counted before and made a three-ayah lesson require listening
   * to all fifteen lines to score once.
   */
  lessonLastVerseKey?: string;
  onListenRecorded?: (newCount: number) => void;
}

export const MushafAudioController = ({
  pageNumber,
  isPlaying,
  setIsPlaying,
  currentVerseIndex,
  setCurrentVerseIndex,
  targetRepeatCount,
  onPageComplete,
  lessonId,
  studentId,
  lessonLastVerseKey,
  onListenRecorded
}: MushafAudioControllerProps) => {
  const { data: audioData, isLoading } = usePageAudio(pageNumber);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentRepeatCount = useRef(0);

  const currentVerse = audioData?.[currentVerseIndex];

  // Handle Play/Pause
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch((e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentVerseIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
    };
  }, []);

  // Reset repeat count when changing verse manually
  useEffect(() => {
    currentRepeatCount.current = 0;
  }, [currentVerseIndex]);

  // Reset verse index when changing page
  useEffect(() => {
    setCurrentVerseIndex(0);
    currentRepeatCount.current = 0;
  }, [pageNumber, setCurrentVerseIndex]);

  /**
   * One completed pass through the assigned lesson.
   *
   * Recorded by the database rather than by reading the count and writing it
   * back: a parent's phone and the student's tablet practising together would
   * both read the same value and lose a listen. The function also caps the
   * count at the teacher's target and refuses anyone who is not the student,
   * their parent, or staff.
   */
  const recordLessonListen = async () => {
    if (!lessonId) return;
    try {
      // Annotated any: the generated types predate this function.
      const { data, error } = await (supabase as any).rpc("record_lesson_listen", {
        p_lesson_id: lessonId,
      });
      if (error) throw error;
      onListenRecorded?.(data as number);
      toast.success("Practice listen saved");
    } catch (error) {
      // Previously swallowed, so a missing column or a denied write looked
      // exactly like success to the student.
      console.error("Error recording listen:", error);
      toast.error("Could not save this practice listen.");
    }
  };

  const handleNextVerse = async () => {
    if (!audioData) return;

    const finishedVerse = audioData[currentVerseIndex];
    if (lessonId && lessonLastVerseKey && finishedVerse?.verse_key === lessonLastVerseKey) {
      await recordLessonListen();
    }

    if (currentVerseIndex < audioData.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
    } else {
      // Reached the end of the page
      setIsPlaying(false);
      if (onPageComplete) {
        onPageComplete();
      }
    }
  };

  const playWithDelay = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.error("Playback error:", e);
        setIsPlaying(false);
      });
    }
  };

  const handleEnded = () => {
    // Check if we need to repeat
    currentRepeatCount.current += 1;

    if (
      targetRepeatCount === Infinity || 
      currentRepeatCount.current < targetRepeatCount
    ) {
      // Repeat the current ayah
      playWithDelay();
    } else {
      // Move to next ayah
      currentRepeatCount.current = 0; // reset for next verse
      handleNextVerse();
    }
  };

  if (!currentVerse) return null;

  const nextVerse = audioData?.[currentVerseIndex + 1];

  return (
    <>
      <audio
        ref={audioRef}
        src={currentVerse.audio_url}
        autoPlay={isPlaying}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
      />
      {/* Preload the next verse to eliminate loading pauses */}
      {nextVerse && (
        <audio preload="auto" src={nextVerse.audio_url} />
      )}
    </>
  );
};
