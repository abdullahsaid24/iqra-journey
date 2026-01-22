
import { SurahSelect } from "./SurahSelect";
import { VersesSelect } from "./VersesSelect";
import { JuzSelect } from "./JuzSelect";
import { JUZ_DATA } from "@/quran/types/juz";
import { AVAILABLE_SURAHS } from "@/quran/types/quran";

interface LessonFormGridProps {
  startSurah: string;
  endSurah: string;
  startVerses: string;
  endVerses: string;
  onStartSurahChange: (value: string) => void;
  onEndSurahChange: (value: string) => void;
  onStartVerseChange: (value: string) => void;
  onEndVerseChange: (value: string) => void;
  currentLessonSurah?: string;
  // Optional Juz props
  selectedJuz?: string;
  onJuzChange?: (value: string) => void;
}

export const LessonFormGrid = ({
  startSurah,
  endSurah,
  startVerses,
  endVerses,
  onStartSurahChange,
  onEndSurahChange,
  onStartVerseChange,
  onEndVerseChange,
  currentLessonSurah,
  selectedJuz = "",
  onJuzChange
}: LessonFormGridProps) => {
  // Handle Juz selection - auto-fill Start Surah and Verse to the beginning of the Juz
  const handleJuzChange = (juzNumber: string) => {
    if (onJuzChange) {
      onJuzChange(juzNumber);
    }
    const juz = JUZ_DATA.find(j => j.number === parseInt(juzNumber));
    if (juz) {
      const surah = AVAILABLE_SURAHS.find(s => s.number === juz.startSurah);
      if (surah) {
        onStartSurahChange(surah.name);
        onStartVerseChange(juz.startVerse.toString());
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Juz Selection */}
      <div className="mb-4">
        <JuzSelect
          selectedJuz={selectedJuz}
          onJuzChange={handleJuzChange}
        />
      </div>

      {/* Start/End Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="mb-2 font-semibold text-gray-700">Start</h3>
          <div className="space-y-2">
            <SurahSelect
              selectedSurah={startSurah}
              onSurahChange={onStartSurahChange}
            />
            <VersesSelect
              selectedVerses={startVerses}
              onVersesChange={onStartVerseChange}
              selectedSurah={startSurah}
            />
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-gray-700">End</h3>
          <div className="space-y-2">
            <SurahSelect
              selectedSurah={endSurah}
              onSurahChange={onEndSurahChange}
            />
            <VersesSelect
              selectedVerses={endVerses}
              onVersesChange={onEndVerseChange}
              selectedSurah={endSurah}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
