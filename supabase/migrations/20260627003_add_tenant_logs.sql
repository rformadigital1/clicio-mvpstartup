create table if not exists tenant_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  from_status text,
  to_status text not null,
  changed_by text not null default 'admin',
  created_at timestamptz default now()
);

create or replace function admin_update_tenant(
  p_tenant_id uuid,
  p_status text default null,
  p_notes text default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_current_status text;
begin
  select status into v_current_status from tenants where id = p_tenant_id;

  if p_status is not null and p_status != v_current_status then
    update tenants set status = p_status where id = p_tenant_id;

    insert into tenant_logs (tenant_id, from_status, to_status, changed_by)
    values (p_tenant_id, v_current_status, p_status, 'admin');
  end if;

  if p_notes is not null then
    update tenants set notes = p_notes where id = p_tenant_id;
  end if;

  return found;
end;
$$;

grant execute on function admin_update_tenant to anon, public;

create or replace function admin_get_tenant_logs(p_tenant_id uuid)
returns json
language plpgsql
security definer
as $$
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
  from tenant_logs
  where tenant_id = p_tenant_id;

  return coalesce(result, '[]'::json);
end;
$$;

grant execute on function admin_get_tenant_logs to anon, public;

create or replace function admin_list_tenants()
returns json
language plpgsql
security definer
as $$
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
      select min(created_at) from tenant_logs
      where tenant_id = t.id and to_status = 'active' and from_status = 'trial'
    )
  ) order by t.created_at desc)
  into result
  from tenants t;

  return coalesce(result, '[]'::json);
end;
$$;

grant execute on function admin_list_tenants to anon, public;

create or replace function admin_delete_tenant(p_tenant_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  delete from booking_services bs using bookings b where bs.booking_id = b.id and b.tenant_id = p_tenant_id;
  delete from stamp_history where tenant_id = p_tenant_id;
  delete from reward_notifications where tenant_id = p_tenant_id;
  delete from bookings where tenant_id = p_tenant_id;
  delete from vehicles where tenant_id = p_tenant_id;
  delete from customers where tenant_id = p_tenant_id;
  delete from services where tenant_id = p_tenant_id;
  delete from loyalty_rules where tenant_id = p_tenant_id;
  delete from business_hours where tenant_id = p_tenant_id;
  delete from blocked_dates where tenant_id = p_tenant_id;
  delete from profiles where tenant_id = p_tenant_id;
  delete from staff_invitations where tenant_id = p_tenant_id;
  delete from gallery_images where tenant_id = p_tenant_id;
  delete from trial_notifications where tenant_id = p_tenant_id;
  delete from tenant_logs where tenant_id = p_tenant_id;
  delete from tenants where id = p_tenant_id;
  return found;
end;
$$;

grant execute on function admin_delete_tenant to anon, public;
