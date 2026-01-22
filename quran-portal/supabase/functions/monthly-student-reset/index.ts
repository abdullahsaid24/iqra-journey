import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting monthly student reset...');

    // Call the existing database function to reset student levels
    const { error: resetError } = await supabaseClient.rpc('reset_monthly_absence_levels');

    if (resetError) {
      console.error('Error resetting student levels:', resetError);
      throw resetError;
    }

    // Log the reset operation
    const { error: logError } = await supabaseClient
      .from('monthly_reset_logs')
      .insert({
        reset_date: new Date().toISOString(),
        status: 'success',
        details: 'All student levels reset successfully'
      });

    if (logError) {
      console.error('Error logging reset operation:', logError);
    }

    console.log('Monthly student reset completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Student levels reset successfully',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Monthly student reset failed:', error);

    // Log the failed operation
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseClient
        .from('monthly_reset_logs')
        .insert({
          reset_date: new Date().toISOString(),
          status: 'failed',
          details: error.message || 'Unknown error occurred'
        });
    } catch (logError) {
      console.error('Error logging failed reset:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});