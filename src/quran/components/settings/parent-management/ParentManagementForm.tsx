import { useState } from "react";
import { Button } from "@/quran/components/ui/button";
import { Card } from "@/quran/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/quran/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/quran/components/ui/dialog";
import { Input } from "@/quran/components/ui/input";
import { Loader2 } from "lucide-react";
import { ParentTable } from "./ParentTable";
import { StudentSelectionDialog } from "./StudentSelectionDialog";
import type { Parent, Student } from "./types";

export const ParentManagementForm = () => {
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [editingSecondaryPhone, setEditingSecondaryPhone] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

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
        console.log(`Successfully fetched ${data.length} parents with total ${data.reduce((acc: number, parent: Parent) => acc + (parent.students?.length || 0), 0)} student links`);
        
        return data.map((parent: Parent) => ({
          ...parent,
          created_at: parent.created_at ? new Date(parent.created_at).toLocaleDateString() : 'Unknown'
        }));
      } catch (error) {
        console.error("Error fetching parents:", error);
        throw error;
      }
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

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
      return data.map(student => ({
        id: student.id,
        name: student.name
      })) || [];
    }
  });

  const handleUpdateStudents = async () => {
    if (!selectedParentId) {
      toast.error("Please select a parent first");
      return;
    }

    try {
      // Update phone number in links
      const phoneNumber = editingPhone.trim();
      let formattedPhone = phoneNumber;
      if (formattedPhone && !formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      // Remove existing links
      const { error: deleteError } = await supabase
        .from('parent_student_links')
        .delete()
        .eq('parent_user_id', selectedParentId);

      if (deleteError) {
        console.error('Error deleting parent links:', deleteError);
        throw deleteError;
      }

      // Add new links with phone number for all selected students
      if (selectedStudents.length > 0) {
        const newLinks = selectedStudents.map(studentId => ({
          parent_user_id: selectedParentId,
          student_id: studentId,
          phone_number: formattedPhone || null // Use stored phone number if available
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
      setIsStudentDialogOpen(false);
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
  
  const handleUpdatePhone = async () => {
    if (!selectedParentId) {
      toast.error("Parent ID is required");
      return;
    }

    setIsUpdatingPhone(true);

    try {
      let formattedPrimaryPhone = editingPhone.trim();
      let formattedSecondaryPhone = editingSecondaryPhone.trim();
      
      // Handle phone number format for primary phone
      if (formattedPrimaryPhone && !formattedPrimaryPhone.startsWith('+')) {
        formattedPrimaryPhone = '+' + formattedPrimaryPhone;
      }
      
      // Handle phone number format for secondary phone
      if (formattedSecondaryPhone && !formattedSecondaryPhone.startsWith('+')) {
        formattedSecondaryPhone = '+' + formattedSecondaryPhone;
      }
      
      const { data: linkData, error: linksError } = await supabase
        .from('parent_student_links')
        .select('student_id')
        .eq('parent_user_id', selectedParentId);
      
      if (linksError) throw linksError;
      
      if (linkData && linkData.length > 0) {
        const { error: updateError } = await supabase
          .from('parent_student_links')
          .update({ 
            phone_number: formattedPrimaryPhone || null,
            secondary_phone_number: formattedSecondaryPhone || null 
          })
          .eq('parent_user_id', selectedParentId);
          
        if (updateError) throw updateError;
      }

      toast.success("Phone numbers updated successfully");
      setIsPhoneDialogOpen(false);
      refetchParents();
    } catch (error: any) {
      console.error('Error in handleUpdatePhone:', error);
      toast.error(error.message || "Failed to update phone number");
    } finally {
      setIsUpdatingPhone(false);
    }
  };
  
  const handleDeleteParent = async () => {
    if (!selectedParentId) {
      toast.error("No parent selected");
      return;
    }

    try {
      const toastId = toast.loading("Deleting parent...");
      
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'deleteUser',
          userId: selectedParentId
        }
      });

      if (error) throw error;
      
      toast.dismiss(toastId);
      toast.success("Parent deleted successfully");
      setIsDeleteDialogOpen(false);
      refetchParents();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete parent");
    }
  };

  const openStudentDialog = (parentId: string, currentStudents: Student[]) => {
    setSelectedParentId(parentId);
    setSelectedStudents(currentStudents.map(s => s.id));
    setIsStudentDialogOpen(true);
  };

  const openEmailDialog = (parentId: string, email: string) => {
    setSelectedParentId(parentId);
    setEditingEmail(email);
    setIsEmailDialogOpen(true);
  };
  
  const openPhoneDialog = async (parentId: string, phoneNumber: string) => {
    setSelectedParentId(parentId);
    
    const { data: linkData } = await supabase
      .from('parent_student_links')
      .select('phone_number')
      .eq('parent_user_id', parentId)
      .limit(1)
      .maybeSingle();
        
    if (linkData && linkData.phone_number) {
      phoneNumber = linkData.phone_number;
    }
      
    setEditingPhone(phoneNumber || "");
    setEditingSecondaryPhone("");
    setIsPhoneDialogOpen(true);
  };
  
  const openDeleteDialog = (parentId: string) => {
    setSelectedParentId(parentId);
    setIsDeleteDialogOpen(true);
  };

  if (parentsError) {
    console.error('Error in parent data fetch:', parentsError);
  }

  return (
    <Card className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Parent Management</h2>
      
      {isLoadingParents ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Loading parents...</span>
        </div>
      ) : parentsError ? (
        <div className="text-center py-10">
          <div className="text-red-500 mb-2">Failed to load parents</div>
          <Button onClick={() => refetchParents()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Try Again
          </Button>
        </div>
      ) : (
        <ParentTable 
          parents={parents}
          onManageStudents={openStudentDialog}
          onEditEmail={openEmailDialog}
          onEditPhone={openPhoneDialog}
          onDelete={openDeleteDialog}
        />
      )}

      <StudentSelectionDialog 
        open={isStudentDialogOpen}
        onOpenChange={setIsStudentDialogOpen}
        isLoading={false}
        students={[]}  // This will be populated in the component
        selectedStudents={selectedStudents}
        onSelectedStudentsChange={setSelectedStudents}
        onSave={handleUpdateStudents}
      />
      
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
      
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Phone Numbers</DialogTitle>
            <DialogDescription>
              Update your primary and secondary phone numbers for SMS notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="primary-phone" className="text-sm font-medium leading-none">
                Primary Phone Number
              </label>
              <Input
                id="primary-phone"
                type="tel"
                value={editingPhone}
                onChange={(e) => setEditingPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                disabled={isUpdatingPhone}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="secondary-phone" className="text-sm font-medium leading-none">
                Secondary Phone Number (Optional)
              </label>
              <Input
                id="secondary-phone"
                type="tel"
                value={editingSecondaryPhone}
                onChange={(e) => setEditingSecondaryPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                disabled={isUpdatingPhone}
              />
            </div>
            <p className="text-xs text-gray-500">
              Include the country code (e.g., +1 for US)
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPhoneDialogOpen(false)}
              disabled={isUpdatingPhone}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePhone}
              disabled={isUpdatingPhone}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdatingPhone ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Parent</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete this parent? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteParent}
            >
              Delete Parent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
