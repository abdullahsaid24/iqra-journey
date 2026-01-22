-- Add subscription_status column to track the actual Stripe status
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';