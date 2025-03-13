
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://kkpfhpwgcyhlbuvjuzjt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcGZocHdnY3lobGJ1dmp1emp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDc0MzUsImV4cCI6MjA1NTkyMzQzNX0.ike_WJmlzrTHolTFBfho9Pu1jl83qgatYLNkgivjwws";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Utility function to sync registrations with Stripe
export const syncRegistrationsWithStripe = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-registrations': 'true'
      },
      body: {}
    });
    
    if (error) {
      console.error('Error syncing registrations:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Exception syncing registrations:', err);
    return { success: false, error: err };
  }
};
