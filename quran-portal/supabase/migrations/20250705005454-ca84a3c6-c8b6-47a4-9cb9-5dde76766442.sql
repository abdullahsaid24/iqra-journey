-- Create a function to get parent subscriptions with their children and payment amounts
CREATE OR REPLACE FUNCTION public.get_parent_subscriptions()
RETURNS TABLE(
  email VARCHAR(255),
  is_subscribed BOOLEAN,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  updated_at TIMESTAMPTZ,
  amount INTEGER,
  currency TEXT,
  children JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.email,
    COALESCE(us.is_active, false) as is_subscribed,
    us.stripe_customer_id,
    us.stripe_subscription_id,
    us.subscription_status,
    us.updated_at,
    us.amount,
    us.currency,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', s.name,
            'email', s.email
          )
        )
        FROM parent_student_links psl
        JOIN students s ON s.id = psl.student_id
        WHERE psl.parent_user_id = u.id
      ),
      '[]'::jsonb
    ) as children
  FROM auth.users u
  JOIN user_roles ur ON u.id = ur.user_id
  LEFT JOIN user_subscriptions us ON u.id = us.user_id
  WHERE ur.role = 'parent'
  ORDER BY us.is_active DESC NULLS LAST, u.created_at DESC;
END;
$$;