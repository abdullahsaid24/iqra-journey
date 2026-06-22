
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/quran/components/ui/table";
import { ParentTableRow } from "./ParentTableRow";
import type { ParentTableProps } from "./types";
import { Input } from "@/quran/components/ui/input";
import { Search } from "lucide-react";

export const ParentTable = ({
  parents,
  onManageStudents,
  onEditEmail,
  onEditPhone,
  onDelete,
  searchQuery = "",
}: ParentTableProps) => {
  // Filter parents based on student name search
  const filteredParents = parents.filter(parent => {
    const studentNames = parent.students?.map(s => s.name.toLowerCase()) || [];
    const parentName = `${parent.first_name?.toLowerCase() || ''} ${parent.last_name?.toLowerCase() || ''}`;
    const parentEmail = parent.email?.toLowerCase() || '';

    if (searchQuery === "") return true;

    // Search by student name, parent name, or parent email
    return studentNames.some(name => name.includes(searchQuery.toLowerCase())) ||
      parentName.includes(searchQuery.toLowerCase()) ||
      parentEmail.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <Table className="border rounded-md border-slate-200">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-900">Email</TableHead>
            <TableHead className="font-semibold text-slate-900">Phone Number</TableHead>
            <TableHead className="font-semibold text-slate-900">Role</TableHead>
            <TableHead className="font-semibold text-slate-900">Students</TableHead>
            <TableHead className="font-semibold text-slate-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredParents.length > 0 ? (
            filteredParents.map((parent) => (
              <ParentTableRow
                key={parent.id}
                parent={parent}
                onManageStudents={onManageStudents}
                onEditEmail={onEditEmail}
                onEditPhone={onEditPhone}
                onDelete={onDelete}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                {searchQuery ? "No parents found with matching students or details" : "No parents found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
