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

// Utility function to force update registration status 
export const forceUpdateRegistrationStatus = async (emails: string[]) => {
  if (!emails || emails.length === 0) {
    return { success: false, error: 'No emails provided' };
  }

  try {
    // For each email, find the latest registration and update its status
    const promises = emails.map(async (email) => {
      // First, get the latest registration for this email
      const { data: registrations, error: fetchError } = await supabase
        .from('registrations')
        .select('id, email, payment_status, status')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (fetchError || !registrations || registrations.length === 0) {
        console.error(`No registration found for email: ${email}`);
        return { email, status: 'not_found' };
      }
      
      const registration = registrations[0];
      
      // Update the registration status
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ 
          payment_status: 'paid',
          status: 'active'
        })
        .eq('id', registration.id);
      
      if (updateError) {
        console.error(`Error updating registration for ${email}:`, updateError);
        return { email, status: 'error', error: updateError };
      }
      
      return { email, status: 'updated' };
    });
    
    const results = await Promise.all(promises);
    console.log('Force update results:', results);
    
    return { 
      success: true, 
      results,
      updated: results.filter(r => r.status === 'updated').length,
      notFound: results.filter(r => r.status === 'not_found').length,
      errors: results.filter(r => r.status === 'error').length
    };
  } catch (err) {
    console.error('Exception in force update process:', err);
    return { success: false, error: err };
  }
};

// Utility function to create user subscription entries for paid registrations
export const createUserSubscriptions = async () => {
  try {
    // 1. Get all registrations with payment_status = 'paid'
    const { data: paidRegistrations, error: fetchError } = await supabase
      .from('registrations')
      .select('id, email, payment_status, status')
      .eq('payment_status', 'paid')
      .eq('status', 'active');
    
    if (fetchError) {
      console.error('Error fetching paid registrations:', fetchError);
      return { success: false, error: fetchError };
    }
    
    if (!paidRegistrations || paidRegistrations.length === 0) {
      return { success: false, error: 'No paid registrations found' };
    }
    
    console.log(`Found ${paidRegistrations.length} paid registrations`);
    
    // 2. For each paid registration, create a user subscription entry if it doesn't exist
    const results = await Promise.all(paidRegistrations.map(async (registration) => {
      // First check if a user subscription already exists for this email
      const { data: existingSubscriptions, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', registration.id)
        .limit(1);
      
      if (checkError) {
        console.error(`Error checking existing subscription for ${registration.email}:`, checkError);
        return { email: registration.email, status: 'error', error: checkError };
      }
      
      // If a subscription already exists, skip
      if (existingSubscriptions && existingSubscriptions.length > 0) {
        console.log(`Subscription already exists for ${registration.email}`);
        return { email: registration.email, status: 'exists' };
      }
      
      // Create a new user subscription entry
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: registration.id,
          is_active: true,
          stripe_customer_id: `cus_placeholder_${registration.id.substring(0, 8)}`,
          stripe_subscription_id: `sub_placeholder_${registration.id.substring(0, 8)}`,
        });
      
      if (insertError) {
        console.error(`Error creating subscription for ${registration.email}:`, insertError);
        return { email: registration.email, status: 'error', error: insertError };
      }
      
      return { email: registration.email, status: 'created' };
    }));
    
    // Count the results
    const created = results.filter(r => r.status === 'created').length;
    const existing = results.filter(r => r.status === 'exists').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log('User subscription creation results:', { created, existing, errors });
    
    return { 
      success: true, 
      results,
      created,
      existing,
      errors
    };
  } catch (err) {
    console.error('Exception in user subscription creation process:', err);
    return { success: false, error: err };
  }
};
