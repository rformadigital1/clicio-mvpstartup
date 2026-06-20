# Fase 2 — Gestión de Staff (Equipo)

## Resumen

Dueño invita empleados por código, empleado se registra con ese código, obtiene role `staff` con permisos limitados (solo gestionar reservas + ver clientes).

---

## Schema

### Nueva tabla: `staff_invitations`

```sql
create table if not exists staff_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null unique,
  used boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

alter table staff_invitations enable row level security;

-- Solo owner del tenant puede ver/gestionar invitaciones
create policy "staff_invitations_select" on staff_invitations for select to authenticated
  using (tenant_id = public.get_user_tenant_id() and public.is_owner());
create policy "staff_invitations_insert" on staff_invitations for insert to authenticated
  with check (tenant_id = public.get_user_tenant_id() and public.is_owner());
create policy "staff_invitations_update" on staff_invitations for update to authenticated
  using (tenant_id = public.get_user_tenant_id() and public.is_owner())
  with check (tenant_id = public.get_user_tenant_id() and public.is_owner());
create policy "staff_invitations_delete" on staff_invitations for delete to authenticated
  using (tenant_id = public.get_user_tenant_id() and public.is_owner());

create index if not exists idx_staff_invitations_tenant_id on staff_invitations(tenant_id);
create index if not exists idx_staff_invitations_code on staff_invitations(code);
```

### Nueva función helper: `is_owner()`

```sql
create or replace function public.is_owner()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

revoke execute on function public.is_owner from anon, public;
grant execute on function public.is_owner to authenticated;
```

### Trigger modificado: `handle_new_user`

```sql
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_tenant_id uuid;
  v_tenant_slug text;
  v_invite record;
begin
  -- Staff invite flow
  if new.raw_user_meta_data ? 'invite_code' then
    select * into v_invite from public.staff_invitations
    where code = new.raw_user_meta_data ->> 'invite_code'
      and used = false
      and expires_at > now();

    if found then
      update public.staff_invitations set used = true where id = v_invite.id;
      insert into public.profiles (id, tenant_id, email, role)
      values (new.id, v_invite.tenant_id, new.email, 'staff');
      return new;
    end if;
  end if;

  -- Normal flow: create tenant + owner
  v_tenant_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'taller_nombre', 'taller'),
    '[^a-z0-9]+', '-', 'g'
  ));
  v_tenant_slug := v_tenant_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.tenants (name, slug, email)
  values (
    coalesce(new.raw_user_meta_data ->> 'taller_nombre', 'Mi Taller'),
    v_tenant_slug,
    new.email
  )
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, email, role)
  values (new.id, v_tenant_id, new.email, 'owner');

  return new;
end;
$$;
```

### RLS restrictivas para staff

Se agrega `and public.is_owner()` en policies de DELETE/UPDATE donde staff no debe operar:

| Tabla | Operación | Solo owner |
|-------|-----------|------------|
| services | DELETE | sí |
| customers | DELETE | sí |
| loyalty_rules | DELETE, INSERT, UPDATE | sí |
| business_hours | INSERT, UPDATE, DELETE | sí |
| blocked_dates | INSERT, DELETE | sí |
| tenants | UPDATE | sí |

Ejemplo:
```sql
drop policy if exists "service_delete" on services;
create policy "service_delete" on services for delete to authenticated using (
  tenant_id = public.get_user_tenant_id() and public.is_owner()
);
```

---

## Flujo de invitación

1. Owner va a Settings → Equipo → "Generar código"
2. Sistema crea `staff_invitations` con UUID aleatorio, expiry 7 días
3. Owner copia link: `{origin}/join?code=XXXXXXXX`
4. Owner comparte link con empleado (WhatsApp, email, etc.)
5. Empleado abre link → ve formulario: email + contraseña + código oculto
6. Empleado se registra → `supabase.auth.signUp()` con `invite_code` en `user_metadata`
7. Trigger `handle_new_user` detecta código, valida, consume, crea profile `staff`
8. Empleado redirigido a signin, accede con dashboard limitado

---

## Frontend

### Nueva página: `/join`

Ruta pública, similar a signup pero más simple:
- Lee `?code=` de URL
- Campos: email, password, nombre (opcional)
- Código en hidden input + `user_metadata`
- Submit → `supabase.auth.signUp()` → redirect a `/signin?staff_ok=true`

### Layout: filtro de navegación por role

```typescript
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "staff"] },
  { href: "/dashboard/bookings", label: "Agenda", icon: Calendar, roles: ["owner", "staff"] },
  { href: "/dashboard/customers", label: "Clientes", icon: Users, roles: ["owner", "staff"] },
  { href: "/dashboard/services", label: "Servicios", icon: Car, roles: ["owner"] },
  { href: "/dashboard/loyalty", label: "Fidelización", icon: Gift, roles: ["owner"] },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings, roles: ["owner"] },
  { href: "/dashboard/settings?tab=staff", label: "Equipo", icon: Users, roles: ["owner"] },
]
```

Staff solo ve: Dashboard, Agenda, Clientes.
Owner ve todo + "Equipo" en settings.

### Página Settings: sección Equipo

Nueva sección al final de settings:
- **Lista de miembros actuales** (tabla con nombre, email, role, fecha)
- **Botón "Generar código"** → crea invitación, muestra modal con código + link copiable
- **Botón "Eliminar"** junto a cada miembro staff (AlertDialog confirmación)
- Solo visible para owner

### Restricciones en páginas

- **Bookings:** staff no ve botones de eliminar reserva (si existen)
- **Customers:** staff no ve botones editar/eliminar
- **Services/Loyalty/Settings:** si staff accede directo por URL → redirect a `/dashboard`

Cargar role del usuario al inicio del layout y pasar a páginas hijas via contexto o prop.

---

## UI/UX

Siguiendo diseño existente (shadcn, DashboardLayout, Cards). Consistente con Fase 1.

- Modal generación código: Dialog con código grande + botón copiar
- Lista equipo: tabla simple con avatar, email, role badge, fecha
- Form `/join`: minimalista, mismo estilo que signup

---

## Implementación

### Orden de cambios

1. DB: función `is_owner()`, tabla `staff_invitations`, RLS restrictivas, trigger modificado
2. Frontend: cargar role en layout, filtrar nav
3. Frontend: página `/join`
4. Frontend: sección Equipo en settings
5. Frontend: restricciones en bookings/customers
6. Schema file: actualizar `supabase-schema.sql`
7. Build + push

### Consideraciones de seguridad

- `is_owner()` es SECURITY DEFINER pero solo lee `profiles.role`, no expone datos sensibles
- Códigos de invitación son UUID aleatorios (imposible de adivinar)
- Staff no puede crear más invitaciones ni modificar settings
- RLS en DB como defensa en profundidad (no solo frontend)
- Trigger solo usa `raw_user_meta_data` en INSERT (no reevalúa después)
