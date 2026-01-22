import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

        // Initialize Supabase client for phone lookups
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        console.log("[GET-STRIPE-CUSTOMERS] Fetching all subscriptions from Stripe...");

        // Get all subscriptions from Stripe with different statuses
        const [activeSubscriptions, pastDueSubscriptions, unpaidSubscriptions, canceledSubscriptions] = await Promise.all([
            stripe.subscriptions.list({ status: "active", limit: 100, expand: ['data.customer'] }),
            stripe.subscriptions.list({ status: "past_due", limit: 100, expand: ['data.customer'] }),
            stripe.subscriptions.list({ status: "unpaid", limit: 100, expand: ['data.customer'] }),
            stripe.subscriptions.list({ status: "canceled", limit: 100, expand: ['data.customer'] })
        ]);

        const allSubscriptions = [
            ...activeSubscriptions.data,
            ...pastDueSubscriptions.data,
            ...unpaidSubscriptions.data,
            ...canceledSubscriptions.data
        ];

        console.log(`[GET-STRIPE-CUSTOMERS] Found ${allSubscriptions.length} total subscriptions`);

        // Get all phone numbers from parent_student_links and notification_preferences
        const { data: phoneData } = await supabase
            .from('parent_student_links')
            .select('parent_user_id, phone_number, secondary_phone_number');

        const { data: prefData } = await supabase
            .from('notification_preferences')
            .select('parent_user_id, phone_number');

        // Create phone lookup maps by user ID
        const phoneByUserId = new Map();
        if (phoneData) {
            for (const row of phoneData) {
                if (row.phone_number || row.secondary_phone_number) {
                    phoneByUserId.set(row.parent_user_id, row.phone_number || row.secondary_phone_number);
                }
            }
        }
        if (prefData) {
            for (const row of prefData) {
                if (row.phone_number && !phoneByUserId.has(row.parent_user_id)) {
                    phoneByUserId.set(row.parent_user_id, row.phone_number);
                }
            }
        }

        // Get user IDs by email for lookup
        const emails = allSubscriptions.map(s => {
            const customer = s.customer as Stripe.Customer;
            return customer.email?.toLowerCase();
        }).filter(Boolean);

        const { data: usersData } = await supabase
            .rpc('get_users_by_emails', { p_emails: emails });

        // Create email to phone lookup
        const phoneByEmail = new Map();
        if (usersData) {
            for (const user of usersData) {
                const phone = phoneByUserId.get(user.id);
                if (phone) {
                    phoneByEmail.set(user.email.toLowerCase(), phone);
                }
            }
        }

        // Process each subscription into a customer record
        const customers = allSubscriptions.map(subscription => {
            const customer = subscription.customer as Stripe.Customer;
            const price = subscription.items?.data[0]?.price;
            const email = customer.email?.toLowerCase() || '';

            // Get phone from Stripe first, then fallback to database
            let phone = customer.phone || null;
            if (!phone && email) {
                phone = phoneByEmail.get(email) || null;
            }

            return {
                stripe_customer_id: customer.id,
                email: customer.email || 'No email',
                name: customer.name || customer.email || 'Unknown',
                phone: phone,
                phone_source: customer.phone ? 'stripe' : (phone ? 'database' : null),
                subscription_id: subscription.id,
                subscription_status: subscription.status,
                amount: price?.unit_amount || null,
                currency: price?.currency || 'usd',
                created: subscription.created ? new Date(subscription.created * 1000).toISOString() : null,
                current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
            };
        });

        // Group by status
        const active = customers.filter(c => c.subscription_status === 'active');
        const pastDue = customers.filter(c => c.subscription_status === 'past_due');
        const failed = customers.filter(c => c.subscription_status === 'unpaid' || c.subscription_status === 'canceled');
        const other = customers.filter(c =>
            c.subscription_status !== 'active' &&
            c.subscription_status !== 'past_due' &&
            c.subscription_status !== 'unpaid' &&
            c.subscription_status !== 'canceled'
        );

        // Count customers with phones
        const withPhone = customers.filter(c => c.phone).length;

        console.log(`[GET-STRIPE-CUSTOMERS] Active: ${active.length}, Past Due: ${pastDue.length}, Failed: ${failed.length}, Other: ${other.length}, With Phone: ${withPhone}`);

        return new Response(
            JSON.stringify({
                success: true,
                total: customers.length,
                with_phone: withPhone,
                customers,
                summary: {
                    active: active.length,
                    past_due: pastDue.length,
                    failed: failed.length,
                    other: other.length
                }
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[GET-STRIPE-CUSTOMERS] ERROR:", errorMessage);

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
