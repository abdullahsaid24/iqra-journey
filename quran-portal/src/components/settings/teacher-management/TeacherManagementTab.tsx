
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TeacherSelect } from "@/components/class-view/teacher/TeacherSelect";

export const TeacherManagementTab = () => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-for-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name');
      
      if (error) throw error;
      return data || [];
    }
  });
  
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'listUsers'
        }
      });
      
      if (response.error) throw response.error;
      
      return response.data.filter((user: any) => 
        user.role === 'admin' || user.role === 'teacher'
      ) || [];
    }
  });
  
  const { data: assignedTeacherIds = [], isLoading: teacherIdsLoading } = useQuery({
    queryKey: ['class-teachers', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      
      const { data, error } = await supabase
        .from('class_teachers')
        .select('user_id')
        .eq('class_id', selectedClassId);
      
      if (error) throw error;
      return data.map(item => item.user_id);
    },
    enabled: !!selectedClassId
  });
  
  const assignTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      if (!selectedClassId) throw new Error("No class selected");
      
      const { error } = await supabase
        .from('class_teachers')
        .insert([
          { class_id: selectedClassId, user_id: teacherId }
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-teachers', selectedClassId] });
      toast.success("Teacher assigned successfully");
    },
    onError: (error) => {
      console.error('Error assigning teacher:', error);
      toast.error("Failed to assign teacher");
    }
  });

  const removeTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      if (!selectedClassId) throw new Error("No class selected");
      
      const { error } = await supabase
        .from('class_teachers')
        .delete()
        .eq('class_id', selectedClassId)
        .eq('user_id', teacherId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-teachers', selectedClassId] });
      toast.success("Teacher removed successfully");
    },
    onError: (error) => {
      console.error('Error removing teacher:', error);
      toast.error("Failed to remove teacher");
    }
  });
  
  const isLoading = classesLoading || teachersLoading || (selectedClassId && teacherIdsLoading);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-quran-primary animate-spin" />
      </div>
    );
  }
  
  return (
    <Card className="border border-quran-border bg-white/90 backdrop-blur-sm shadow-lg">
      <div className="p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-quran-bg font-arabic mb-2">Teacher Class Management</h2>
          <div className="w-32 h-1 bg-quran-primary mx-auto rounded-full" />
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Select Class</label>
            <select 
              className="p-2 border border-quran-border rounded-md"
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(e.target.value || null)}
            >
              <option value="">Select a class</option>
              {classes.map((classItem: any) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedClassId && (
            <div className="mt-6">
              <h3 className="text-xl font-medium mb-4">Manage Teachers</h3>
              <TeacherSelect
                teachers={teachers || []}
                assignedTeacherIds={assignedTeacherIds}
                onAssignTeacher={(teacherId) => assignTeacherMutation.mutate(teacherId)}
                onRemoveTeacher={(teacherId) => removeTeacherMutation.mutate(teacherId)}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
