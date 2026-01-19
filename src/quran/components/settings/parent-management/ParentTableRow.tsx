import { TableRow, TableCell } from "@/quran/components/ui/table";
import { Button } from "@/quran/components/ui/button";
import { Users, Phone, Trash2, Mail } from "lucide-react";
import { Badge } from "@/quran/components/ui/badge";
import type { Parent, Student } from "./types";
interface ParentTableRowProps {
  parent: Parent;
  onManageStudents: (parentId: string, students: Student[]) => void;
  onEditEmail: (parentId: string, email: string) => void;
  onEditPhone: (parentId: string, phoneNumber: string) => void;
  onDelete: (parentId: string) => void;
}
export const ParentTableRow = ({
  parent,
  onManageStudents,
  onEditEmail,
  onEditPhone,
  onDelete
}: ParentTableRowProps) => {
  const students = Array.isArray(parent.students) ? parent.students : [];
  return <TableRow className="hover:bg-slate-50">
    <TableCell className="font-medium text-slate-900">{parent.email}</TableCell>
    <TableCell className="text-slate-600">{parent.phone_number || 'No Phone'}</TableCell>
    <TableCell className="text-slate-600">Parent</TableCell>
    <TableCell className="max-w-md overflow-x-auto">
      <div className="flex flex-wrap gap-2">
        {students.length > 0 ? students.map(student => <Badge key={student.id} variant="outline" className="text-quran-primary whitespace-nowrap bg-quran-primary/10 border-quran-primary/20">
          {student.name || student.email || student.id}
        </Badge>) : <span className="text-slate-400 text-sm italic">No students linked</span>}
      </div>
    </TableCell>
    <TableCell>
      <div className="flex space-x-2">
        <Button size="sm" variant="outline" onClick={() => onEditEmail(parent.id, parent.email || '')} title="Edit email address" className="flex items-center text-slate-700 hover:bg-slate-100 border-slate-200">
          <Mail className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onManageStudents(parent.id, students)} title="Assign students to parent" className="flex items-center text-slate-700 hover:bg-slate-100 border-slate-200">
          <Users className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEditPhone(parent.id, parent.phone_number || '')} title="Edit phone number" className="flex items-center text-slate-700 hover:bg-slate-100 border-slate-200">
          <Phone className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(parent.id)} className="flex items-center px-3 py-2 h-9 hover:bg-red-600" title="Delete parent account">
          <Trash2 className="h-4 w-4 mr-1" />
          <span>Delete</span>
        </Button>
      </div>
    </TableCell>
  </TableRow>;
};
