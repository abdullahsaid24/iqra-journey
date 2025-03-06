
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.20.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { studentCount, email, successUrl, cancelUrl, registrationId } = await req.json();

    // Make sure URLs are properly encoded
    const finalSuccessUrl = encodeURI(successUrl);
    const finalCancelUrl = encodeURI(cancelUrl);

    // Determine billing cycle anchor based on current date
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-indexed (0 = January)
    const currentYear = today.getFullYear();
    
    let billingCycleAnchorDate;
    
    if (currentDay < 15) {
      // Before the 15th - bill for the current month (1st of current month)
      billingCycleAnchorDate = new Date(currentYear, currentMonth, 1);
    } else {
      // On or after the 15th - bill for the next month (1st of next month)
      billingCycleAnchorDate = new Date(currentYear, currentMonth + 1, 1);
    }
    
    // Convert to Unix timestamp (seconds)
    const billingCycleAnchor = Math.floor(billingCycleAnchorDate.getTime() / 1000);

    console.log("Creating checkout session with billing details:", {
      successUrl: finalSuccessUrl,
      cancelUrl: finalCancelUrl,
      currentDate: today.toISOString(),
      billingCycleAnchorDate: billingCycleAnchorDate.toISOString(),
      billingCycleAnchor,
      currentDay,
      studentCount
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price: 'price_1QwZucA8IKyf1ukT9pkk9L3c',
        quantity: studentCount,
      }],
      customer_email: email,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        registration_id: registrationId,
      },
      subscription_data: {
        billing_cycle_anchor: billingCycleAnchor,
        proration_behavior: 'none',
      },
    });

    console.log("Checkout session created, redirecting to:", session.url);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
