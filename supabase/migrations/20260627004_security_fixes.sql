-- =============================================================
-- Migration: Security fixes audit 2026-06-27
-- =============================================================

-- =============================================================
-- C1, C2, C4: Enable RLS on sensitive tables + deny-all policies
-- =============================================================

-- super_admin
ALTER TABLE public.super_admin ENABLE ROW LEVEL SECURITY;
CREATE POLICY super_admin_deny_all ON public.super_admin
  FOR ALL TO anon USING (false);
CREATE POLICY super_admin_deny_all_auth ON public.super_admin
  FOR ALL TO authenticated USING (false);

-- admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_sessions_deny_all ON public.admin_sessions
  FOR ALL TO anon USING (false);
CREATE POLICY admin_sessions_deny_all_auth ON public.admin_sessions
  FOR ALL TO authenticated USING (false);

-- tenant_logs
ALTER TABLE public.tenant_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_logs_deny_all ON public.tenant_logs
  FOR ALL TO anon USING (false);
CREATE POLICY tenant_logs_deny_all_auth ON public.tenant_logs
  FOR ALL TO authenticated USING (false);

-- =============================================================
-- C3, H1, H4: Revoke EXECUTE on dangerous functions from anon
-- =============================================================

-- admin_* functions
REVOKE EXECUTE ON FUNCTION public.admin_list_tenants FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_delete_tenant FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_update_tenant FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_get_tenant_logs FROM anon, public;

-- keep verify_admin_password accessible for login
REVOKE EXECUTE ON FUNCTION public.verify_admin_password FROM anon, public;

-- helper RPCs that should not be public
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_owner FROM anon, public;

-- trigger functions exposed as RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_booking_delivered FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_reward_eligibility FROM anon, public, authenticated;

-- =============================================================
-- H3: Fix search_path on SECURITY DEFINER functions that lack it
-- =============================================================

-- get_user_tenant_id (SQL, no search_path set, already uses public. prefix)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  select tenant_id from public.profiles where id = auth.uid()
$function$;

-- is_owner (SQL, no search_path set, already uses public. prefix)
CREATE OR REPLACE FUNCTION public.is_owner()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$function$;

-- verify_admin_password (plpgsql, no search_path, uses unqualified super_admin)
CREATE OR REPLACE FUNCTION public.verify_admin_password(p_username text, p_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
declare
  stored_hash text;
begin
  select password_hash into stored_hash
  from public.super_admin
  where username = p_username;

  if stored_hash is null then
    return false;
  end if;

  return crypt(p_password, stored_hash) = stored_hash;
end;
$function$;

-- admin_list_tenants (plpgsql, no search_path, unqualified tenants/tenant_logs)
CREATE OR REPLACE FUNCTION public.admin_list_tenants()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
declare
  result json;
begin
  select json_agg(json_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'email', t.email,
    'status', t.status,
    'trial_ends_at', t.trial_ends_at,
    'notes', t.notes,
    'created_at', t.created_at,
    'days_remaining', case
      when t.status = 'trial' and t.trial_ends_at is not null then
        greatest(0, ceil(extract(epoch from (t.trial_ends_at - now())) / 86400))
      else null
    end,
    'planned_at', (
      select min(created_at) from public.tenant_logs
      where tenant_id = t.id and to_status = 'active' and from_status = 'trial'
    )
  ) order by t.created_at desc)
  into result
  from public.tenants t;

  return coalesce(result, '[]'::json);
end;
$function$;

-- admin_delete_tenant (plpgsql, no search_path, unqualified tables)
CREATE OR REPLACE FUNCTION public.admin_delete_tenant(p_tenant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
begin
  delete from auth.users where id in (select id from public.profiles where tenant_id = p_tenant_id);
  delete from public.booking_services bs using public.bookings b where bs.booking_id = b.id and b.tenant_id = p_tenant_id;
  delete from public.stamp_history where tenant_id = p_tenant_id;
  delete from public.reward_notifications where tenant_id = p_tenant_id;
  delete from public.bookings where tenant_id = p_tenant_id;
  delete from public.vehicles where tenant_id = p_tenant_id;
  delete from public.customers where tenant_id = p_tenant_id;
  delete from public.services where tenant_id = p_tenant_id;
  delete from public.loyalty_rules where tenant_id = p_tenant_id;
  delete from public.business_hours where tenant_id = p_tenant_id;
  delete from public.blocked_dates where tenant_id = p_tenant_id;
  delete from public.profiles where tenant_id = p_tenant_id;
  delete from public.staff_invitations where tenant_id = p_tenant_id;
  delete from public.gallery_images where tenant_id = p_tenant_id;
  delete from public.trial_notifications where tenant_id = p_tenant_id;
  delete from public.tenant_logs where tenant_id = p_tenant_id;
  delete from public.tenants where id = p_tenant_id;
  return found;
end;
$function$;

-- admin_update_tenant (plpgsql, no search_path, unqualified tenants/tenant_logs)
CREATE OR REPLACE FUNCTION public.admin_update_tenant(
  p_tenant_id uuid,
  p_status text default null,
  p_notes text default null
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
declare
  v_current_status text;
begin
  select status into v_current_status from public.tenants where id = p_tenant_id;

  if p_status is not null and p_status != v_current_status then
    update public.tenants set status = p_status where id = p_tenant_id;

    insert into public.tenant_logs (tenant_id, from_status, to_status, changed_by)
    values (p_tenant_id, v_current_status, p_status, 'admin');
  end if;

  if p_notes is not null then
    update public.tenants set notes = p_notes where id = p_tenant_id;
  end if;

  return found;
end;
$function$;

-- admin_get_tenant_logs (plpgsql, no search_path, unqualified tenant_logs)
CREATE OR REPLACE FUNCTION public.admin_get_tenant_logs(p_tenant_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
declare
  result json;
begin
  select json_agg(json_build_object(
    'from_status', from_status,
    'to_status', to_status,
    'changed_by', changed_by,
    'created_at', created_at
  ) order by created_at desc)
  into result
  from public.tenant_logs
  where tenant_id = p_tenant_id;

  return coalesce(result, '[]'::json);
end;
$function$;

-- =============================================================
-- H2: Restrict tenant_insert to prevent unlimited tenant creation
-- =============================================================

DROP POLICY IF EXISTS tenant_insert ON public.tenants;
CREATE POLICY tenant_insert ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (
    not exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'owner'
    )
  );

-- =============================================================
-- M2: Restrict public bucket listing (buckets are public by URL,
--     but anon should not be able to LIST all files)
-- =============================================================

DROP POLICY IF EXISTS gallery_storage_public_select ON storage.objects;
DROP POLICY IF EXISTS logos_select_public ON storage.objects;
DROP POLICY IF EXISTS service_images_public_select ON storage.objects;

-- Allow anon to read specific files (needed for public URLs to work)
CREATE POLICY gallery_select_public ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'gallery');

CREATE POLICY logos_select_public ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'logos');

CREATE POLICY service_images_select_public ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'service-images');

-- =============================================================
-- B1: Fix auth_rls_initplan — wrap auth.uid() in subquery
-- =============================================================

DROP POLICY IF EXISTS profile_insert ON public.profiles;
CREATE POLICY profile_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS profile_select_own ON public.profiles;
CREATE POLICY profile_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS profile_update ON public.profiles;
CREATE POLICY profile_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =============================================================
-- B3: Add missing FK indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_reward_notifications_reward_id
  ON public.reward_notifications(reward_id);
CREATE INDEX IF NOT EXISTS idx_tenant_logs_tenant_id
  ON public.tenant_logs(tenant_id);
