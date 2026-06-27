-- Revoke admin_* and verify_admin_password from authenticated role
-- Login API route now uses service_role key, no longer needs anon/pub/authenticated access
REVOKE EXECUTE ON FUNCTION public.admin_list_tenants FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_tenant FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_tenant FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_tenant_logs FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_admin_password FROM authenticated;
