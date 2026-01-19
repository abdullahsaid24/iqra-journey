
import { SurahSelect } from "./SurahSelect";
import { VersesSelect } from "./VersesSelect";

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
  currentLessonSurah
}: LessonFormGridProps) => {
  return (
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
  );
};
