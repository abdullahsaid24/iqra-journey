
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ParentTableRow } from "./ParentTableRow";
import type { ParentTableProps } from "./types";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";

export const ParentTable = ({
  parents,
  onManageStudents,
  onEditEmail,
  onEditPhone,
  onDelete,
}: ParentTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <Input
          type="search"
          placeholder="Search by student name, parent name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-sm"
        />
      </div>
      
      <Table className="border rounded-md">
        <TableHeader className="bg-black">
          <TableRow>
            <TableHead className="font-bold text-white">Email</TableHead>
            <TableHead className="font-bold text-white">Phone Number</TableHead>
            <TableHead className="font-bold text-white">Role</TableHead>
            <TableHead className="font-bold text-white">Students</TableHead>
            <TableHead className="font-bold text-white">Actions</TableHead>
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
              <TableCell colSpan={5} className="text-center py-6">
                {searchQuery ? "No parents found with matching students or details" : "No parents found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
