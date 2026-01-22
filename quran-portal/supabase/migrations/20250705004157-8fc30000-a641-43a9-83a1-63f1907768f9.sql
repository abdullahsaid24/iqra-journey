-- Drop and recreate the RPC function with correct types
DROP FUNCTION IF EXISTS public.get_user_by_email(TEXT);

CREATE OR REPLACE FUNCTION public.get_user_by_email(p_email TEXT)
RETURNS TABLE(id UUID, email VARCHAR(255))
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email
    FROM auth.users u
    WHERE u.email = p_email
    LIMIT 1;
END;
$$;