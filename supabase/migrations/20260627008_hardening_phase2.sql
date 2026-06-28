-- =============================================================
-- Phase 2: Hardening — rate limiting, session control, grants
-- =============================================================

-- 1. Login attempt tracking for rate limiting
create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  ip_address text not null,
  attempted_at timestamptz default now(),
  success boolean not null
);

create index if not exists idx_login_attempts_lookup
  on public.login_attempts (username, ip_address, attempted_at desc);

-- 2. Revoke helper RPCs from authenticated (only used in RLS, never called directly)
revoke execute on function public.get_user_tenant_id from authenticated;
revoke execute on function public.is_owner from authenticated;

-- 3. Admin session cleanup: delete expired sessions on login trigger
create or replace function public.cleanup_admin_sessions()
returns trigger
language plpgsql
security definer set search_path = ''
as $function$
begin
  delete from public.admin_sessions where expires_at < now();
  return new;
end;
$function$;

-- 4. Change admin password function already exists with proper crypt
-- Verify it has access for service_role only
revoke execute on function public.change_admin_password from anon, public, authenticated;
