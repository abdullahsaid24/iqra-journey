import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { Button } from "@/quran/components/ui/button";
import { Input } from "@/quran/components/ui/input";
import { Label } from "@/quran/components/ui/label";
import { toast } from "sonner";
import { Trash2, Edit, Loader2 } from "lucide-react";
import { useClasses } from "@/quran/hooks/useClasses";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/quran/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/quran/components/ui/table";
import type { Student } from "@/quran/types/student";

interface StudentUsersTabProps {
  students: Student[];
  searchQuery?: string;
}

export const StudentUsersTab = ({ students, searchQuery = "" }: StudentUsersTabProps) => {
  const queryClient = useQueryClient();
  const { data: classes = [] } = useClasses("admin");
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editedName, setEditedName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    return student.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleClassChange = async (studentId: string, newClassId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ class_id: newClassId === "none" ? null : newClassId })
        .eq('id', studentId);
        
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['class-students'] });
      toast.success("Class updated successfully");
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error("Failed to update class");
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setEditedName(student.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateName = async () => {
    if (!editingStudent) return;
    if (!editedName.trim()) {
      toast.error("Student name cannot be empty");
      return;
    }
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ name: editedName.trim() })
        .eq('id', editingStudent.id);
        
      if (error) throw error;
      
      toast.success("Student name updated successfully");
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsEditDialogOpen(false);
      setEditingStudent(null);
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.message || "Failed to update student name");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedStudentId) return;
    
    setIsDeleting(true);
    try {
      // First delete parent_student_links manually if they exist to prevent foreign key errors (if not cascading)
      await supabase.from('parent_student_links').delete().eq('student_id', selectedStudentId);
      
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', selectedStudentId);
        
      if (error) throw error;
      
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['class-students'] });
      setIsDeleteDialogOpen(false);
      setSelectedStudentId(null);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Table className="border rounded-md border-slate-200">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-900">Name</TableHead>
            <TableHead className="font-semibold text-slate-900">Class</TableHead>
            <TableHead className="font-semibold text-slate-900 w-[200px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const studentClass = classes.find((c: any) => c.id === student.class_id);
              return (
                <TableRow key={student.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">
                    {student.name}
                  </TableCell>
                  <TableCell>
                    <select
                      className="w-full max-w-[200px] rounded-md border-slate-200 text-sm p-2 focus:ring-quran-primary focus:border-quran-primary"
                      value={student.class_id || "none"}
                      onChange={(e) => handleClassChange(student.id, e.target.value)}
                    >
                      <option value="none">No Class Assigned</option>
                      {classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(student)}
                        className="flex items-center text-slate-700 hover:bg-slate-100 border-slate-200"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Name
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(student.id)}
                        className="flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-6 text-slate-500">
                {searchQuery ? "No students found matching your search." : "No students found."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirmed}
        isDeleting={isDeleting}
      />
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Student Name</DialogTitle>
            <DialogDescription>
              Update the name for this student. This will reflect across the entire application.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Full Name</Label>
              <Input
                id="student-name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Student Name"
                className="w-full"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateName} disabled={isUpdating || !editedName.trim()}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
