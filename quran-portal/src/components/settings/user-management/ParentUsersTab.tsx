import { ParentTable } from "../parent-management/ParentTable";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StudentSelectionDialog } from "./StudentSelectionDialog";
import { EmailEditDialog } from "./EmailEditDialog";
import { PhoneEditDialog } from "./PhoneEditDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Student } from "../parent-management/types";

interface ParentUsersTabProps {
  parents: any[];
  isLoading: boolean;
  error: any;
  refetchParents: () => void;
  refetchUsers: () => void;
  refetchStudents: () => void;
  students: any[];
}

export const ParentUsersTab = ({
  parents,
  isLoading,
  error,
  refetchParents,
  refetchUsers,
  refetchStudents,
  students
}: ParentUsersTabProps) => {
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [editingSecondaryPhone, setEditingSecondaryPhone] = useState("");
  const [isUpdatingStudents, setIsUpdatingStudents] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleManageStudents = (parentId: string, currentStudents: Student[]) => {
    console.log(`Managing students for parent ${parentId}`, currentStudents);
    setSelectedParentId(parentId);
    setSelectedStudents((currentStudents || []).map(s => s.id));
    setIsStudentDialogOpen(true);
  };

  const handleUpdateStudents = async () => {
    if (!selectedParentId) {
      toast.error("No parent selected");
      return;
    }
    
    setIsUpdatingStudents(true);
    
    try {
      const { error: deleteError } = await supabase
        .from('parent_student_links')
        .delete()
        .eq('parent_user_id', selectedParentId);
        
      if (deleteError) throw deleteError;
      
      if (selectedStudents.length > 0) {
        const newLinks = selectedStudents.map(studentId => ({
          parent_user_id: selectedParentId,
          student_id: studentId,
          phone_number: editingPhone || null
        }));
        
        const { error: insertError } = await supabase
          .from('parent_student_links')
          .insert(newLinks);
          
        if (insertError) throw insertError;
      }
      
      toast.success("Student links updated successfully");
      setIsStudentDialogOpen(false);
      refetchParents();
      refetchStudents();
    } catch (error: any) {
      toast.error(`Failed to update student links: ${error.message}`);
    } finally {
      setIsUpdatingStudents(false);
    }
  };

  const handleEditEmail = (userId: string, email: string) => {
    setSelectedParentId(userId);
    setEditingEmail(email);
    setIsEmailDialogOpen(true);
  };

  const handleUpdateEmail = async () => {
    if (!selectedParentId || !editingEmail) {
      toast.error("User ID and email are required");
      return;
    }
    
    setIsUpdatingEmail(true);
    
    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'updateUserEmail',
          userId: selectedParentId,
          email: editingEmail
        }
      });
      
      if (error) throw error;
      
      toast.success("Email updated successfully");
      setIsEmailDialogOpen(false);
      refetchParents();
      refetchUsers();
    } catch (error: any) {
      toast.error(`Failed to update email: ${error.message}`);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleEditPhone = async (userId: string, phoneNumber: string) => {
    const { data: links } = await supabase
      .from('parent_student_links')
      .select('phone_number, secondary_phone_number')
      .eq('parent_user_id', userId)
      .limit(1);

    setSelectedParentId(userId);
    setEditingPhone(phoneNumber || "");
    
    if (links && links.length > 0) {
      setEditingSecondaryPhone(links[0].secondary_phone_number || "");
    } else {
      setEditingSecondaryPhone("");
    }
    
    setIsPhoneDialogOpen(true);
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
      
      if (formattedPrimaryPhone && !formattedPrimaryPhone.startsWith('+')) {
        formattedPrimaryPhone = '+' + formattedPrimaryPhone;
      }
      
      if (formattedSecondaryPhone && !formattedSecondaryPhone.startsWith('+')) {
        formattedSecondaryPhone = '+' + formattedSecondaryPhone;
      }
      
      const { error: updateError } = await supabase
        .from('parent_student_links')
        .update({
          phone_number: formattedPrimaryPhone || null,
          secondary_phone_number: formattedSecondaryPhone || null
        })
        .eq('parent_user_id', selectedParentId);
        
      if (updateError) throw updateError;
      
      toast.success("Phone numbers updated successfully");
      setIsPhoneDialogOpen(false);
      refetchParents();
    } catch (error: any) {
      toast.error(`Failed to update phone numbers: ${error.message}`);
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleDelete = (userId: string) => {
    setSelectedParentId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedParentId) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'deleteUser',
          userId: selectedParentId
        }
      });
      
      if (error) throw error;
      
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      refetchParents();
      refetchUsers();
      refetchStudents();
    } catch (error: any) {
      toast.error(`Failed to delete user: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-quran-primary animate-spin" />
        <span className="ml-2">Loading parents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Error loading parents</AlertTitle>
          <AlertDescription>{String(error)}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => refetchParents()} 
          className="px-4 py-2 bg-quran-primary text-white rounded-md"
        >
          Retry
        </Button>
      </div>
    );
  }

  console.log("Parents in ParentUsersTab:", parents);

  return (
    <>
      <ParentTable 
        parents={parents} 
        onManageStudents={(parentId, currentStudents) => {
          setSelectedParentId(parentId);
          setSelectedStudents((currentStudents || []).map(s => s.id));
          setIsStudentDialogOpen(true);
        }}
        onEditEmail={(userId, email) => {
          setSelectedParentId(userId);
          setEditingEmail(email);
          setIsEmailDialogOpen(true);
        }}
        onEditPhone={(userId, phone) => {
          handleEditPhone(userId, phone);
        }}
        onDelete={(userId) => {
          setSelectedParentId(userId);
          setIsDeleteDialogOpen(true);
        }}
      />

      <StudentSelectionDialog 
        isOpen={isStudentDialogOpen}
        onClose={() => setIsStudentDialogOpen(false)}
        students={students}
        adultStudents={[]} // Pass adult students if needed
        selectedStudents={selectedStudents}
        onToggleStudent={(studentId) => {
          setSelectedStudents(prev => 
            prev.includes(studentId) 
              ? prev.filter(id => id !== studentId) 
              : [...prev, studentId]
          );
        }}
        isUpdating={isUpdatingStudents}
        onSave={handleUpdateStudents}
        filterNoClass={false}
      />

      <EmailEditDialog 
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        email={editingEmail}
        onChange={setEditingEmail}
        isUpdating={isUpdatingEmail}
        onSave={handleUpdateEmail}
      />

      <PhoneEditDialog 
        isOpen={isPhoneDialogOpen}
        onClose={() => setIsPhoneDialogOpen(false)}
        phoneNumber={editingPhone}
        secondaryPhoneNumber={editingSecondaryPhone}
        onChange={(value, type) => {
          if (type === 'primary') {
            setEditingPhone(value);
          } else {
            setEditingSecondaryPhone(value);
          }
        }}
        isUpdating={isUpdatingPhone}
        onSave={handleUpdatePhone}
      />

      <DeleteUserDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
