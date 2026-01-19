import { useState } from "react";
import { Button } from "@/quran/components/ui/button";
import { Card } from "@/quran/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
export const StudentLevelsReset = () => {
  const [isResetting, setIsResetting] = useState(false);
  const handleReset = async () => {
    setIsResetting(true);
    try {
      const {
        error
      } = await supabase.rpc('reset_monthly_absence_levels');
      if (error) {
        console.error('Error resetting student levels:', error);
        toast.error('Failed to reset student levels');
      } else {
        toast.success('Student absence and failure levels reset to 1 successfully');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsResetting(false);
    }
  };
  return <Card className="p-6 bg-white border-slate-200 shadow-sm">
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Reset Student Levels</h3>
        <p className="text-sm text-slate-500 mt-1">
          Reset all students' absence and failure levels to 1. This action will affect all students in the system.
        </p>
      </div>

      <Button onClick={handleReset} disabled={isResetting} variant="outline" className="flex items-center gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50">
        <RotateCcw className="h-4 w-4" />
        {isResetting ? 'Resetting...' : 'Reset All Student Levels'}
      </Button>
    </div>
  </Card>;
};
