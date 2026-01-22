
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface StudentManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStudent: (firstName: string, lastName: string) => void;
  classId: string;
}

export function StudentManagementModal({
  open,
  onOpenChange,
  onAddStudent,
  classId,
}: StudentManagementModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Fetch available students (those with no class or in different classes)
  const { data: availableStudents, isLoading } = useQuery({
    queryKey: ['available-students', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .or(`class_id.is.null,class_id.neq.${classId}`)
        .order('first_name');

      if (error) {
        console.error('Error fetching available students:', error);
        throw error;
      }

      return data || [];
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error("Please select a student");
      return;
    }

    const student = availableStudents?.find(s => s.id === selectedStudentId);
    if (student) {
      onAddStudent(student.first_name || '', student.last_name || '');
      setSelectedStudentId("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Existing Student to Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              {isLoading ? (
                <div>Loading available students...</div>
              ) : (
                <Select
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {`${student.first_name || ''} ${student.last_name || ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add Student</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
