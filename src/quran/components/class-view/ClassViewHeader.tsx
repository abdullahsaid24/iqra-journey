import { Button } from "@/quran/components/ui/button";
import { WeekdayAttendance } from "./WeekdayAttendance";
import { Home, Trash2, MoveRight, UserPlus, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClassWithStudents } from "@/quran/types/dashboard";
import { useState } from "react";
import { StudentRemovalDialog } from "./StudentRemovalDialog";
import { TransferDialog } from "../student/TransferDialog";
import { ClassMessageDialog } from "./ClassMessageDialog";
import { useClasses } from "@/quran/hooks/useClasses";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { StudentSelectionDialog } from "@/quran/components/settings/user-management/StudentSelectionDialog";
import { useStudents } from "@/quran/components/settings/user-management/hooks/useStudents";
import { NotifyAbsentButton } from "@/quran/components/attendance/NotifyAbsentButton";
interface ClassViewHeaderProps {
  classData: ClassWithStudents;
  classId: string;
  onRemoveStudents?: () => void;
  onManageTeachers?: () => void;
  showTeacherManagement?: boolean;
  students?: Array<{
    id: string;
    name: string;
  }>;
}
export const ClassViewHeader = ({
  classData,
  classId,
  onRemoveStudents,
  onManageTeachers,
  showTeacherManagement,
  students = []
}: ClassViewHeaderProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRemovalDialogOpen, setIsRemovalDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isStudentSelectionOpen, setIsStudentSelectionOpen] = useState(false);
  const {
    data: classes = [],
    isLoading: isClassesLoading
  } = useClasses("admin");
  const {
    data: allStudents = []
  } = useStudents();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isUpdatingStudents, setIsUpdatingStudents] = useState(false);
  const transferMutation = useMutation({
    mutationFn: async ({
      studentId,
      targetClassId
    }: {
      studentId: string;
      targetClassId: string;
    }) => {
      const {
        data,
        error
      } = await supabase.from('students').update({
        class_id: targetClassId,
        removed_from_class_id: null
      }).eq('id', studentId).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['class', classId]
      });
      queryClient.invalidateQueries({
        queryKey: ['class-students', classId]
      });
      if (selectedClassId) {
        queryClient.invalidateQueries({
          queryKey: ['class', selectedClassId]
        });
        queryClient.invalidateQueries({
          queryKey: ['class-students', selectedClassId]
        });
      }
      toast.success("Student transferred to new class successfully");
      setIsTransferDialogOpen(false);
      setSelectedStudentId("");
    },
    onError: error => {
      console.error('Error transferring student:', error);
      toast.error("Failed to transfer student to new class");
    }
  });

  // Modified to use update instead of delete.
  // Records which class the student was removed from so that re-adding them
  // later reconnects the correct record instead of an arbitrary same-name one.
  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const {
        data,
        error
      } = await supabase.from('students').update({
        class_id: null,
        removed_from_class_id: classId
      }).eq('id', studentId).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['class', classId]
      });
      queryClient.invalidateQueries({
        queryKey: ['class-students', classId]
      });
      toast.success("Student has been removed from the class");
      setIsRemovalDialogOpen(false);
    },
    onError: error => {
      console.error('Error removing student from class:', error);
      toast.error("Failed to remove student from the class");
    }
  });

  // Enhanced add student mutation with robust linked class enrollment
  const addStudentMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      console.log('Starting addStudentMutation with studentIds:', studentIds);

      // Step A: Update the students' class_id to the current class and reset consecutive absences
      const { data: updatedStudents, error } = await supabase
        .from('students')
        .update({ class_id: classId, consecutive_absences: 0, removed_from_class_id: null })
        .in('id', studentIds)
        .select('id, name, first_name, last_name, email, absence_level, failure_level, consecutive_absences, last_lesson_status');

      if (error) {
        console.error('Error updating students class_id:', error);
        throw error;
      }
      if (!updatedStudents || updatedStudents.length === 0) {
        console.error('No students were updated');
        throw new Error('No students were updated');
      }

      console.log('Successfully updated students:', updatedStudents);
      const updatedCount = updatedStudents.length;

      // Each child is a single row, parked on the weekend side of a linked pair
      // and resolved into both classes at read time. There is no counterpart row
      // to create, reconnect or keep in sync.
      const createdCount = 0;
      const skippedCount = 0;
      const failedCount = 0;
      const linkedClassId: string | null = null;

      console.log('Final counts:', { updatedCount, createdCount, skippedCount, failedCount });
      return { updatedStudents, updatedCount, createdCount, skippedCount, failedCount, linkedClassId };
    },
    onSuccess: ({ updatedCount, createdCount, skippedCount, failedCount, linkedClassId }) => {
      // Invalidate queries for current class
      queryClient.invalidateQueries({ queryKey: ['class', classId] });
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] });

      // Invalidate queries for linked class if it exists
      if (linkedClassId) {
        queryClient.invalidateQueries({ queryKey: ['class', linkedClassId] });
        queryClient.invalidateQueries({ queryKey: ['class-students', linkedClassId] });
      }

      // Create detailed success message
      let successMessage = `Added ${updatedCount} students`;
      if (linkedClassId) {
        const parts = [];
        if (createdCount > 0) parts.push(`${createdCount} created in linked class`);
        if (skippedCount > 0) parts.push(`${skippedCount} already existed`);
        if (failedCount > 0) parts.push(`${failedCount} failed`);

        if (parts.length > 0) {
          successMessage += ` (${parts.join(', ')})`;
        }
      }

      toast.success(successMessage);
      setIsStudentSelectionOpen(false);
      setSelectedStudents([]);
      setIsUpdatingStudents(false);
    },
    onError: error => {
      console.error('Error adding students to class:', error);
      toast.error("Failed to add students to class");
      setIsUpdatingStudents(false);
    }
  });
  const handleTransfer = async () => {
    if (!selectedClassId || !selectedStudentId) {
      toast.error("Please select both a student and a target class");
      return;
    }
    await transferMutation.mutateAsync({
      studentId: selectedStudentId,
      targetClassId: selectedClassId
    });
  };
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
  };
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };
  const handleSaveStudentSelection = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    setIsUpdatingStudents(true);
    await addStudentMutation.mutateAsync(selectedStudents);
  };
  const openAddStudentDialog = () => {
    setSelectedStudents([]);
    setIsStudentSelectionOpen(true);
  };

  // Filter out the current class from available classes for transfer
  const availableClasses = classes.filter(c => c.id !== classId);

  // Get current students' IDs for filtering
  const currentStudentIds = (students || []).map(student => student.id);

  // Log the number of students without classes
  const studentsWithoutClass = allStudents.filter(student => !student.class_id);
  console.log(`Total students: ${allStudents.length}`);
  console.log(`Students without class: ${studentsWithoutClass.length}`);
  console.log('Students without class:', studentsWithoutClass);
  return <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" className="text-white hover:text-quran-primary" onClick={() => navigate('/quran/dashboard')}>
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </div>
      <h1 className="text-2xl font-semibold">{classData?.name}</h1>
      <p className="text-gray-500">{classData?.students?.length} students</p>
    </div>
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white border-blue-500 flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3" onClick={openAddStudentDialog}>
        <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Add Student</span>
        <span className="sm:hidden">Add</span>
      </Button>

      <Button variant="outline" size="sm" className="bg-green-50 text-green-600 hover:bg-green-500 hover:text-white border-green-500 flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3" onClick={() => setIsMessageDialogOpen(true)}>
        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Send Message</span>
        <span className="sm:hidden">Message</span>
      </Button>

      <NotifyAbsentButton classId={classId} />

      {students && students.length > 0 && <>
        <Button variant="destructive" size="sm" onClick={() => setIsRemovalDialogOpen(true)} className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-neutral-50 text-xs sm:text-sm px-2 sm:px-3">
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Remove Student</span>
          <span className="sm:hidden">Remove</span>
        </Button>

        {availableClasses.length > 0 && <Button variant="outline" size="sm" className="text-yellow-600 hover:bg-yellow-500 hover:text-white border-yellow-500 flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3" onClick={() => setIsTransferDialogOpen(true)}>
          <MoveRight className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Transfer Student</span>
          <span className="sm:hidden">Transfer</span>
        </Button>}
      </>}

      <WeekdayAttendance classId={classId} />

    </div>

    {/* Student Removal Dialog */}
    <StudentRemovalDialog open={isRemovalDialogOpen} onOpenChange={setIsRemovalDialogOpen} students={students || []} onConfirmRemoval={studentId => removeStudentMutation.mutate(studentId)} />

    {/* Transfer Dialog */}
    <TransferDialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen} classes={availableClasses} currentClassId={classId} selectedClassId={selectedClassId} onClassSelect={setSelectedClassId} onTransfer={handleTransfer} students={students} onStudentSelect={handleStudentSelect} />

    {/* Class Message Dialog */}
    <ClassMessageDialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen} classId={classId} className={classData?.name || 'Class'} />

    {/* Add Student Dialog */}
    <StudentSelectionDialog isOpen={isStudentSelectionOpen} onClose={() => setIsStudentSelectionOpen(false)} students={allStudents} adultStudents={[]} // Removed adult students filtering
      selectedStudents={selectedStudents} onToggleStudent={handleToggleStudent} isUpdating={isUpdatingStudents} onSave={handleSaveStudentSelection} filterNoClass={true} />
  </div>;
};
