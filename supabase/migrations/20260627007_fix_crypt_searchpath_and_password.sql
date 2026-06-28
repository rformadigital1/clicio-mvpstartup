-- Fix verify_admin_password: crypt() lives in extensions schema, not public
-- SET search_path = '' hides it. Use extensions.crypt() instead.
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

  return extensions.crypt(p_password, stored_hash) = stored_hash;
end;
$function$;

-- Fix broken password hash: re-hash with proper bcrypt
-- Password already fixed via change_admin_password RPC. This migration
-- corrected the function that verifies it — the stored hash is fine.
