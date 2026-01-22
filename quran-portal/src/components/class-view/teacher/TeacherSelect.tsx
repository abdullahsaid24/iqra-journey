
import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useState } from "react";

export interface Teacher {
  id: string;
  email: string;
  role?: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface TeacherSelectProps {
  teachers: Teacher[];
  assignedTeacherIds: string[];
  onAssignTeacher: (teacherId: string) => void;
  onRemoveTeacher: (teacherId: string) => void;
}

export const TeacherSelect = ({
  teachers,
  assignedTeacherIds,
  onAssignTeacher,
  onRemoveTeacher,
}: TeacherSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortedTeachers = teachers?.slice().sort((a, b) => {
    // First sort by role (admin first)
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    
    // Then sort by full name
    const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email;
    const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email;
    return aName.localeCompare(bName);
  });

  const handleTeacherClick = (e: React.MouseEvent, teacherId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (assignedTeacherIds.includes(teacherId)) {
      onRemoveTeacher(teacherId);
    } else {
      onAssignTeacher(teacherId);
    }
  };

  const getTeacherDisplayName = (teacher: Teacher) => {
    if (teacher.first_name || teacher.last_name) {
      return `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
    }
    return teacher.email;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-white text-quran-primary hover:bg-quran-primary hover:text-white flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Manage Teachers
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px] bg-white">
        {sortedTeachers?.map((teacher) => (
          <DropdownMenuItem
            key={teacher.id}
            className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
            onSelect={(e) => e.preventDefault()}
            onClick={(e) => handleTeacherClick(e, teacher.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-4">
                {assignedTeacherIds.includes(teacher.id) && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-black">
                  {getTeacherDisplayName(teacher)}
                </span>
                <Badge 
                  variant={teacher.role === 'admin' ? 'default' : 'secondary'}
                  className="text-xs mt-1 w-fit"
                >
                  {teacher.role === 'admin' ? 'Admin' : 'Teacher'}
                </Badge>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

