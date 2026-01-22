import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserTable } from "./UserTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import { DeleteUserDialog } from "./DeleteUserDialog";

interface StudentUsersTabProps {
  users: any[];
}

export const StudentUsersTab = ({ users }: StudentUsersTabProps) => {
  const queryClient = useQueryClient();
  const { data: classes = [] } = useClasses("admin");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClassChange = async (studentId: string, newClassId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ class_id: newClassId === "none" ? null : newClassId })
        .eq('id', studentId);
        
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['class-students'] });
      toast.success("Class updated successfully");
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error("Failed to update class");
    }
  };

  const handleDelete = async () => {
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsDeleteDialogOpen(false);
      setSelectedUserId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <UserTable users={users} />
      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};
