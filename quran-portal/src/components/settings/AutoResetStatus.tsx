import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface ResetLog {
  id: string;
  reset_date: string;
  status: string;
  details: string | null;
  created_at: string;
}

export const AutoResetStatus = () => {
  const [lastReset, setLastReset] = useState<ResetLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLastReset();
  }, []);

  const fetchLastReset = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_reset_logs')
        .select('*')
        .order('reset_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching reset logs:', error);
      } else {
        setLastReset(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAutoReset = async () => {
    try {
      const { error } = await supabase.functions.invoke('monthly-student-reset');
      
      if (error) {
        console.error('Error testing auto-reset:', error);
        toast.error('Failed to test auto-reset function');
      } else {
        toast.success('Auto-reset test completed successfully');
        fetchLastReset(); // Refresh the last reset data
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const getNextResetDate = () => {
    const now = new Date();
    // Always show the 1st of the next month as the next reset date
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-3 bg-muted rounded w-full mb-2"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-50 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Auto Reset Status
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Student levels are automatically reset on the 1st of each month at 2:00 AM UTC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Next Scheduled Reset</span>
            </div>
            <p className="text-sm text-gray-400">
              {getNextResetDate()} at 2:00 AM UTC
            </p>
          </div>

          {lastReset && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {lastReset.status === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Last Reset</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">
                  {new Date(lastReset.reset_date).toLocaleDateString()}
                </p>
                <Badge 
                  variant={lastReset.status === 'success' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {lastReset.status}
                </Badge>
              </div>
              {lastReset.status === 'failed' && lastReset.details && (
                <p className="text-xs text-red-400">{lastReset.details}</p>
              )}
            </div>
          )}

          {!lastReset && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Last Reset</span>
              </div>
              <p className="text-sm text-gray-400">No reset history found</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <Button 
            onClick={testAutoReset} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Test Auto-Reset Function
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            This will trigger the auto-reset function manually for testing purposes.
          </p>
        </div>
      </div>
    </Card>
  );
};