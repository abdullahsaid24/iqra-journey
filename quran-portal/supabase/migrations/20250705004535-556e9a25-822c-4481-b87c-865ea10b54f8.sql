-- Create a function to get all user subscriptions with their roles
CREATE OR REPLACE FUNCTION public.get_all_user_subscriptions()
RETURNS TABLE(
  email VARCHAR(255),
  role app_role,
  is_subscribed BOOLEAN,
  stripe_customer_id TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.email,
    ur.role,
    COALESCE(us.is_active, false) as is_subscribed,
    us.stripe_customer_id,
    us.updated_at
  FROM auth.users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  LEFT JOIN user_subscriptions us ON u.id = us.user_id
  ORDER BY u.created_at DESC;
END;
$$;