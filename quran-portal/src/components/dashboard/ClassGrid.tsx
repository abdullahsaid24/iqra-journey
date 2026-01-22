
import { ClassCard } from "./ClassCard";
import { ClassWithStudents } from "@/types/dashboard";

interface ClassGridProps {
  classes: ClassWithStudents[];
  isDeleteMode: boolean;
  hoverClassId: string | null;
  onHover: (id: string | null) => void;
  onDelete: (id: string) => void;
}

export const ClassGrid = ({
  classes,
  isDeleteMode,
  hoverClassId,
  onHover,
  onDelete,
}: ClassGridProps) => {
  return (
    <div className="grid gap-3 xs:gap-4 sm:gap-6 p-2 xs:p-4 sm:p-8 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 animate-fade-in">
      {classes?.map((classItem, index) => (
        <div 
          key={classItem.id} 
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <ClassCard
            classItem={classItem}
            isDeleteMode={isDeleteMode}
            hoverClassId={hoverClassId}
            onHover={onHover}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
};
