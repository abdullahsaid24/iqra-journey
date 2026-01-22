import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-STRIPE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key to bypass RLS for writing subscription data
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting Stripe subscription sync");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get all subscriptions from Stripe (active, past_due, unpaid, etc.)
    logStep("Fetching all subscriptions from Stripe");
    const allSubscriptions = await Promise.all([
      stripe.subscriptions.list({ status: "active", limit: 100 }),
      stripe.subscriptions.list({ status: "past_due", limit: 100 }),
      stripe.subscriptions.list({ status: "unpaid", limit: 100 })
    ]);
    
    const subscriptions = {
      data: [
        ...allSubscriptions[0].data,
        ...allSubscriptions[1].data,
        ...allSubscriptions[2].data
      ]
    };

    logStep("Found subscriptions in Stripe", { count: subscriptions.data.length });

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions.data) {
      try {
        // Get customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (typeof customer === 'string' || customer.deleted) {
          logStep("Skipping deleted customer", { customerId: subscription.customer });
          skippedCount++;
          continue;
        }

        const customerEmail = customer.email;
        if (!customerEmail) {
          logStep("Skipping customer without email", { customerId: customer.id });
          skippedCount++;
          continue;
        }

        logStep("Processing subscription", { 
          subscriptionId: subscription.id, 
          customerEmail: customerEmail 
        });

        // Find user by email using case-insensitive search
        const { data: userData, error: userError } = await supabaseClient
          .rpc('get_user_by_email', { p_email: customerEmail.toLowerCase() });

        if (userError || !userData || userData.length === 0) {
          logStep("User not found in system", { email: customerEmail, error: userError });
          skippedCount++;
          continue;
        }

        const userId = userData[0]?.id;
        if (!userId) {
          logStep("No user ID found", { email: customerEmail });
          skippedCount++;
          continue;
        }

        // Get subscription details to store amount and currency
        const subDetails = await stripe.subscriptions.retrieve(subscription.id);
        const price = subDetails.items.data[0]?.price;
        const amount = price?.unit_amount || null;
        const currency = price?.currency || 'usd';

        logStep("Retrieved subscription pricing", { 
          subscriptionId: subscription.id,
          customerEmail: customerEmail,
          priceId: price?.id,
          amount: amount,
          currency: currency,
          priceType: price?.type,
          recurring: price?.recurring
        });

        // Determine if subscription should be considered active
        const isActive = subscription.status === 'active' || subscription.status === 'past_due';
        
        // Upsert subscription data
        const { error: upsertError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
            is_active: isActive,
            subscription_status: subscription.status,
            amount: amount,
            currency: currency,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          logStep("Error upserting subscription", { 
            userId, 
            error: upsertError,
            email: customerEmail 
          });
          errorCount++;
        } else {
          logStep("Successfully synced subscription", { 
            userId, 
            email: customerEmail,
            subscriptionId: subscription.id 
          });
          syncedCount++;
        }

      } catch (error) {
        logStep("Error processing individual subscription", { 
          subscriptionId: subscription.id, 
          error: error.message 
        });
        errorCount++;
      }
    }

    const summary = {
      total_stripe_subscriptions: subscriptions.data.length,
      synced_successfully: syncedCount,
      skipped: skippedCount,
      errors: errorCount
    };

    logStep("Sync completed", summary);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Stripe subscription sync completed",
        ...summary
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync process", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});