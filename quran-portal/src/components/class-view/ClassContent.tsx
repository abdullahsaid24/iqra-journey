
import { QuranDisplay } from "@/components/QuranDisplay";
import { StudentSelector } from "@/components/class-view/StudentSelector";
import type { Student } from "@/types/student";
import { TeacherSpreadsheet } from "./spreadsheet/TeacherSpreadsheet";
import { useAdminStatus } from "./hooks/useAdminStatus";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChartBarIcon, BookOpenIcon, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { DigitalKhattProvider } from "../quran/DigitalKhattProvider";
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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TransferClassButton } from "../student/TransferClassButton";

interface ClassContentProps {
  students: Student[];
  selectedStudentId: string | null;
  onStudentSelect: (studentId: string) => void;
  onStudentDelete?: (student: { id: string, name: string }) => void;
  classId?: string;
}

export const ClassContent = ({ 
  students,
  selectedStudentId,
  onStudentSelect,
  onStudentDelete,
  classId
}: ClassContentProps) => {
  const { data: isTeacherOrAdmin } = useAdminStatus();
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("lesson");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string, name: string } | null>(null);
  
  // Find the selected student from the list
  const selectedStudent = students.find(student => student.id === selectedStudentId);
  
  useEffect(() => {
    // When a student is selected, scroll to the top of the content area
    if (selectedStudentId && contentRef.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedStudentId]);

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class'] });
      toast.success("Student has been removed from the class");
      setStudentToDelete(null);
      setIsDeleteConfirmOpen(false);
      // If the deleted student was selected, clear the selection
      if (selectedStudentId === studentToDelete?.id) {
        onStudentSelect("");
      }
    },
    onError: (error) => {
      console.error('Error deleting student:', error);
      toast.error("Failed to remove student from the class");
      setStudentToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  });

  const handleBackClick = () => {
    onStudentSelect("");
  };

  const handleViewStats = () => {
    // Navigate directly to the student stats page
    navigate(`/student/${selectedStudentId}/stats`);
  };

  const handleDeleteClick = (student: { id: string, name: string }) => {
    setStudentToDelete(student);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteStudentMutation.mutate(studentToDelete.id);
    }
  };

  return (
    <DigitalKhattProvider>
      <div className="space-y-12 animate-fade-in" ref={contentRef}>
        <StudentSelector
          showBackButton={!!selectedStudentId}
          onBackClick={handleBackClick}
          selectedStudentName={selectedStudent?.name || ""}
        />

        {isTeacherOrAdmin && !selectedStudentId && (
          <div className="mt-8">
            <TeacherSpreadsheet onStudentSelect={onStudentSelect} />
          </div>
        )}

        {selectedStudentId && (
          <div className="mt-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteClick(selectedStudent as { id: string, name: string })}
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Student
              </Button>
              
              {selectedStudent?.class_id && (
                <TransferClassButton 
                  studentId={selectedStudent.id} 
                  currentClassId={selectedStudent.class_id} 
                />
              )}
            </div>
            
            <Tabs 
              defaultValue="lesson" 
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
                <TabsTrigger value="lesson" className="flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4" />
                  <span>Current Lesson</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="flex items-center gap-2"
                  onClick={handleViewStats}
                >
                  <ChartBarIcon className="h-4 w-4" />
                  <span>Stats & Reports</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="lesson" className="mt-0">
                <QuranDisplay
                  key={selectedStudentId}
                  currentPage={1}
                  isLoading={false}
                  studentId={selectedStudentId}
                  classId={classId}
                  onDone={() => onStudentSelect("")}
                />
              </TabsContent>
              
              {/* Stats tab content remains empty as we navigate to another page */}
              <TabsContent value="stats"></TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Delete confirmation dialog */}
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent className="max-w-[90%] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DigitalKhattProvider>
  );
};
