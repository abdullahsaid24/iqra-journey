
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

    // Calculate billing cycle anchor for first of next month
    const now = new Date();
    let billingCycleAnchor: number;
    
    // If today is the 1st of the month, bill immediately
    // Otherwise, set billing to begin on the 1st of next month
    if (now.getDate() === 1) {
      console.log("Today is the 1st of the month, billing starts immediately");
      billingCycleAnchor = Math.floor(now.getTime() / 1000); // Current time in seconds
    } else {
      // Set to 1st of next month
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      billingCycleAnchor = Math.floor(nextMonth.getTime() / 1000);
      console.log("Setting billing_cycle_anchor to 1st of next month:", new Date(billingCycleAnchor * 1000).toISOString());
    }

    console.log("Creating checkout session with billing details:", {
      successUrl,
      cancelUrl,
      studentCount,
      billingCycleAnchor: new Date(billingCycleAnchor * 1000).toISOString()
    });

    // Create Stripe checkout session with billing_cycle_anchor set to 1st of next month
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{
          price: 'price_1QwZucA8IKyf1ukT9pkk9L3c',
          quantity: studentCount,
        }],
        customer_email: email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          registration_id: registrationId,
        },
        subscription_data: {
          billing_cycle_anchor: billingCycleAnchor,
          proration_behavior: 'none',
          metadata: {
            registration_id: registrationId,
          }
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
      // Log detailed Stripe error information
      console.error('Stripe API error:', {
        error: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        params: stripeError.param,
        stack: stripeError.stack
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
    // Log detailed general error information
    console.error('General error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      object: JSON.stringify(error)
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
