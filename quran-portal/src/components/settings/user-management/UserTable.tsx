import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, SortingState, getSortedRowModel, ColumnFiltersState, getFilteredRowModel, VisibilityState } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Loader2, Users, Mail, Phone, Trash2, MoreVertical, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Student } from "@/types/student";
import { UserRole } from "@/components/settings/user-management/CreateUserFormState";
import { EmailEditDialog } from "./EmailEditDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  created_at: string;
}
const phoneSchema = z.object({
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits"
  }).regex(/^\+?[0-9]+$/, {
    message: "Phone number can only contain digits and optional + prefix"
  })
});
interface ExtraColumn {
  header: string;
  cell: (user: any) => React.ReactNode;
}
interface UserTableProps {
  users?: User[];
  extraColumns?: ExtraColumn[];
  showAllRows?: boolean;
}
export const UserTable = ({
  users = [],
  extraColumns = [],
  showAllRows = false
}: UserTableProps) => {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForEmailEdit, setSelectedUserForEmailEdit] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [selectedStudentForPhone, setSelectedStudentForPhone] = useState<string | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingEmail, setEditingEmail] = useState("");
  
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: ""
    }
  });
  const {
    data: studentsData = [],
    isLoading: isLoadingStudentData
  } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const {
        data: studentsData,
        error
      } = await supabase.from("students").select("id, name");
      if (error) throw error;
      return studentsData || [];
    }
  });
  const baseColumns: ColumnDef<User>[] = [{
    accessorKey: "email",
    header: "Email"
  }, {
    accessorKey: "role",
    header: "Role"
  }, {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({
      row
    }) => {
      const createdAt = row.original.created_at;
      return new Date(createdAt).toLocaleDateString();
    }
  }, {
    id: "actions",
    header: "Actions",
    cell: ({
      row
    }) => {
      const user = row.original;
      return <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleShowEmailDialog(user)} disabled={isLoading}>
              <Mail className="mr-2 h-4 w-4" />
              Edit Email
            </Button>
            {user.role === "parent" && <Button variant="outline" size="sm" onClick={() => handleShowPhoneDialog(user)} disabled={isLoading}>
                <Phone className="mr-2 h-4 w-4" />
                Assign Student
              </Button>}
            <Button variant="destructive" size="sm" onClick={() => deleteUser(user.id)} disabled={isLoading} className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>;
    }
  }];
  const columns = [...baseColumns, ...extraColumns.map(col => ({
    id: col.header,
    header: col.header,
    cell: ({
      row
    }) => col.cell(row.original)
  }))];
  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    },
    initialState: {
      pagination: {
        pageSize: showAllRows ? 1000 : 10,
        pageIndex: 0
      }
    }
  });
  const assignParentToStudent = async (parentId: string, studentId: string, phoneNumber: string) => {
    try {
      setIsProcessingAction(true);
      const {
        data: existingLinks,
        error: checkError
      } = await supabase.from("parent_student_links").select("*").eq("parent_user_id", parentId).eq("student_id", studentId);
      if (checkError) throw checkError;
      if (existingLinks && existingLinks.length > 0) {
        toast.info("This student is already linked to this parent");
        setIsProcessingAction(false);
        return;
      }
      const {
        error: linkError
      } = await supabase.from("parent_student_links").insert({
        parent_user_id: parentId,
        student_id: studentId,
        phone_number: phoneNumber
      });
      if (linkError) throw linkError;
      toast.success("Successfully linked parent to student");
      phoneForm.reset();
      setShowPhoneDialog(false);
      setSelectedUser(null);
      setSelectedStudentForPhone(null);
      queryClient.invalidateQueries({
        queryKey: ["parents"]
      });
    } catch (error: any) {
      console.error("Error linking parent to student:", error);
      toast.error(`Failed to link parent to student: ${error.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };
  const onPhoneSubmit = (values: z.infer<typeof phoneSchema>) => {
    if (!selectedUser || !selectedStudentForPhone) {
      toast.error("Missing user or student selection");
      return;
    }
    assignParentToStudent(selectedUser.id, selectedStudentForPhone, values.phone);
  };
  const handleShowPhoneDialog = (user: User) => {
    setSelectedUser(user);
    setShowPhoneDialog(true);
  };

  const handleShowEmailDialog = (user: User) => {
    setSelectedUserForEmailEdit(user);
    setNewEmail(user.email);
    setShowEmailDialog(true);
  };

  const handleEmailChange = (email: string) => {
    setNewEmail(email);
  };

  const handleSaveEmail = async () => {
    if (!selectedUserForEmailEdit || !newEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (newEmail === selectedUserForEmailEdit.email) {
      toast.info("Email address is the same as current");
      setShowEmailDialog(false);
      return;
    }

    try {
      setIsUpdatingEmail(true);
      
      const { error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateUserEmail",
          userId: selectedUserForEmailEdit.id,
          email: newEmail
        }
      });

      if (error) {
        throw error;
      }

      toast.success("Email updated successfully");
      setShowEmailDialog(false);
      setSelectedUserForEmailEdit(null);
      setNewEmail("");
      refreshUserList();
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast.error(`Failed to update email: ${error.message}`);
    } finally {
      setIsUpdatingEmail(false);
    }
  };
  const assignRoleToUser = async (userId: string, role: UserRole) => {
    try {
      setIsLoading(true);
      const {
        error
      } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "update_role",
          userId,
          role
        }
      });
      if (error) {
        toast.error(`Failed to assign role: ${error.message}`);
      } else {
        toast.success(`User role updated to ${role}`);
        refreshUserList();
      }
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast.error(`Failed to assign role: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const refreshUserList = () => {
    queryClient.invalidateQueries({
      queryKey: ['users']
    });
  };
  const listTeachers = async (): Promise<{
    id: string;
    name: string;
  }[]> => {
    try {
      const {
        data: teacherRoles,
        error: rolesError
      } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
      if (rolesError) throw rolesError;
      if (!teacherRoles || teacherRoles.length === 0) {
        return [];
      }
      const teacherIds = teacherRoles.map(teacher => teacher.user_id);
      const {
        data,
        error
      } = await supabase.functions.invoke("list-users", {
        body: {
          userIds: teacherIds
        }
      });
      if (error) throw error;
      if (!data || !data.users) {
        return [];
      }
      return data.users.map((user: any) => ({
        id: user.id,
        name: user.email.split('@')[0]
      }));
    } catch (error) {
      console.error("Error listing teachers:", error);
      return [];
    }
  };
  const handleSelectStudent = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStudentForPhone(event.target.value);
  };
  const listParents = async () => {
    try {
      const {
        data: parentRoles,
        error: rolesError
      } = await supabase.from("user_roles").select("user_id").eq("role", "parent");
      if (rolesError) throw rolesError;
      if (!parentRoles || parentRoles.length === 0) {
        return [];
      }
      const parentIds = parentRoles.map(parent => parent.user_id);
      const {
        data,
        error
      } = await supabase.functions.invoke("get-parent-users", {
        body: {
          parentIds
        }
      });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error listing parents:", error);
      return [];
    }
  };
  const deleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      console.log('Starting user deletion for:', userId);
      
      // Let the edge function handle ALL deletions
      const { data, error: functionError } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'deleteUser',
          userId: userId
        }
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw functionError;
      }

      if (data?.error) {
        console.error('Deletion failed:', data.error);
        throw new Error(data.error);
      }

      console.log('User deletion successful:', data);
      
      toast.success("User deleted successfully", {
        description: data?.message || "User and all related data removed",
      });

      refreshUserList();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error("Failed to delete user", {
        description: error.message || "An error occurred while deleting the user",
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };
  
  const handleEmailUpdate = async () => {
    if (!editingUser || !editingEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (editingEmail === editingUser.email) {
      toast.info("Email address is the same as current");
      setEmailDialogOpen(false);
      return;
    }

    try {
      setIsUpdatingEmail(true);
      
      const { error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateUserEmail",
          userId: editingUser.id,
          email: editingEmail
        }
      });

      if (error) {
        throw error;
      }

      toast.success("Email updated successfully");
      setEmailDialogOpen(false);
      setEditingUser(null);
      setEditingEmail("");
      refreshUserList();
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast.error(`Failed to update email: ${error.message}`);
    } finally {
      setIsUpdatingEmail(false);
    }
  };
  return <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search users by email or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      
      {isMobile ? (
        /* Mobile Card Layout */
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{user.email}</p>
                    <Badge variant="outline" className="mt-1 capitalize text-xs">
                      {user.role}
                    </Badge>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingUser(user);
                          setEditingEmail(user.email);
                          setEmailDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Email
                      </DropdownMenuItem>
                      {user.role === "parent" && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setPhoneDialogOpen(true);
                          }}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Assign Student
                        </DropdownMenuItem>
                      )}
                      {user.role !== 'admin' && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setUserToDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop Table Layout */
        <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.length > 0 ? filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell className="capitalize">{user.role}</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingUser(user);
                      setEditingEmail(user.email);
                      setEmailDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  {user.role === "parent" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setPhoneDialogOpen(true);
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Student
                    </Button>
                  )}
                  {user.role !== 'admin' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setUserToDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
        </>
      )}
      
      
      <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Student to Parent</DialogTitle>
            <DialogDescription>
              Select a student to assign to this parent and enter their phone
              number.
            </DialogDescription>
          </DialogHeader>
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              <FormField control={phoneForm.control} name="phone" render={({
              field
            }) => <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+15551234567" {...field} />
                    </FormControl>
                    <FormDescription>
                      Please enter the parent's phone number.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>} />
              <div className="space-y-2">
                <Label htmlFor="student">Select Student</Label>
                <select id="student" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" onChange={handleSelectStudent} defaultValue="">
                  <option value="" disabled>
                    Select a student
                  </option>
                  {studentsData.map(student => <option key={student.id} value={student.id}>
                      {student.name}
                    </option>)}
                </select>
              </div>
              <Button type="submit" disabled={isProcessingAction}>
                {isProcessingAction ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </> : "Assign Student"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <EmailEditDialog
        isOpen={emailDialogOpen}
        onClose={() => {
          setEmailDialogOpen(false);
          setEditingUser(null);
          setEditingEmail("");
        }}
        email={editingEmail}
        onChange={setEditingEmail}
        isUpdating={isUpdatingEmail}
        onSave={handleEmailUpdate}
      />
      
      <DeleteUserDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        isDeleting={isDeleting}
        onConfirm={() => userToDelete && deleteUser(userToDelete)}
      />
    </div>;
};