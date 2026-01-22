
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import type { Student } from "./types";

interface StudentSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudents: string[];
  onSelectedStudentsChange: (selected: string[]) => void;
  onSave: () => void;
  isLoading: boolean;
  students: Student[];
}

export const StudentSelectionDialog = ({
  open,
  onOpenChange,
  selectedStudents,
  onSelectedStudentsChange,
  onSave,
  isLoading
}: StudentSelectionDialogProps) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('students')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        
        const studentList = data.map((student: any) => ({
          id: student.id,
          name: student.name,
          isLinked: selectedStudents.includes(student.id)
        }));
        
        setAllStudents(studentList);
        setFilteredStudents(studentList);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchStudents();
    }
  }, [open, selectedStudents]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredStudents(
        allStudents.filter(student => 
          student.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredStudents(allStudents);
    }
  }, [searchTerm, allStudents]);

  const toggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      onSelectedStudentsChange(selectedStudents.filter(id => id !== studentId));
    } else {
      onSelectedStudentsChange([...selectedStudents, studentId]);
    }
  };

  const linkedStudents = filteredStudents.filter(s => selectedStudents.includes(s.id));
  const unlinkedStudents = filteredStudents.filter(s => !selectedStudents.includes(s.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Linked Students</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            {linkedStudents.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-sm mb-2 text-blue-600">Linked Students</h3>
                <div className="space-y-3 pl-2">
                  {linkedStudents.map(student => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`linked-${student.id}`}
                        checked={true}
                        onCheckedChange={() => toggleStudent(student.id)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <label
                        htmlFor={`linked-${student.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {student.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-sm mb-2">Available Students</h3>
              <div className="space-y-3 pl-2">
                {unlinkedStudents.length > 0 ? (
                  unlinkedStudents.map(student => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`available-${student.id}`}
                        checked={false}
                        onCheckedChange={() => toggleStudent(student.id)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <label
                        htmlFor={`available-${student.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {student.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic">No more students available</p>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isLoading || loading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
