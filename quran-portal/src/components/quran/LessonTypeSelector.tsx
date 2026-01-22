
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type LessonType = 'current_lesson' | 'goal_setting' | 'ahsanul_qawaid_book_1' | 'noor_al_bayan' | 'full_quran';

interface LessonTypeSelectorProps {
  selectedType: LessonType;
  onTypeChange: (type: LessonType) => void;
  restrictedMode?: boolean;
}

export const LessonTypeSelector = ({
  selectedType,
  onTypeChange,
  restrictedMode = false,
}: LessonTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-2 sm:gap-4">
      <Label className="text-right font-semibold text-gray-700 text-xs sm:text-base">Lesson Type</Label>
      <div className="col-span-3">
        <Select
          value={selectedType}
          onValueChange={(value) => onTypeChange(value as LessonType)}
        >
          <SelectTrigger className="bg-white text-gray-900 border-gray-200 h-8 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder="Select lesson type" />
          </SelectTrigger>
          <SelectContent>
            {!restrictedMode && (
              <>
                <SelectItem value="current_lesson" className="text-xs sm:text-sm">Current Lesson</SelectItem>
                <SelectItem value="goal_setting" className="text-xs sm:text-sm">Goal Setting</SelectItem>
              </>
            )}
            <SelectItem value="ahsanul_qawaid_book_1" className="text-xs sm:text-sm">Ahsanul Qawaid Book 1</SelectItem>
            <SelectItem value="noor_al_bayan" className="text-xs sm:text-sm">Noor Al Bayan</SelectItem>
            <SelectItem value="full_quran" className="text-xs sm:text-sm">Full Quran</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
