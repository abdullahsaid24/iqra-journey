
CREATE OR REPLACE FUNCTION get_user_by_email(p_email TEXT)
RETURNS auth.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT *
        FROM auth.users
        WHERE email = p_email
        LIMIT 1
    );
END;
$$;
