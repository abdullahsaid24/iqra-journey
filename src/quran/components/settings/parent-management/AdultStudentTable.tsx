
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/quran/components/ui/table";
import { AdultStudentTableRow } from "./AdultStudentTableRow";
import type { AdultStudentTableProps } from "./types";

export const AdultStudentTable = ({
  students,
  onEditEmail,
  onEditPhone,
  onDelete
}: AdultStudentTableProps) => (
  <Table className="border rounded-md border-slate-200">
    <TableHeader className="bg-slate-50">
      <TableRow>
        <TableHead className="font-semibold text-slate-900">Name</TableHead>
        <TableHead className="font-semibold text-slate-900">Email</TableHead>
        <TableHead className="font-semibold text-slate-900">Created At</TableHead>
        <TableHead className="font-semibold text-slate-900">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {students.length === 0 ? (
        <TableRow>
          <TableCell colSpan={4} className="text-center py-8 text-slate-500">
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
