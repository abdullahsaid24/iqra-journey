
import { TeacherBadge } from "./teacher/TeacherBadge";
import { TeacherSelect } from "./teacher/TeacherSelect";

export interface Teacher {
  id: string;
  email: string;
  role?: string;
}

interface TeacherManagementProps {
  teacherIds: string[];
  teachers?: Teacher[];
  onAssignTeacher: (teacherId: string) => void;
  onRemoveTeacher: (teacherId: string) => void;
}

export const TeacherManagement = ({
  teacherIds,
  teachers,
  onAssignTeacher,
  onRemoveTeacher,
}: TeacherManagementProps) => {
  const assignedTeachers = teachers?.filter(teacher => 
    teacherIds.includes(teacher.id)
  ) || [];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap justify-center gap-2">
        {assignedTeachers.map((teacher) => (
          <TeacherBadge
            key={teacher.id}
            email={teacher.email}
            onRemove={() => onRemoveTeacher(teacher.id)}
          />
        ))}
      </div>
      
      <TeacherSelect
        teachers={teachers || []}
        assignedTeacherIds={teacherIds}
        onAssignTeacher={onAssignTeacher}
        onRemoveTeacher={onRemoveTeacher}
      />
    </div>
  );
};
