
import { useState } from "react";
import { AdultStudentTable } from "../parent-management/AdultStudentTable";
import { Button } from "@/components/ui/button";
import { EmailEditDialog } from "./EmailEditDialog";
import { PhoneEditDialog } from "./PhoneEditDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AdultStudentUsersTabProps {
  users: any[];
  refetchUsers: () => void;
}

export const AdultStudentUsersTab = ({
  users,
  refetchUsers
}: AdultStudentUsersTabProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle sync adult students
  const handleSyncAdultStudents = async () => {
    try {
      const toastId = toast.loading("Syncing adult students...");
      
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'syncAdultStudents'
        }
      });
      
      if (error) throw error;
      
      toast.dismiss(toastId);
      toast.success(data.message || "Adult students synced successfully");
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to sync adult students");
    }
  };

  // Handle edit email
  const handleEditEmail = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setEditingEmail(email);
    setIsEmailDialogOpen(true);
  };

  // Handle update email
  const handleUpdateEmail = async () => {
    if (!selectedUserId || !editingEmail) {
      toast.error("User ID and email are required");
      return;
    }
    
    setIsUpdatingEmail(true);
    
    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'updateUserEmail',
          userId: selectedUserId,
          email: editingEmail
        }
      });
      
      if (error) throw error;
      
      toast.success("Email updated successfully");
      setIsEmailDialogOpen(false);
      refetchUsers();
    } catch (error: any) {
      toast.error(`Failed to update email: ${error.message}`);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Handle edit phone
  const handleEditPhone = (userId: string, phoneNumber: string) => {
    setSelectedUserId(userId);
    setEditingPhone(phoneNumber || "");
    setIsPhoneDialogOpen(true);
  };

  // Handle update phone
  const handleUpdatePhone = async () => {
    if (!selectedUserId) {
      toast.error("User ID is required");
      return;
    }
    
    setIsUpdatingPhone(true);
    
    try {
      // Update phone number in adult_students table
      const { error } = await supabase
        .from('adult_students')
        .update({ phone_number: editingPhone })
        .eq('id', selectedUserId);
      
      if (error) throw error;
      
      toast.success("Phone number updated successfully");
      setIsPhoneDialogOpen(false);
      refetchUsers();
    } catch (error: any) {
      toast.error(`Failed to update phone number: ${error.message}`);
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  // Handle delete
  const handleDelete = (userId: string) => {
    setSelectedUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedUserId) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'deleteUser',
          userId: selectedUserId
        }
      });
      
      if (error) throw error;
      
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      refetchUsers();
    } catch (error: any) {
      toast.error(`Failed to delete user: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Adult Students</h3>
        <Button 
          onClick={handleSyncAdultStudents} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          Sync Adult Students
        </Button>
      </div>
      
      {users && users.length > 0 ? (
        <AdultStudentTable 
          students={users} 
          onEditEmail={handleEditEmail} 
          onEditPhone={handleEditPhone} 
          onDelete={handleDelete} 
        />
      ) : (
        <div className="text-center py-8 text-gray-500 italic">
          No adult students found. Click "Sync Adult Students" to update the list.
        </div>
      )}

      {/* Email Edit Dialog */}
      <EmailEditDialog 
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        email={editingEmail}
        onChange={setEditingEmail}
        isUpdating={isUpdatingEmail}
        onSave={handleUpdateEmail}
      />

      {/* Phone Edit Dialog */}
      <PhoneEditDialog 
        isOpen={isPhoneDialogOpen}
        onClose={() => setIsPhoneDialogOpen(false)}
        phoneNumber={editingPhone}
        onChange={setEditingPhone}
        isUpdating={isUpdatingPhone}
        onSave={handleUpdatePhone}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
