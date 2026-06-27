-- Seed admin user
INSERT INTO super_admin (username, password_hash)
VALUES (
  'cliciobdl',
  crypt('admin123', gen_salt('bf'))
)
ON CONFLICT (username) DO NOTHING;

-- Create password verification function
CREATE OR REPLACE FUNCTION verify_admin_password(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM super_admin
  WHERE username = p_username;

  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN crypt(p_password, stored_hash) = stored_hash;
END;
$$;

-- Grant execute to anon for admin login
GRANT EXECUTE ON FUNCTION verify_admin_password TO anon, public;
