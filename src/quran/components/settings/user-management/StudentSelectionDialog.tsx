import { ScrollArea } from "@/quran/components/ui/scroll-area";
import { Checkbox } from "@/quran/components/ui/checkbox";
import { Button } from "@/quran/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/quran/components/ui/input";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/quran/components/ui/dialog";
interface Student {
  id: string;
  name: string;
  class_id?: string | null;
  isLinked?: boolean;
}
interface StudentSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  adultStudents: any[];
  selectedStudents: string[];
  onToggleStudent: (studentId: string) => void;
  isUpdating: boolean;
  onSave: () => void;
  filterNoClass?: boolean;
}
export const StudentSelectionDialog = ({
  isOpen,
  onClose,
  students,
  adultStudents,
  selectedStudents,
  onToggleStudent,
  isUpdating,
  onSave,
  filterNoClass = true
}: StudentSelectionDialogProps) => {
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    // Get students that are not adult students
    let filtered = students.filter(student => !adultStudents.some(adult => adult.id === student.id));

    // Filter students with no class if requested
    if (filterNoClass) {
      filtered = filtered.filter(student => !student.class_id);
    }

    // Map to include isLinked property
    filtered = filtered.map(student => ({
      id: student.id,
      name: student.name,
      class_id: student.class_id,
      isLinked: selectedStudents.includes(student.id)
    }));

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredStudents(filtered.filter(student => student.name.toLowerCase().includes(term)));
    } else {
      setFilteredStudents(filtered);
    }
  }, [students, adultStudents, selectedStudents, searchTerm, filterNoClass]);
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {filterNoClass ? "Add Students to Class" : "Link Students to Parent"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {filterNoClass ? "Select students without a class to add to this class." : "Link students to this parent. Students will appear in the parent's dashboard."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <Input placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          {selectedStudents.length > 0 && <div className="mb-4">
              <h3 className="font-medium text-sm mb-2 text-primary">Selected Students</h3>
              <div className="space-y-3 pl-2">
                {filteredStudents.filter(s => selectedStudents.includes(s.id)).sort((a, b) => a.name.localeCompare(b.name)).map(student => <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox id={`selected-${student.id}`} checked={selectedStudents.includes(student.id)} onCheckedChange={() => onToggleStudent(student.id)} className="data-[state=checked]:bg-primary" />
                      <label htmlFor={`selected-${student.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {student.name}
                      </label>
                    </div>)}
              </div>
            </div>}
          
          <div>
            <h3 className="font-medium text-sm mb-2 text-foreground">Available Students</h3>
            {filteredStudents.filter(s => !selectedStudents.includes(s.id)).length === 0 ? <p className="text-sm text-gray-500 italic pl-2">No unassigned students found.</p> : <div className="space-y-3 pl-2">
                {filteredStudents.filter(s => !selectedStudents.includes(s.id)).sort((a, b) => a.name.localeCompare(b.name)).map(student => <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox id={`available-${student.id}`} checked={selectedStudents.includes(student.id)} onCheckedChange={() => onToggleStudent(student.id)} className="data-[state=checked]:bg-primary" />
                      <label htmlFor={`available-${student.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {student.name}
                      </label>
                    </div>)}
              </div>}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isUpdating || selectedStudents.length === 0}>
            {isUpdating ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </> : (filterNoClass ? 'Add to Class' : 'Save Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
