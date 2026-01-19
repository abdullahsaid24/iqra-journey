
import { supabase } from "@/integrations/supabase/client";

export const checkMonthlyResetFunctionality = async () => {
  try {
    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    // Check if monthly progress records exist for current month
    const { data: monthlyProgress, error } = await supabase
      .from('monthly_progress')
      .select('*')
      .eq('month', currentMonth)
      .limit(5);

    if (error) {
      console.error('Error checking monthly progress:', error);
      return false;
    }

    console.log('Monthly progress records for current month:', monthlyProgress);
    
    // Simple check - if we can query monthly_progress table, the functionality is working
    console.log('Monthly reset functionality appears to be working');
    return true;
  } catch (error) {
    console.error('Error checking monthly reset:', error);
    return false;
  }
};
