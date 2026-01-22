import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AhsanulQawaidLessonSelectProps {
  selectedLesson: string;
  onLessonChange: (value: string) => void;
  startFromLesson?: string;
  label: string;
}

export const AhsanulQawaidLessonSelect = ({
  selectedLesson,
  onLessonChange,
  startFromLesson,
  label
}: AhsanulQawaidLessonSelectProps) => {
  // Create lessons 1-29
  const lessons = Array.from({ length: 29 }, (_, i) => (i + 1).toString());
  
  // If startFromLesson is provided, filter to show only lessons from that number onwards
  const availableLessons = startFromLesson 
    ? lessons.filter(lesson => parseInt(lesson) >= parseInt(startFromLesson))
    : lessons;

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="lesson" className="text-right font-semibold text-gray-700">
        {label}
      </Label>
      <div className="col-span-3">
        <Select value={selectedLesson} onValueChange={onLessonChange}>
          <SelectTrigger className="bg-white text-gray-900 border-gray-200">
            <SelectValue placeholder="Select lesson number" />
          </SelectTrigger>
          <SelectContent className="bg-white max-h-[300px]">
            <div className="h-[200px] overflow-y-auto">
              {availableLessons.map(lesson => (
                <SelectItem 
                  key={lesson} 
                  value={lesson} 
                  className="text-gray-900 hover:bg-gray-100 cursor-pointer"
                >
                  <span className="text-gray-900">Lesson {lesson}</span>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};