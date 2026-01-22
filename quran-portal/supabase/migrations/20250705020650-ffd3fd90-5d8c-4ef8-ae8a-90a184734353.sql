-- Add phone_number column to notification_preferences table for parent contact information
ALTER TABLE public.notification_preferences 
ADD COLUMN phone_number TEXT;