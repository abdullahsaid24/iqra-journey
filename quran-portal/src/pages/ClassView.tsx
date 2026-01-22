
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClassViewHeader } from "@/components/class-view/ClassViewHeader";
import { ClassInfo } from "@/components/class-view/ClassInfo";
import { ClassContent } from "@/components/class-view/ClassContent";
import { StudentRemovalDialog } from "@/components/class-view/StudentRemovalDialog";
import { useClassData } from "@/components/class-view/hooks/useClassData";
import { useTeacherData } from "@/components/class-view/hooks/useTeacherData";
import { useAdminStatus } from "@/components/class-view/hooks/useAdminStatus";
import { useClassStudents } from "@/hooks/useClassStudents";
import { Loader2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const ClassView = () => {
  const { classId } = useParams();
  const queryClient = useQueryClient();
  const [isRemovalDialogOpen, setIsRemovalDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string, name: string } | null>(null);

  const { data: classData, isLoading, error } = useClassData(classId);
  const { data: teachers } = useTeacherData();
  const { data: isAdmin } = useAdminStatus();
  const { data: students } = useClassStudents(classId);

  // Modified mutation to update instead of delete
  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      // Instead of deleting, update the student to remove class association
      const { data, error } = await supabase
        .from('students')
        .update({ class_id: null })
        .eq('id', studentId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', classId] });
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] });
      toast.success("Student has been removed from the class");
      setStudentToDelete(null);
      setIsDeleteConfirmOpen(false);
    },
    onError: (error) => {
      console.error('Error removing student from class:', error);
      toast.error("Failed to remove student from the class");
      setStudentToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  });

  const handleDeleteClick = (student: { id: string, name: string }) => {
    setStudentToDelete(student);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      removeStudentMutation.mutate(studentToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-quran-bg to-quran-light p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
          <p className="text-white font-arabic text-xl">Loading class...</p>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-quran-bg to-quran-light p-4 sm:p-8">
        <div className="container mx-auto text-center text-white font-arabic text-xl animate-fade-in">
          {error instanceof Error ? error.message : 'Class not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-quran-bg to-quran-light p-4 sm:p-8">
      <div className="container mx-auto space-y-8 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiIGZpbGw9Im5vbmUiLz4KICA8cGF0aCBkPSJNMzAgMEw2MCAzMCAzMCA2MCAwIDMweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPgo8L3N2Zz4=')] opacity-50" />
          
          <div className="relative">
            <ClassViewHeader
              classData={classData}
              classId={classId || ''}
              students={students || []}
              onRemoveStudents={() => setIsRemovalDialogOpen(true)}
              onManageTeachers={undefined}
              showTeacherManagement={false}
            />

            <div className="space-y-8">
              <ClassInfo
                className={classData?.name || ''}
                teacherIds={classData?.teacherIds || []}
                isAdmin={!!isAdmin}
                teachers={teachers || []}
                selectedStudentId={selectedStudentId}
              />

              {classData?.students && classData.students.length > 0 && (
                <ClassContent 
                  students={classData.students}
                  selectedStudentId={selectedStudentId}
                  onStudentSelect={setSelectedStudentId}
                  onStudentDelete={handleDeleteClick}
                  classId={classId}
                />
              )}
            </div>
          </div>
        </div>

        <StudentRemovalDialog
          open={isRemovalDialogOpen}
          onOpenChange={setIsRemovalDialogOpen}
          students={classData?.students || []}
          onConfirmRemoval={(studentId) => removeStudentMutation.mutate(studentId)}
        />

        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent className="max-w-[90%] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {studentToDelete?.name} from the class? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ClassView;
