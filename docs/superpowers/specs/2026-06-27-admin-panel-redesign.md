# Admin Panel & Subscription System — Redesign v2

## Overview

Rediseño del panel super admin y corrección de bugs de UX en el sistema de trial/subscription. Objetivos: eliminar confusión de botones, agregar historial de cambios, arreglar pantalla de suspended, mejorar seguridad.

---

## 1. Database Changes

### 1.1 New table: tenant_logs

```sql
create table tenant_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  from_status text,                           -- null on first insert
  to_status text not null,
  changed_by text not null default 'admin',    -- 'admin' | 'system' | 'trial_expired'
  created_at timestamptz default now()
);
```

No se agregan columnas nuevas a `tenants`. La fecha de activación del plan pagado se deduce del primer log `trial → active`.

### 1.2 Updated function: admin_update_tenant()

```sql
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
  -- Get current status for logging
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
```

### 1.3 New function: admin_get_tenant_logs()

```sql
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
```

### 1.4 Updated function: admin_list_tenants()

Add `planned_at` field derived from logs (first `trial → active` transition):

```sql
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
```

---

## 2. Admin Panel UI (`/controlroot`)

### 2.1 Dashboard table

Columns:
- **Taller** — name
- **Email** — email
- **Plan** — dynamic text per status:
  - `trial` → "Prueba: {X} días restantes"
  - `active` → "Plan pagado desde {fecha}"
  - `paused` → "Pausada"
  - `cancelled` → "Cancelada"
- **Estado** — colored badge (same colors as before)
- **Notas** — inline input (unchanged)
- **Acciones** — dropdown menu (replaces button group)

### 2.2 Dropdown actions by status

| Status | Dropdown options |
|--------|-----------------|
| trial | Activar plan pagado · Pausar · Cancelar · Ver historial |
| active | Pausar · Cancelar · Ver historial |
| paused | Activar plan pagado · Cancelar · Ver historial |
| cancelled | Ver historial (disabled if no logs) |

"Activar plan pagado" always transitions to `active`.
"Pausar" always transitions to `paused`.
"Cancelar" always transitions to `cancelled`.

No mutation on cancelled tenants (terminal state).

### 2.3 History modal

Opens a slide-over / dialog showing a timeline:
- Date
- Change: "Trial → Activo" (with arrow)
- Who: "admin"

Styled as a vertical timeline with dots.

### 2.4 New API route

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/tenants/[id]/logs` | GET | Returns tenant_logs as JSON |

### 2.5 Password settings (unchanged)

---

## 3. Fix: `/dashboard/suspended`

### 3.1 Current bug

`/dashboard/suspended` is nested under the dashboard layout. The layout tries to load tenant data, fails silently (user has no active tenant), enters infinite loading state. User never sees the suspended message.

### 3.2 Fix

Move suspended page OUT of the dashboard route group:

```
src/app/
  (suspended)/
    dashboard/
      suspended/
        page.tsx
```

This way it uses its own minimal layout (or no layout at all). No dashboard sidebar, no queries, no loading state.

### 3.3 Content variations

The page shows different messages based on the actual status (queried via middleware or a lightweight API call):

- `paused` → "Tu cuenta está en pausa. Contacta a tu asesor para reactivarla."
- `cancelled` → "Tu cuenta ha sido cancelada."
- `trial` (expired) → "Tu período de prueba terminó. Contacta a tu asesor para activar tu plan."

---

## 4. Fix: Dashboard Layout Loading

### 4.1 Current bug

When tenant is paused, the dashboard layout queries `profiles` and `tenants`. If the query fails or returns no data (RLS, status check), the layout stays in loading state indefinitely.

### 4.2 Fix

- Add early redirect after tenant status check (already partially done)
- Use `router.replace()` instead of `router.push()` for the redirect
- Add a timeout fallback (if loading > 10s, force redirect to suspended)

---

## 5. TrialBanner

- Only renders when `status = trial`
- Hidden when `active`, `paused`, or `cancelled`
- Logic unchanged (GET /api/trial/notification → show if ≤ 7 days)
- Dismissible per day (unchanged)

---

## 6. Security

| Concern | Mitigation |
|---------|-----------|
| Admin bypasses rules | API routes check session cookie + DB. Can't call without valid session |
| RLS bypass | `admin_update_tenant` and `admin_list_tenants` use SECURITY DEFINER — cannot be bypassed |
| Suspended user accesses data | Middleware (edge) + layout (client) + API routes — triple check |
| tenant_logs data leak | Only accessible via SECURITY DEFINER function, not via direct table queries |
| Dropdown shows invalid actions | API route validates status transition. Invalid transitions return 400 |

---

## 7. Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/(suspended)/dashboard/suspended/page.tsx` | Create | Suspended page outside dashboard layout |
| `src/app/api/admin/tenants/[id]/logs/route.ts` | Create | GET tenant history |
| `src/app/controlroot/(protected)/page.tsx` | Rewrite | Dropdown menu instead of button group, "Plan" column, history modal |
| `src/app/api/admin/tenants/route.ts` | Modify | Use new `admin_list_tenants` that includes `planned_at` |
| `src/app/api/admin/tenants/[id]/status/route.ts` | Modify | Return error for invalid transitions |
| `src/app/dashboard/layout.tsx` | Modify | Add loading timeout fallback, redirect fix |
| `src/components/dashboard/trial-banner.tsx` | Modify | Hide on non-trial status |
| `src/app/dashboard/suspended/page.tsx` | Delete | Moved to (suspended) group |

---

## 8. Future (not in scope)

- Payment gateway integration
- Automatic trial→paused via cron
- Email notifications
- Plan tiers
