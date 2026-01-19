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

    // Check if this is a manual sync request
    const isManualSync = req.headers.get('x-sync-registrations') === 'true';
    
    if (isManualSync) {
      console.log("Starting manual sync of registrations with Stripe");
      return await handleManualSync(stripe, supabaseUrl, supabaseKey);
    }

    // Regular webhook handling
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
        const registrationResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1&select=id,email`, {
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
        
        // Update or insert entry in user_subscriptions table
        const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${registrationId}&select=id`, {
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });
        
        const subscriptions = await subscriptionResponse.json();
        
        if (subscriptions.length > 0) {
          // Update existing subscription
          await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?id=eq.${subscriptions[0].id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              is_active: isActive,
              stripe_customer_id: subscription.customer,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            }),
          });
          
          console.log(`Updated subscription record for ${email}`);
        } else {
          // Insert new subscription
          await fetch(`${supabaseUrl}/rest/v1/user_subscriptions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              user_id: registrationId,
              is_active: isActive,
              stripe_customer_id: subscription.customer,
              stripe_subscription_id: subscription.id,
            }),
          });
          
          console.log(`Created new subscription record for ${email}`);
        }
        
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
        const registrationResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1&select=id,email`, {
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
        
        // Update user_subscriptions table
        await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${registrationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            is_active: false,
            updated_at: new Date().toISOString(),
          }),
        });
        
        console.log(`Updated user_subscription for ${email} to inactive`);
        
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

// Function to handle manual synchronization of all registrations with Stripe
async function handleManualSync(stripe: Stripe, supabaseUrl: string, supabaseKey: string) {
  try {
    console.log("Starting manual sync process");
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json'
    };
    
    // 1. Get all customers from Stripe with active subscriptions
    console.log("Fetching active subscriptions from Stripe");
    const activeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      expand: ['data.customer']
    });
    
    // Map of email to subscription status
    const activeEmailMap = new Map();
    
    activeSubscriptions.data.forEach(subscription => {
      const customer = subscription.customer as Stripe.Customer;
      if (customer && customer.email) {
        activeEmailMap.set(customer.email.toLowerCase(), {
          status: 'active',
          customerId: customer.id,
          subscriptionId: subscription.id
        });
      }
    });
    
    console.log(`Found ${activeEmailMap.size} active subscriptions in Stripe`);
    
    // 2. Get all registrations from database
    console.log("Fetching registrations from database");
    const registrationsResponse = await fetch(
      `${supabaseUrl}/rest/v1/registrations?select=id,email,payment_status,status&order=created_at.desc`, 
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );
    
    if (!registrationsResponse.ok) {
      throw new Error(`Failed to fetch registrations: ${registrationsResponse.statusText}`);
    }
    
    const registrations = await registrationsResponse.json();
    console.log(`Found ${registrations.length} registrations in database`);
    
    // Group registrations by email to handle duplicates
    const registrationsByEmail = new Map();
    registrations.forEach(reg => {
      if (!registrationsByEmail.has(reg.email.toLowerCase())) {
        registrationsByEmail.set(reg.email.toLowerCase(), reg);
      }
    });
    
    // 3. Update registrations based on Stripe status
    const updates = [];
    let updatedCount = 0;
    let subscriptionCount = 0;
    
    for (const [email, registration] of registrationsByEmail.entries()) {
      const stripeInfo = activeEmailMap.get(email);
      const needsUpdate = stripeInfo && 
        (registration.payment_status !== 'paid' || registration.status !== 'active');
      
      if (needsUpdate) {
        console.log(`Updating registration for ${email}: setting to active/paid`);
        
        // Update registration status
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/registrations?id=eq.${registration.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              payment_status: 'paid',
              status: 'active',
            }),
          }
        );
        
        if (updateResponse.ok) {
          updatedCount++;
          updates.push({
            email,
            id: registration.id,
            status: 'updated to active'
          });
          
          // Now check if we need to update user_subscriptions
          const subscriptionResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${registration.id}&select=id`,
            {
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          );
          
          const subscriptions = await subscriptionResponse.json();
          
          if (subscriptions.length > 0) {
            // Update existing subscription
            await fetch(
              `${supabaseUrl}/rest/v1/user_subscriptions?id=eq.${subscriptions[0].id}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  is_active: true,
                  stripe_customer_id: stripeInfo.customerId,
                  stripe_subscription_id: stripeInfo.subscriptionId,
                  updated_at: new Date().toISOString(),
                }),
              }
            );
            
            console.log(`Updated subscription for ${email}`);
          } else {
            // Create new subscription
            await fetch(
              `${supabaseUrl}/rest/v1/user_subscriptions`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  user_id: registration.id,
                  is_active: true,
                  stripe_customer_id: stripeInfo.customerId,
                  stripe_subscription_id: stripeInfo.subscriptionId,
                }),
              }
            );
            
            subscriptionCount++;
            console.log(`Created subscription for ${email}`);
          }
        } else {
          console.error(`Failed to update registration ${registration.id}: ${updateResponse.statusText}`);
          updates.push({
            email,
            id: registration.id,
            status: 'update failed'
          });
        }
      }
    }
    
    console.log(`Sync complete. Updated ${updatedCount} registrations and ${subscriptionCount} subscriptions.`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synchronized ${updatedCount} registrations with Stripe, created/updated ${subscriptionCount} subscriptions`,
        updates
      }),
      {
        headers: corsHeaders,
        status: 200,
      },
    );
  } catch (error) {
    console.error(`Error during manual sync: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        error: "Sync failed", 
        message: error.message 
      }),
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Content-Type': 'application/json'
        },
        status: 500,
      },
    );
  }
}
