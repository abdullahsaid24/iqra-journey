
import { Checkbox } from "@/quran/components/ui/checkbox";
import { SurahSelect } from "./SurahSelect";
import { VersesSelect } from "./VersesSelect";

interface LessonUpdateSectionProps {
  updateLesson: boolean;
  setUpdateLesson: (checked: boolean) => void;
  startSurah: string;
  setStartSurah: (v: string) => void;
  endSurah: string;
  setEndSurah: (v: string) => void;
  startVerses: string;
  setStartVerses: (v: string) => void;
  endVerses: string;
  setEndVerses: (v: string) => void;
}

export function LessonUpdateSection({
  updateLesson,
  setUpdateLesson,
  startSurah,
  setStartSurah,
  endSurah,
  setEndSurah,
  startVerses,
  setStartVerses,
  endVerses,
  setEndVerses,
}: LessonUpdateSectionProps) {
  return (
    <div className="pb-2">
      <div className="flex items-center space-x-3 mb-2 p-3 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer"
           onClick={() => setUpdateLesson(!updateLesson)}>
        <Checkbox
          id="updateLesson"
          checked={updateLesson}
          onCheckedChange={(checked) => setUpdateLesson(checked as boolean)}
          className="h-6 w-6 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
        <label
          htmlFor="updateLesson"
          className="text-base font-semibold leading-none cursor-pointer flex-1"
        >
          Update next week's lesson
        </label>
      </div>
      {updateLesson && (
        <div className="space-y-4 mt-2 p-3 bg-slate-50 rounded-md border">
          <h3 className="font-medium">Next Week's Lesson</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">Start</h4>
              <div className="space-y-2">
                <SurahSelect
                  selectedSurah={startSurah}
                  onSurahChange={(value) => {
                    setStartSurah(value);
                    setEndSurah(value);
                  }}
                />
                <VersesSelect
                  selectedVerses={startVerses}
                  onVersesChange={setStartVerses}
                  selectedSurah={startSurah}
                />
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">End</h4>
              <div className="space-y-2">
              <SurahSelect
                  selectedSurah={endSurah}
                  onSurahChange={setEndSurah}
                />
                <VersesSelect
                  selectedVerses={endVerses}
                  onVersesChange={setEndVerses}
                  selectedSurah={endSurah}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
