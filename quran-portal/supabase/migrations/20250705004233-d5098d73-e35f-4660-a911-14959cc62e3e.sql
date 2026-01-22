-- Insert a test subscription to verify the system works
INSERT INTO user_subscriptions (user_id, stripe_customer_id, stripe_subscription_id, is_active) 
VALUES ('04e3ee12-b1eb-461c-8b68-b060b45882a9', 'cus_test123', 'sub_test123', true);