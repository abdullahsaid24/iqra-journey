import { Button } from "@/quran/components/ui/button";
import { TableRow, TableCell } from "@/quran/components/ui/table";
import { Mail, Phone, Trash2 } from "lucide-react";
import type { AdultStudent } from "./types";
interface AdultStudentTableRowProps {
  student: AdultStudent;
  onEditEmail: (userId: string, email: string) => void;
  onEditPhone: (userId: string, phoneNumber: string) => void;
  onDelete: (userId: string) => void;
}
export const AdultStudentTableRow = ({
  student,
  onEditEmail,
  onEditPhone,
  onDelete
}: AdultStudentTableRowProps) => {
  const displayName = student.first_name && student.last_name ? `${student.first_name} ${student.last_name}` : student.email?.split('@')[0] || 'Unknown';
  return <TableRow className="hover:bg-slate-50">
    <TableCell className="font-medium text-slate-900">{displayName}</TableCell>
    <TableCell className="text-slate-600">{student.email}</TableCell>
    <TableCell className="text-slate-600">
      {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'Unknown'}
    </TableCell>
    <TableCell>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEditEmail(student.id, student.email || '')} className="flex items-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200">
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEditPhone(student.id, student.phone_number || '')} className="flex items-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200">
          <Phone className="mr-2 h-4 w-4" />
          Phone
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(student.id)} className="flex items-center">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </TableCell>
  </TableRow>;
};
