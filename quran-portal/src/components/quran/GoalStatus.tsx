
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startOfMonth } from "date-fns";
import { Target, X } from "lucide-react";

interface GoalStatusProps {
  studentId: string;
  onStatusUpdate: () => void;
}

export const GoalStatus = ({ studentId, onStatusUpdate }: GoalStatusProps) => {
  const [currentGoal, setCurrentGoal] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentGoal = async () => {
      const currentMonth = startOfMonth(new Date());
      
      try {
        const { data, error } = await supabase
          .from("monthly_progress")
          .select("goal_current_lesson")
          .eq("student_id", studentId)
          .eq("month", currentMonth.toISOString())
          .maybeSingle();

        if (error) throw error;
        
        setCurrentGoal(data?.goal_current_lesson || null);
      } catch (error) {
        console.error("Error fetching goal:", error);
        toast.error("Failed to fetch current goal");
      }
    };

    fetchCurrentGoal();
  }, [studentId]);

  const handleClearGoal = async () => {
    const currentMonth = startOfMonth(new Date());
    
    try {
      const { error } = await supabase
        .from("monthly_progress")
        .update({ goal_current_lesson: null })
        .eq("student_id", studentId)
        .eq("month", currentMonth.toISOString());

      if (error) throw error;

      setCurrentGoal(null);
      toast.success("Goal cleared successfully");
      onStatusUpdate();
    } catch (error) {
      console.error("Error clearing goal:", error);
      toast.error("Failed to clear goal");
    }
  };

  if (!currentGoal) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Target className="h-4 w-4" />
        <span>No goal set</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-quran-primary">
        <Target className="h-4 w-4" />
        <span className="font-medium">Goal: {currentGoal}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearGoal}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
