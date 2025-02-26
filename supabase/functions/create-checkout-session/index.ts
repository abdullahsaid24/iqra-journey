
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

    // Append success parameter to the success URL
    const finalSuccessUrl = `${successUrl}?success=true`;
    const finalCancelUrl = `${cancelUrl}?success=false`;

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
        billing_cycle_anchor: Math.floor(new Date('2025-03-01T00:00:00Z').getTime() / 1000),
        proration_behavior: 'none',
      },
    });

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
