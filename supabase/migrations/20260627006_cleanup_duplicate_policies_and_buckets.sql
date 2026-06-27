-- Drop duplicate policy on super_admin
DROP POLICY IF EXISTS super_admin_no_access ON public.super_admin;

-- Recreate admin_sessions policy cleanly
DROP POLICY IF EXISTS admin_sessions_deny_all ON public.admin_sessions;
CREATE POLICY admin_sessions_deny_all ON public.admin_sessions
  FOR ALL TO anon USING (false);

-- Drop anon SELECT policies on storage buckets (buckets are public, URLs work without listing)
-- The app uses direct image URLs from the DB, not storage.list() on the client
DROP POLICY IF EXISTS gallery_select_public ON storage.objects;
DROP POLICY IF EXISTS logos_select_public ON storage.objects;
DROP POLICY IF EXISTS service_images_select_public ON storage.objects;
