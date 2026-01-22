
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kkpfhpwgcyhlbuvjuzjt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcGZocHdnY3lobGJ1dmp1emp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDc0MzUsImV4cCI6MjA1NTkyMzQzNX0.ike_WJmlzrTHolTFBfho9Pu1jl83qgatYLNkgivjwws'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFailedPayments() {
    console.log('--- Checking Failed Payments ---')

    // Try querying user_subscriptions directly
    const { data: subs, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .or('is_active.eq.false,subscription_status.in.(past_due,unpaid,canceled)')

    if (subsError) {
        console.error('Error fetching from user_subscriptions:', subsError.message)
    } else {
        console.log('Subscriptions with issues found:', subs?.length || 0)
        subs?.forEach(sub => {
            console.log(`User ID: ${sub.user_id}, Status: ${sub.subscription_status}, Active: ${sub.is_active}`)
        })
    }

    // Try the RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_parent_subscriptions')

    if (rpcError) {
        console.error('Error calling get_parent_subscriptions RPC:', rpcError.message)
    } else {
        const failedOnes = rpcData?.filter((p: any) => !p.is_subscribed || p.subscription_status === 'past_due')
        console.log('\n--- Results from RPC ---')
        console.log('Total parents found:', rpcData?.length || 0)
        console.log('Parents with payment issues:', failedOnes?.length || 0)

        failedOnes?.forEach((p: any) => {
            console.log(`Email: ${p.email}, Status: ${p.subscription_status}, Paying: ${p.is_subscribed}`)
        })
    }
}

checkFailedPayments()
