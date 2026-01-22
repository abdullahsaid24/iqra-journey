-- Create a function to get users by a list of emails
CREATE OR REPLACE FUNCTION public.get_users_by_emails(p_emails TEXT[])
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::TEXT
  FROM auth.users u
  WHERE LOWER(u.email) = ANY(p_emails);
END;
$$;
