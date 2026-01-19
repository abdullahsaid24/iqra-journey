
import { Avatar, AvatarFallback, AvatarImage } from "@/quran/components/ui/avatar";
import { Button } from "@/quran/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/quran/components/ui/dropdown-menu";
import { useCurrentLesson } from "@/quran/hooks/useCurrentLesson";
import { useQueryClient } from "@tanstack/react-query";
import { LessonStatus } from "../quran/LessonStatus";

interface StudentHeaderProps {
  student: {
    id: string;
    name: string;
    image?: string | null;
    class_id?: string;
  } | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function StudentHeader({ student }: StudentHeaderProps) {
  const queryClient = useQueryClient();

  const { data: currentLesson, isLoading, error } = useCurrentLesson(student?.id);

  const statusUpdateHandler = (lesson: { surah: string; verses: string }) => {
    // Reset student assignment form if status changes
    queryClient.invalidateQueries({
      queryKey: ['current-lesson', student?.id]
    });
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
      <div>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={student?.image || ""} />
            <AvatarFallback>{student?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">{student?.name}</h2>
            <p className="text-sm text-muted-foreground">
              {student?.id}
            </p>
          </div>
        </div>
      </div>

      {student && currentLesson && (
        <div className="flex flex-wrap gap-2 items-center">
          <LessonStatus 
            studentId={student.id}
            currentLesson={currentLesson}
            onStatusUpdate={statusUpdateHandler}
            studentName={student.name}
            classId={student.class_id}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={student?.id ? () => console.log("View student details for:", student.id) : undefined}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={student?.id ? () => console.log("Edit student for:", student.id) : undefined}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={student?.id ? () => console.log("Delete student for:", student.id) : undefined} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
