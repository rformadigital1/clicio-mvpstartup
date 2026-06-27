-- Add subscription columns to tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'paused', 'cancelled')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create super_admin table
CREATE TABLE IF NOT EXISTS super_admin (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id BIGSERIAL PRIMARY KEY,
  token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '24 hours'
);

-- Create trial_notifications table
CREATE TABLE IF NOT EXISTS trial_notifications (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  dismissed BOOLEAN DEFAULT false,
  UNIQUE (tenant_id, date)
);

-- Update trigger for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO tenants (name, slug, status, trial_ends_at)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Taller sin nombre'),
    COALESCE(NEW.raw_user_meta_data ->> 'slug', 'taller-' || substr(NEW.id::text, 1, 8)),
    'trial',
    now() + interval '14 days'
  );

  INSERT INTO profiles (id, email, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    'owner',
    (SELECT id FROM tenants ORDER BY id DESC LIMIT 1)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
