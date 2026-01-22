
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Users, Mail, Loader2 } from "lucide-react";

interface Parent {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  students: {
    id: string;
    name: string;
  }[];
}

interface Student {
  id: string;
  name: string;
}

export const ParentManagementForm = () => {
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Fetch all parents with their linked students using the Edge Function
  const { 
    data: parents = [], 
    isLoading: isLoadingParents,
    refetch: refetchParents,
    error: parentsError
  } = useQuery({
    queryKey: ['parents'],
    queryFn: async () => {
      try {
        console.log('Fetching parent users...');
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-parent-users`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Cache-Control': 'no-cache',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Failed to fetch parents:', errorData);
          throw new Error(`Failed to fetch parents: ${errorData}`);
        }

        const data = await response.json();
        console.log(`Successfully fetched ${data.length} parents`);
        return data;
      } catch (error) {
        console.error("Error fetching parents:", error);
        throw error;
      }
    },
    staleTime: 60000,
  });

  // Fetch all students for the dialog
  const { 
    data: students = [], 
    isLoading: isLoadingStudents 
  } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      console.log('Fetching students for parent management...');
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} students`);
      return data || [];
    }
  });

  const handleUpdateStudents = async () => {
    if (!selectedParentId) {
      toast.error("Please select a parent first");
      return;
    }

    try {
      // Delete existing links
      console.log(`Deleting existing links for parent ${selectedParentId}`);
      const { error: deleteError } = await supabase
        .from('parent_student_links')
        .delete()
        .eq('parent_user_id', selectedParentId);

      if (deleteError) {
        console.error('Error deleting parent links:', deleteError);
        throw deleteError;
      }

      // Create new links
      if (selectedStudents.length > 0) {
        console.log(`Creating ${selectedStudents.length} new links for parent ${selectedParentId}`);
        const newLinks = selectedStudents.map(studentId => ({
          parent_user_id: selectedParentId,
          student_id: studentId
        }));

        const { error: insertError } = await supabase
          .from('parent_student_links')
          .insert(newLinks);

        if (insertError) {
          console.error('Error inserting parent links:', insertError);
          throw insertError;
        }
      }

      toast.success("Student links updated successfully");
      setIsDialogOpen(false);
      refetchParents();
    } catch (error: any) {
      toast.error(error.message || "Failed to update student links");
    }
  };

  const handleUpdateEmail = async () => {
    if (!selectedParentId || !editingEmail) {
      toast.error("Parent ID and email are required");
      return;
    }

    setIsUpdatingEmail(true);

    try {
      // Update the user's email in Supabase Auth
      console.log(`Updating email for user ${selectedParentId} to ${editingEmail}`);
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'updateUserEmail',
          userId: selectedParentId,
          email: editingEmail
        }
      });

      if (error) {
        console.error('Error updating user email:', error);
        throw error;
      }

      toast.success("Email updated successfully");
      setIsEmailDialogOpen(false);
      refetchParents();
    } catch (error: any) {
      console.error('Error in handleUpdateEmail:', error);
      toast.error(error.message || "Failed to update email");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const openStudentDialog = (parentId: string, currentStudents: any[]) => {
    setSelectedParentId(parentId);
    setSelectedStudents(currentStudents.map(s => s.id));
    setIsDialogOpen(true);
  };

  const openEmailDialog = (parentId: string, email: string) => {
    setSelectedParentId(parentId);
    setEditingEmail(email);
    setIsEmailDialogOpen(true);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Error handling for parent data fetch issues
  if (parentsError) {
    console.error('Error in parent data fetch:', parentsError);
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">Parent Management</h2>
      
      {isLoadingParents ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-quran-primary" />
          <span className="ml-2">Loading parents...</span>
        </div>
      ) : parentsError ? (
        <div className="text-center py-10">
          <div className="text-red-500 mb-2">Failed to load parents</div>
          <Button onClick={() => refetchParents()}>
            Try Again
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Linked Students</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parents.length > 0 ? (
              parents.map((parent: Parent) => (
                <TableRow key={parent.id}>
                  <TableCell>{parent.email}</TableCell>
                  <TableCell>{parent.first_name} {parent.last_name}</TableCell>
                  <TableCell>
                    {parent.students?.map(student => student.name).join(", ") || "No students linked"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline"
                        onClick={() => openStudentDialog(parent.id, parent.students || [])}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Manage Students
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => openEmailDialog(parent.id, parent.email)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Edit Email
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  No parents found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Linked Students</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {isLoadingStudents ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-quran-primary" />
                </div>
              ) : (
                students.map((student: Student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={student.id}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <label
                      htmlFor={student.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {student.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStudents}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Parent Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={editingEmail}
                onChange={(e) => setEditingEmail(e.target.value)}
                placeholder="Enter new email address"
                disabled={isUpdatingEmail}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              disabled={isUpdatingEmail}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateEmail}
              disabled={isUpdatingEmail}
            >
              {isUpdatingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
