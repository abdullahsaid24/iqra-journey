
import { Link } from "react-router-dom";
import { Card } from "@/quran/components/ui/card";
import { ClassWithStudents } from "@/quran/types/dashboard";
import { Users } from "lucide-react";

interface ClassCardProps {
  classItem: ClassWithStudents;
  isDeleteMode: boolean;
  hoverClassId: string | null;
  onHover: (id: string | null) => void;
  onDelete: (id: string) => void;
}

export const ClassCard = ({
  classItem,
  isDeleteMode,
  hoverClassId,
  onHover,
  onDelete,
}: ClassCardProps) => {
  return (
    <div
      className="relative group animate-fade-in"
      onMouseEnter={() => isDeleteMode && onHover(classItem.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Link to={`/quran/class/${classItem.id}`} className={isDeleteMode ? 'pointer-events-none' : ''}>
        <Card
          className={`p-4 sm:p-6 cursor-pointer transition-all duration-300 backdrop-blur-sm
            bg-white/60 hover:bg-white/80 border border-white/20
            hover:shadow-lg hover:scale-[1.02] group h-full
            ${isDeleteMode && hoverClassId === classItem.id ? 'ring-2 ring-red-500' : ''}
            ${isDeleteMode ? 'opacity-75' : ''}`}
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <h3 className="text-lg sm:text-xl font-semibold text-quran-primary text-center 
              group-hover:text-quran-primary/80 transition-colors">
              {classItem.name}
            </h3>
            <div className="flex items-center justify-center gap-2 text-gray-600 
              group-hover:text-gray-700 transition-colors">
              <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-sm sm:text-base">{classItem.students?.length || 0} Students</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 text-center group-hover:text-gray-600 
              transition-colors">
              {classItem.teachers && classItem.teachers.length > 0
                ? `${classItem.teachers.length} Teacher${classItem.teachers.length > 1 ? 's' : ''}`
                : "No teachers assigned"}
            </div>
          </div>
        </Card>
      </Link>
      {isDeleteMode && hoverClassId === classItem.id && (
        <div
          className="absolute -bottom-1 left-0 right-0 bg-red-500 text-white p-1 sm:p-2 
            text-center cursor-pointer rounded-b-lg transform transition-transform 
            duration-200 hover:bg-red-600 text-xs sm:text-sm"
          onClick={() => onDelete(classItem.id)}
        >
          Click to confirm deletion
        </div>
      )}
    </div>
  );
};
