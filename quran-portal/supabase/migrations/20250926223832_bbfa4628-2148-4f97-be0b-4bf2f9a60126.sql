-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create table to track monthly reset operations
CREATE TABLE IF NOT EXISTS public.monthly_reset_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.monthly_reset_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view reset logs
CREATE POLICY "Admins can view reset logs" 
ON public.monthly_reset_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create policy for system to insert logs
CREATE POLICY "System can insert reset logs" 
ON public.monthly_reset_logs 
FOR INSERT 
WITH CHECK (true);

-- Schedule the monthly reset to run on the 1st of each month at 2 AM UTC
SELECT cron.schedule(
  'monthly-student-reset',
  '0 2 1 * *', -- At 02:00 on day-of-month 1
  $$
  SELECT
    net.http_post(
        url:='https://kkpfhpwgcyhlbuvjuzjt.supabase.co/functions/v1/monthly-student-reset',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrcGZocHdnY3lobGJ1dmp1emp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDM0NzQzNSwiZXhwIjoyMDU1OTIzNDM1fQ.1rN6a6CDd1brt1qwMYIHGPgBJKVqTJL5ixDfp8ILBAo"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);