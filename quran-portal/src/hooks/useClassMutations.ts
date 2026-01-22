
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useClassMutations = () => {
  const queryClient = useQueryClient();

  const addClassMutation = useMutation({
    mutationFn: async (className: string) => {
      const { data, error } = await supabase
        .from('classes')
        .insert([{ name: className }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    }
  });

  const handleAddClass = async (className: string) => {
    try {
      await addClassMutation.mutateAsync(className);
      toast.success(`Class "${className}" has been added`);
    } catch (error) {
      toast.error("Failed to add class");
      console.error(error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteClassMutation.mutateAsync(classId);
      toast.success("Class has been deleted");
      return true;
    } catch (error) {
      toast.error("Failed to delete class");
      console.error(error);
      return false;
    }
  };

  return {
    handleAddClass,
    handleDeleteClass
  };
};
