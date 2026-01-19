import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/quran/components/ui/alert-dialog";
import { ScrollArea } from "@/quran/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Input } from "@/quran/components/ui/input";
import { Search } from "lucide-react";
interface StudentRemovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Array<{
    id: string;
    name: string;
  }>;
  onConfirmRemoval: (studentId: string) => void;
}
export const StudentRemovalDialog = ({
  open,
  onOpenChange,
  students,
  onConfirmRemoval
}: StudentRemovalDialogProps) => {
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
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase().trim();
      setFilteredStudents(students.filter(student => student.name.toLowerCase().includes(query)));
    }
  }, [searchQuery, students]);
  return <>
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Student</AlertDialogTitle>
          <AlertDialogDescription>
            Select a student to remove from the class. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200 focus:ring-quran-primary"
          />
        </div>

        <ScrollArea className="h-[200px] rounded-md border border-slate-200 p-4">
          {filteredStudents.length > 0 ? <div className="space-y-2">
            {filteredStudents.map(student => <button key={student.id} onClick={() => setSelectedStudent(student)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedStudent?.id === student.id ? "bg-quran-primary/10 border-quran-primary text-quran-primary shadow-sm" : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50 hover:border-slate-300"}`}>
              <span className="font-medium">{student.name}</span>
            </button>)}
          </div> : <div className="p-2 text-center text-sm text-gray-500">
            No students found
          </div>}
        </ScrollArea>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white hover:bg-slate-100 text-slate-700 border-slate-200">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={!!selectedStudent} onOpenChange={open => !open && setSelectedStudent(null)}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900">Confirm Removal</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Are you sure you want to remove <span className="font-semibold text-red-600">{selectedStudent?.name}</span> from the class? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSelectedStudent(null)} className="bg-white hover:bg-slate-100 text-slate-700 border-slate-200">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            if (selectedStudent) {
              onConfirmRemoval(selectedStudent.id);
              setSelectedStudent(null);
            }
          }} className="bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-600">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
};
