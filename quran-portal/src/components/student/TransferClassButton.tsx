
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import { TransferDialog } from "./TransferDialog";
import { useClasses } from "@/hooks/useClasses";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TransferClassButtonProps {
  studentId: string;
  currentClassId: string;
}

export const TransferClassButton = ({ studentId, currentClassId }: TransferClassButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const queryClient = useQueryClient();
  const { data: classes = [], isLoading } = useClasses("admin");

  const transferMutation = useMutation({
    mutationFn: async ({ studentId, targetClassId }: { studentId: string, targetClassId: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update({ class_id: targetClassId })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', currentClassId] });
      if (selectedClassId) {
        queryClient.invalidateQueries({ queryKey: ['class', selectedClassId] });
      }
      toast.success("Student transferred to new class successfully");
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Error transferring student:', error);
      toast.error("Failed to transfer student to new class");
    }
  });

  const handleTransfer = async () => {
    if (!selectedClassId) {
      toast.error("Please select a target class");
      return;
    }
    
    await transferMutation.mutateAsync({
      studentId,
      targetClassId: selectedClassId
    });
  };

  // Filter out the current class
  const availableClasses = classes.filter(c => c.id !== currentClassId);

  if (availableClasses.length === 0) {
    return null; // Don't show button if no other classes available
  }

  return (
    <>
      <Button 
        variant="outline"
        className="text-yellow-600 hover:bg-yellow-500 hover:text-white border-yellow-500 flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <MoveRight className="h-4 w-4" />
        Transfer Class
      </Button>

      <TransferDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        classes={availableClasses}
        currentClassId={currentClassId}
        selectedClassId={selectedClassId}
        onClassSelect={setSelectedClassId}
        onTransfer={handleTransfer}
      />
    </>
  );
};
