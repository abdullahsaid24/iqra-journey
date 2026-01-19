import { SurahSelect } from "./SurahSelect";

interface FullQuranFormGridProps {
  startSurah: string;
  endSurah: string;
  onStartSurahChange: (value: string) => void;
  onEndSurahChange: (value: string) => void;
}

export const FullQuranFormGrid = ({
  startSurah,
  endSurah,
  onStartSurahChange,
  onEndSurahChange,
}: FullQuranFormGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="mb-2 font-semibold text-foreground">Start</h3>
        <div className="space-y-2">
          <SurahSelect
            selectedSurah={startSurah}
            onSurahChange={onStartSurahChange}
          />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-foreground">End</h3>
        <div className="space-y-2">
          <SurahSelect
            selectedSurah={endSurah}
            onSurahChange={onEndSurahChange}
          />
        </div>
      </div>
    </div>
  );
};
