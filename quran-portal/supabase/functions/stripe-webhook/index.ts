import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import Stripe from "https://esm.sh/stripe?bundle";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const rawBody = await req.text();
    console.log("📝 Received webhook payload:", rawBody);

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    console.log("🔑 Stripe signature:", signature);

    let event;

    // For testing purposes, parse the event directly if no signature verification is possible
    if (!signature || !Deno.env.get("STRIPE_WEBHOOK_SECRET")) {
      console.log("⚠️ No signature or webhook secret - accepting payload for testing");
      event = JSON.parse(rawBody);
    } else {
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          Deno.env.get("STRIPE_WEBHOOK_SECRET")!
        );
        console.log("✅ Stripe signature verified");
      } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return new Response(
          JSON.stringify({ error: `Webhook Error: ${err.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    console.log("🔹 Processing event type:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("💳 Checkout session completed:", session);

      const customerEmail = session.customer_details?.email;
      if (!customerEmail) {
        throw new Error("No customer email found in session");
      }

      console.log("🔍 Looking up user with email:", customerEmail);

      // Use RPC call to get user data
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_by_email', { p_email: customerEmail });

      if (userError || !userData) {
        console.error("❌ Error finding user:", userError);
        throw new Error('User not found');
      }

      const userId = userData.id;
      console.log("✅ Found user:", userId);
      console.log("📝 Updating subscription for customer:", session.customer);

      // Update subscription with explicit column names
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (subscriptionError) {
        console.error("❌ Error updating subscription:", subscriptionError);
        throw new Error('Failed to update subscription');
      }

      console.log("✅ Successfully updated subscription for user:", userId);
    } else if (event.type === "invoice.payment_failed") {
      console.log("❌ Invoice payment failed event");

      const invoice = event.data.object;
      const customerId = invoice.customer;
      const invoiceId = invoice.id;
      const paymentIntentId = invoice.payment_intent;
      console.log("📄 Invoice payment failed:", { invoiceId, customerId, paymentIntentId });

      if (!customerId) {
        console.log("⚠️ No customer ID found in payment failure event");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get customer details from Stripe
      const customer = await stripe.customers.retrieve(customerId as string);
      if (!customer || typeof customer === 'string' || customer.deleted) {
        console.log("⚠️ Customer not found or deleted:", customerId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const customerEmail = customer.email;
      const stripePhone = customer.phone;

      if (!customerEmail) {
        console.log("⚠️ No email found for customer:", customerId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log("🔍 Looking up user for payment failure notification:", customerEmail);

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_by_email', { p_email: customerEmail.toLowerCase() });

      if (userError || !userData) {
        console.log("⚠️ User not found in database for payment failure:", { email: customerEmail, error: userError });
        // Even if user not in DB, we could still send SMS if we have the phone from Stripe
        // But we need a userId for the record. For now, let's proceed only if user exists in DB
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const userId = userData.id;
      console.log("✅ Found user for payment failure notification:", userId);

      // Check if we've already sent a notification for this customer in the last 7 days
      const { data: recentNotifications, error: notificationCheckError } = await supabase
        .from('payment_failure_notifications')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (notificationCheckError) {
        console.error("❌ Error checking recent notifications:", notificationCheckError);
      } else if (recentNotifications && recentNotifications.length > 0) {
        console.log("⏰ Payment failure notification already sent in last 7 days for customer:", customerId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let phoneNumber = stripePhone;
      console.log(phoneNumber ? "📱 Using phone number from Stripe" : "🔍 No phone in Stripe, checking database");

      // If no phone in Stripe, fallback to database
      if (!phoneNumber) {
        const { data: phoneData, error: phoneError } = await supabase
          .from('parent_student_links')
          .select('phone_number, secondary_phone_number')
          .eq('parent_user_id', userId)
          .limit(1);

        if (phoneData && phoneData.length > 0) {
          phoneNumber = phoneData[0].phone_number || phoneData[0].secondary_phone_number;
        }

        // If still no phone, check notification_preferences
        if (!phoneNumber) {
          const { data: prefData, error: prefError } = await supabase
            .from('notification_preferences')
            .select('phone_number')
            .eq('parent_user_id', userId)
            .limit(1);

          if (prefData && prefData.length > 0) {
            phoneNumber = prefData[0].phone_number;
          }
        }
      }

      if (!phoneNumber) {
        console.log("⚠️ No phone number found for user:", userId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log("📱 Final phone number for notification:", phoneNumber);

      // Check if we sent an SMS to this customer in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentNotification, error: recentError } = await supabase
        .from('payment_failure_notifications')
        .select('created_at')
        .eq('stripe_customer_id', customerId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentNotification && recentNotification.length > 0) {
        const lastSent = new Date(recentNotification[0].created_at);
        console.log(`⏰ SMS already sent on ${lastSent.toISOString()} - skipping to avoid spam (once per week limit)`);
        return new Response(JSON.stringify({
          received: true,
          message: "SMS skipped - already sent within 7 days"
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log("✅ No recent SMS sent - proceeding with notification");

      // Get payment failure notification template
      const { data: templateData, error: templateError } = await supabase
        .from('notification_templates')
        .select('content')
        .eq('type', 'payment_failed')
        .limit(1);

      let message = `Iqra Dugsi: Your payment failed. Update card at billing.stripe.com/p/login/fZe5mSaqA5iB4I84gg with signup email. Questions? 780-996-7950`;

      if (templateData && templateData.length > 0) {
        message = templateData[0].content;
        console.log("✅ Using custom payment failure template");
      } else {
        console.log("⚠️ Using default payment failure message");
      }

      // Send SMS notification
      try {
        console.log("📤 Sending payment failure SMS to:", phoneNumber);
        console.log("📝 Message content:", message);

        const smsResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: phoneNumber,
            message: message
          })
        });

        if (smsResponse.ok) {
          console.log("✅ Payment failure SMS sent successfully");

          // Record the notification
          const { error: recordError } = await supabase
            .from('payment_failure_notifications')
            .insert({
              user_id: userId,
              stripe_customer_id: customerId as string,
              payment_intent_id: paymentIntentId as string,
              invoice_id: invoiceId,
              phone_number: phoneNumber,
              notification_sent_at: new Date().toISOString()
            });

          if (recordError) {
            console.error("❌ Error recording notification:", recordError);
          } else {
            console.log("✅ Payment failure notification recorded");
          }
        } else {
          const errorText = await smsResponse.text();
          console.error("❌ Failed to send payment failure SMS:", errorText);
        }
      } catch (smsError) {
        console.error("❌ Error sending SMS:", smsError);
      }
    }

    // Handle subscription updates (status changes)
    else if (event.type === "customer.subscription.updated") {
      console.log("🔄 Subscription updated event");

      const subscription = event.data.object;
      const customerId = subscription.customer;
      const subscriptionStatus = subscription.status;

      console.log("📄 Subscription update:", {
        subscriptionId: subscription.id,
        customerId,
        status: subscriptionStatus
      });

      // Get customer email from Stripe
      const customer = await stripe.customers.retrieve(customerId as string);
      if (!customer || typeof customer === 'string' || customer.deleted) {
        console.log("⚠️ Customer not found or deleted:", customerId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const customerEmail = customer.email;
      if (!customerEmail) {
        console.log("⚠️ No email found for customer:", customerId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_by_email', { p_email: customerEmail.toLowerCase() });

      if (userError || !userData) {
        console.log("⚠️ User not found in database:", { email: customerEmail, error: userError });
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const userId = userData.id;
      const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'past_due';

      // Get subscription pricing
      const price = subscription.items?.data[0]?.price;
      const amount = price?.unit_amount || null;
      const currency = price?.currency || 'usd';

      // Update subscription in database
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId as string,
          stripe_subscription_id: subscription.id,
          is_active: isActive,
          subscription_status: subscriptionStatus,
          amount: amount,
          currency: currency,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error("❌ Error updating subscription:", updateError);
      } else {
        console.log("✅ Subscription status updated:", { userId, status: subscriptionStatus });
      }
    }

    // Handle subscription deletion/cancellation
    else if (event.type === "customer.subscription.deleted") {
      console.log("❌ Subscription deleted event");

      const subscription = event.data.object;
      const customerId = subscription.customer;

      console.log("📄 Subscription deleted:", {
        subscriptionId: subscription.id,
        customerId
      });

      // Get customer email from Stripe
      const customer = await stripe.customers.retrieve(customerId as string);
      if (!customer || typeof customer === 'string' || customer.deleted) {
        console.log("⚠️ Customer not found or deleted:", customerId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const customerEmail = customer.email;
      if (!customerEmail) {
        console.log("⚠️ No email found for customer:", customerId);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_by_email', { p_email: customerEmail.toLowerCase() });

      if (userError || !userData) {
        console.log("⚠️ User not found in database:", { email: customerEmail, error: userError });
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const userId = userData.id;

      // Mark subscription as inactive
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          is_active: false,
          subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error("❌ Error marking subscription as canceled:", updateError);
      } else {
        console.log("✅ Subscription marked as canceled for user:", userId);
      }
    }


    // Return a 200 response to acknowledge receipt of the event
    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
