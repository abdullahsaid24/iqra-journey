import { RefreshCw, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: any[]; // Accept any class type to avoid type issues
  currentClassId: string;
  selectedClassId: string;
  onClassSelect: (value: string) => void;
  onTransfer: () => Promise<void>;
  students?: Array<{
    id: string;
    name: string;
  }>;
  onStudentSelect?: (studentId: string) => void;
}
export const TransferDialog = ({
  open,
  onOpenChange,
  classes,
  currentClassId,
  selectedClassId,
  onClassSelect,
  onTransfer,
  students,
  onStudentSelect
}: TransferDialogProps) => {
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  useEffect(() => {
    if (students) {
      if (searchQuery.trim() === "") {
        setFilteredStudents(students);
      } else {
        const query = searchQuery.toLowerCase().trim();
        setFilteredStudents(students.filter(student => student.name.toLowerCase().includes(query)));
      }
    }
  }, [searchQuery, students]);
  const handleStudentSelect = (student: {
    id: string;
    name: string;
  }) => {
    setSelectedStudent(student);
    if (onStudentSelect) {
      onStudentSelect(student.id);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950">
        <DialogHeader>
          <DialogTitle>Transfer Student</DialogTitle>
        </DialogHeader>
        
        {students && students.length > 0 && onStudentSelect && <div className="grid gap-4 py-2">
            <h3 className="text-sm font-medium">Select Student</h3>
            
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            
            <ScrollArea className="h-[150px] rounded-md border p-2">
              {filteredStudents.length > 0 ? <div className="space-y-1">
                  {filteredStudents.map(student => <button key={student.id} onClick={() => handleStudentSelect(student)} className={`w-full rounded-lg border p-2 text-left hover:bg-muted transition-colors ${selectedStudent?.id === student.id ? "bg-blue-100 border-blue-300 shadow-sm" : ""}`}>
                      {student.name}
                    </button>)}
                </div> : <div className="p-2 text-center text-sm text-gray-500">
                  No students found
                </div>}
            </ScrollArea>
          </div>}
        
        <div className="grid gap-4 py-2">
          <h3 className="text-sm font-medium">Select Target Class</h3>
          <Select value={selectedClassId} onValueChange={onClassSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select target class" />
            </SelectTrigger>
            <SelectContent>
              {classes.filter(c => c.id !== currentClassId).map(c => <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onTransfer} disabled={!selectedStudent && onStudentSelect !== undefined || !selectedClassId}>
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};