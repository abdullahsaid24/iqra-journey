
import { ClassWithStudents } from "@/quran/types/dashboard";
import { AttendanceClassCard } from "./AttendanceClassCard";

interface AttendanceClassGridProps {
  classes: ClassWithStudents[];
}

export const AttendanceClassGrid = ({ classes }: AttendanceClassGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((classItem) => (
        <AttendanceClassCard key={classItem.id} classItem={classItem} />
      ))}
    </div>
  );
};
