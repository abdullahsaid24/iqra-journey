import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import twilio from "npm:twilio@4.21.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to validate and format phone numbers
const formatPhone = (phone: string | null): string | null => {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/(?!^\+)[^\d]/g, '');
    if (!cleaned.startsWith('+')) {
        cleaned = '+1' + cleaned;
    }
    return cleaned.length >= 11 ? cleaned : null;
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Twilio
    const twilioClient = twilio(
        Deno.env.get("TWILIO_ACCOUNT_SID"),
        Deno.env.get("TWILIO_AUTH_TOKEN")
    );
    const twilioPhone = '+15874093011';

    try {
        const { customerId, action } = await req.json();

        console.log("[SEND-REMINDER] Request:", { customerId, action });

        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

        // Friendly reminder message (160 chars = 1 Twilio segment)
        const message = `Iqra Dugsi: Your payment failed. Update card at billing.stripe.com/p/login/fZe5mSaqA5iB4I84gg with signup email. Questions? 780-996-7950`;

        if (action === "send_to_all_past_due") {
            // Get all past_due subscriptions from Stripe
            const pastDueSubscriptions = await stripe.subscriptions.list({
                status: "past_due",
                limit: 100,
                expand: ['data.customer']
            });

            console.log(`[SEND-REMINDER] Found ${pastDueSubscriptions.data.length} past due subscriptions`);

            let sentCount = 0;
            let errorCount = 0;
            const results = [];

            for (const subscription of pastDueSubscriptions.data) {
                const customer = subscription.customer as Stripe.Customer;
                let phone = customer.phone;
                const email = customer.email;

                // If no phone in Stripe, look up from database
                if (!phone && email) {
                    console.log(`[SEND-REMINDER] No phone in Stripe for ${email}, checking database...`);

                    // Get user by email
                    const { data: userData } = await supabase
                        .rpc('get_user_by_email', { p_email: email.toLowerCase() });

                    if (userData && userData.length > 0) {
                        const userId = userData[0].id;

                        // Check parent_student_links
                        const { data: phoneData } = await supabase
                            .from('parent_student_links')
                            .select('phone_number, secondary_phone_number')
                            .eq('parent_user_id', userId)
                            .limit(1);

                        if (phoneData && phoneData.length > 0) {
                            phone = phoneData[0].phone_number || phoneData[0].secondary_phone_number;
                        }

                        // Check notification_preferences if still no phone
                        if (!phone) {
                            const { data: prefData } = await supabase
                                .from('notification_preferences')
                                .select('phone_number')
                                .eq('parent_user_id', userId)
                                .limit(1);

                            if (prefData && prefData.length > 0) {
                                phone = prefData[0].phone_number;
                            }
                        }

                        if (phone) {
                            console.log(`[SEND-REMINDER] Found phone in database for ${email}: ${phone}`);
                        }
                    }
                }

                if (!phone) {
                    console.log(`[SEND-REMINDER] No phone found anywhere for: ${email}`);
                    results.push({ email, status: 'no_phone' });
                    continue;
                }

                // Format the phone number
                const formattedPhone = formatPhone(phone);
                if (!formattedPhone) {
                    console.log(`[SEND-REMINDER] Invalid phone format for: ${email} (${phone})`);
                    results.push({ email, phone, status: 'invalid_phone' });
                    continue;
                }

                try {
                    // Send SMS directly via Twilio
                    console.log(`[SEND-REMINDER] Sending SMS to ${formattedPhone} (${email})`);

                    const twilioMessage = await twilioClient.messages.create({
                        body: message,
                        from: twilioPhone,
                        to: formattedPhone
                    });

                    console.log(`[SEND-REMINDER] SMS sent successfully! SID: ${twilioMessage.sid}`);
                    sentCount++;
                    results.push({ email, phone: formattedPhone, status: 'sent', sid: twilioMessage.sid });
                } catch (smsError) {
                    const errorMsg = smsError instanceof Error ? smsError.message : String(smsError);
                    console.error(`[SEND-REMINDER] SMS failed for ${formattedPhone}:`, errorMsg);
                    errorCount++;
                    results.push({ email, phone: formattedPhone, status: 'failed', error: errorMsg });
                }
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    total_past_due: pastDueSubscriptions.data.length,
                    sent: sentCount,
                    errors: errorCount,
                    results
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );

        } else if (action === "send_to_one" && customerId) {
            // Send to a specific customer
            const customer = await stripe.customers.retrieve(customerId);

            if (typeof customer === 'string' || customer.deleted) {
                throw new Error("Customer not found");
            }

            if (!customer.phone) {
                return new Response(
                    JSON.stringify({ success: false, error: "No phone number for this customer" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
                );
            }

            const smsResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: customer.phone,
                    message: message
                })
            });

            if (smsResponse.ok) {
                return new Response(
                    JSON.stringify({ success: true, sent_to: customer.email, phone: customer.phone }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
                );
            } else {
                const errorText = await smsResponse.text();
                throw new Error(errorText);
            }

        } else if (action === "clear_old_notifications") {
            // Clear notifications older than 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('payment_failure_notifications')
                .delete()
                .lt('created_at', thirtyDaysAgo.toISOString())
                .select();

            if (error) throw error;

            return new Response(
                JSON.stringify({
                    success: true,
                    message: `Cleared ${data?.length || 0} old notifications (older than 30 days)`
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );

        } else {
            throw new Error("Invalid action. Use: send_to_all_past_due, send_to_one, or clear_old_notifications");
        }

    } catch (error) {
        console.error("[SEND-REMINDER] Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
