
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdultStudentTableRow } from "./AdultStudentTableRow";
import type { AdultStudentTableProps } from "./types";

export const AdultStudentTable = ({ 
  students, 
  onEditEmail, 
  onEditPhone,
  onDelete 
}: AdultStudentTableProps) => (
  <Table className="border rounded-md">
    <TableHeader className="bg-zinc-800">
      <TableRow>
        <TableHead className="font-bold text-white">Name</TableHead>
        <TableHead className="font-bold text-white">Email</TableHead>
        <TableHead className="font-bold text-white">Created At</TableHead>
        <TableHead className="font-bold text-white">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {students.length === 0 ? (
        <TableRow className="bg-black">
          <TableCell colSpan={4} className="text-center py-8 text-gray-400">
            No adult students found
          </TableCell>
        </TableRow>
      ) : (
        students.map((student) => (
          <AdultStudentTableRow 
            key={student.id} 
            student={student} 
            onEditEmail={onEditEmail}
            onEditPhone={onEditPhone}
            onDelete={onDelete}
          />
        ))
      )}
    </TableBody>
  </Table>
);
