
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { Card } from "@/quran/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TeacherSelect } from "@/quran/components/class-view/teacher/TeacherSelect";

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
    <Card className="bg-white border-slate-200 shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Teacher Class Management</h2>
          <p className="text-slate-500">Assign teachers to classes and manage their access.</p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2 text-slate-700">Select Class</label>
            <select
              className="p-2 border border-slate-200 rounded-md bg-white text-slate-900 focus:ring-2 focus:ring-quran-primary focus:border-transparent outline-none transition-all"
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
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-xl font-medium mb-4 text-slate-900">Manage Teachers</h3>
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
