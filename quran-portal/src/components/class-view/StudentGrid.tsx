
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface Student {
  id: string;
  name: string;
}

interface StudentGridProps {
  students: Student[];
  isDeleteMode: boolean;
  hoverStudentId: string | null;
  onHover: (id: string | null) => void;
  onDelete: (student: Student) => void;
}

export const StudentGrid = ({
  students,
  isDeleteMode,
  hoverStudentId,
  onHover,
  onDelete,
}: StudentGridProps) => {
  // Sort students alphabetically by name and remove any filter/limit
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 max-h-[calc(100vh-200px)] overflow-y-auto pb-6">
      {sortedStudents.map((student) => (
        <div
          key={student.id}
          className="relative"
          onMouseEnter={() => isDeleteMode && onHover(student.id)}
          onMouseLeave={() => onHover(null)}
        >
          <Link
            to={`/student/${student.id}`}
            className={isDeleteMode ? 'pointer-events-none' : ''}
          >
            <Card
              className={`p-4 sm:p-6 cursor-pointer hover:shadow-md transition-shadow bg-white flex items-center justify-center h-24 sm:h-32 ${
                hoverStudentId === student.id ? 'ring-2 ring-red-500' : ''
              }`}
            >
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-quran-primary text-center">
                {student.name}
              </h3>
            </Card>
          </Link>
          {isDeleteMode && hoverStudentId === student.id && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-2 text-center cursor-pointer rounded-b-lg hover:bg-red-600"
              onClick={() => onDelete(student)}
            >
              Click to delete
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
