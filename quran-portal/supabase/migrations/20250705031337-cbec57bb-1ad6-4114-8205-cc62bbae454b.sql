-- Create table to track payment failure notifications to prevent spam
CREATE TABLE public.payment_failure_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  payment_intent_id TEXT,
  invoice_id TEXT,
  notification_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_failure_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all notifications
CREATE POLICY "Admins can view payment failure notifications" 
ON public.payment_failure_notifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Policy for system to insert notifications
CREATE POLICY "System can insert payment failure notifications" 
ON public.payment_failure_notifications 
FOR INSERT 
WITH CHECK (true);

-- Add index for efficient lookups
CREATE INDEX idx_payment_failure_notifications_customer_id ON public.payment_failure_notifications(stripe_customer_id);
CREATE INDEX idx_payment_failure_notifications_created_at ON public.payment_failure_notifications(created_at);