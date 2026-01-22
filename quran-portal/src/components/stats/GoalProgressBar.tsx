
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface GoalProgressBarProps {
  studentId: string;
}

export const GoalProgressBar = ({
  studentId
}: GoalProgressBarProps) => {
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ['goal-progress', studentId],
    queryFn: async () => {
      // Get monthly progress for current month
      const {
        data: monthlyProgress
      } = await supabase.from('monthly_progress').select('goal_current_lesson, goal_previous_month, goal_percentage').eq('student_id', studentId).gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).lte('month', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()).maybeSingle();
      return monthlyProgress;
    }
  });
  if (isLoading) {
    return <Card className="p-4">
        <div className="animate-pulse h-10 bg-gray-200 rounded" />
      </Card>;
  }
  if (!data?.goal_current_lesson || !data?.goal_previous_month) {
    return null;
  }
  return <Card className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Previous: {data.goal_previous_month}</span>
          <span>Target: {data.goal_current_lesson}</span>
        </div>
        <Progress value={data.goal_percentage || 0} className="h-8 bg-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-quran-primary/90 to-quran-primary transition-all duration-500" style={{
          width: `${data.goal_percentage || 0}%`
        }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold text-sm text-white z-10">
              {data.goal_percentage || 0}% Complete
            </span>
          </div>
        </Progress>
      </div>
    </Card>;
};
