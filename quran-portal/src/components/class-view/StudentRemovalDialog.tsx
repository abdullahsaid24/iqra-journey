import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
        <AlertDialogContent className="bg-neutral-950">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Select a student to remove from the class. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          
          <ScrollArea className="h-[200px] rounded-md border p-4">
            {filteredStudents.length > 0 ? <div className="space-y-2">
                {filteredStudents.map(student => <button key={student.id} onClick={() => setSelectedStudent(student)} className={`w-full rounded-lg border p-3 text-left hover:bg-muted transition-colors ${selectedStudent?.id === student.id ? "bg-blue-100 border-blue-300 shadow-sm" : ""}`}>
                    {student.name}
                  </button>)}
              </div> : <div className="p-2 text-center text-sm text-gray-500">
                No students found
              </div>}
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!selectedStudent} onOpenChange={open => !open && setSelectedStudent(null)}>
        <AlertDialogContent className="bg-neutral-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-950">Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-950">
              Are you sure you want to remove <span className="font-semibold text-red-600">{selectedStudent?.name}</span> from the class? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="bg-transparent">
            <AlertDialogCancel onClick={() => setSelectedStudent(null)} className="bg-neutral-950 hover:bg-neutral-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            if (selectedStudent) {
              onConfirmRemoval(selectedStudent.id);
              setSelectedStudent(null);
            }
          }} className="text-neutral-950">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};