import { RefreshCw, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/quran/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/quran/components/ui/select";
import { Button } from "@/quran/components/ui/button";
import { ScrollArea } from "@/quran/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Input } from "@/quran/components/ui/input";
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
    <DialogContent className="bg-white">
      <DialogHeader>
        <DialogTitle className="text-slate-900">Transfer Student</DialogTitle>
      </DialogHeader>

      {students && students.length > 0 && onStudentSelect && <div className="grid gap-4 py-2">
        <h3 className="text-sm font-medium text-slate-900">Select Student</h3>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200 focus:ring-quran-primary"
          />
        </div>

        <ScrollArea className="h-[150px] rounded-md border border-slate-200 p-2">
          {filteredStudents.length > 0 ? <div className="space-y-1">
            {filteredStudents.map(student => <button key={student.id} onClick={() => handleStudentSelect(student)} className={`w-full rounded-lg border p-2 text-left transition-colors ${selectedStudent?.id === student.id ? "bg-quran-primary/10 border-quran-primary text-quran-primary shadow-sm" : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50 hover:border-slate-300"}`}>
              <span className="font-medium">{student.name}</span>
            </button>)}
          </div> : <div className="p-2 text-center text-sm text-gray-500">
            No students found
          </div>}
        </ScrollArea>
      </div>}

      <div className="grid gap-4 py-2">
        <h3 className="text-sm font-medium text-slate-900">Select Target Class</h3>
        <Select value={selectedClassId} onValueChange={onClassSelect}>
          <SelectTrigger className="bg-white border-slate-200 text-slate-900">
            <SelectValue placeholder="Select target class" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {classes.filter(c => c.id !== currentClassId).map(c => <SelectItem key={c.id} value={c.id} className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 cursor-pointer">
              {c.name}
            </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50">Cancel</Button>
        </DialogClose>
        <Button
          onClick={onTransfer}
          disabled={!selectedStudent && onStudentSelect !== undefined || !selectedClassId}
          className="bg-quran-primary text-white hover:bg-quran-primary/90"
        >
          Transfer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
};
