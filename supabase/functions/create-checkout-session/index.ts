
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
    // Parse request body
    const requestData = await req.json();
    console.log("Received request data:", JSON.stringify(requestData));

    const { studentCount, email, successUrl, cancelUrl, registrationId } = requestData;

    // Validate required parameters
    if (!studentCount || !email || !successUrl || !cancelUrl || !registrationId) {
      console.error("Missing required parameters:", { 
        hasStudentCount: !!studentCount, 
        hasEmail: !!email, 
        hasSuccessUrl: !!successUrl, 
        hasCancelUrl: !!cancelUrl, 
        hasRegistrationId: !!registrationId 
      });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error("Stripe secret key is not configured");
      return new Response(
        JSON.stringify({ error: "Stripe configuration error" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

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

    // Create Stripe checkout session
    try {
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

      console.log("Checkout session created successfully:", {
        sessionId: session.id,
        redirectUrl: session.url
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    } catch (stripeError) {
      console.error('Stripe API error:', {
        error: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        params: stripeError.param
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Stripe API Error", 
          message: stripeError.message,
          code: stripeError.code || 'unknown'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }
  } catch (error) {
    console.error('General error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
