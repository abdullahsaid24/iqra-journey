
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

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error("Stripe signature missing");
      return new Response(
        JSON.stringify({ error: "Stripe signature missing" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error("Stripe webhook secret is not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret configuration error" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Get request body as text for the verification
    const body = await req.text();
    
    let event;
    try {
      // Verify the event using the webhook secret
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Received Stripe event: ${event.type}`);
    
    // Get the Supabase URL and service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Supabase configuration error" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.resumed': {
        const subscription = event.data.object;
        
        // Get customer info
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        console.log(`Processing subscription event for customer: ${customer.email}`);
        
        // Update user_subscriptions table
        const email = typeof customer.email === 'string' ? customer.email : '';
        
        if (!email) {
          console.error("Customer email not found");
          return new Response(
            JSON.stringify({ error: "Customer email not found" }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }
        
        // First, find the user in registrations table by email
        const registrationResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(email)}&select=id,email`, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });
        
        const registrations = await registrationResponse.json();
        
        if (registrations.length === 0) {
          console.error(`No registration found for email: ${email}`);
          return new Response(
            JSON.stringify({ error: `No registration found for email: ${email}` }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            }
          );
        }
        
        const registrationId = registrations[0].id;
        
        // Update the payment_status in registrations table
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        
        await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${registrationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            payment_status: isActive ? 'paid' : 'unpaid',
            status: isActive ? 'active' : 'inactive',
          }),
        });
        
        console.log(`Updated registration ${registrationId} status to ${isActive ? 'active' : 'inactive'}`);
        
        break;
      }
      
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const subscription = event.data.object;
        
        // Get customer info
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        console.log(`Processing subscription cancellation for customer: ${customer.email}`);
        
        // Update user_subscriptions table
        const email = typeof customer.email === 'string' ? customer.email : '';
        
        if (!email) {
          console.error("Customer email not found");
          return new Response(
            JSON.stringify({ error: "Customer email not found" }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }
        
        // Find the user in registrations table by email
        const registrationResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(email)}&select=id,email`, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });
        
        const registrations = await registrationResponse.json();
        
        if (registrations.length === 0) {
          console.error(`No registration found for email: ${email}`);
          return new Response(
            JSON.stringify({ error: `No registration found for email: ${email}` }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            }
          );
        }
        
        const registrationId = registrations[0].id;
        
        // Update the payment_status in registrations table
        await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${registrationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            payment_status: 'unpaid',
            status: 'inactive',
          }),
        });
        
        console.log(`Updated registration ${registrationId} status to inactive`);
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
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
