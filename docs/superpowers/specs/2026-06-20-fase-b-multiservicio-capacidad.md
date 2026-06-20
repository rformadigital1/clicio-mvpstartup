# Fase B — Multi-servicio por reserva + Validación de capacidad

**Fecha:** 2026-06-20
**Estado:** Aprobado

## Resumen

Una reserva puede tener múltiples servicios. El validador de disponibilidad usa la duración total de los servicios seleccionados para evitar superposición de horarios.

## Approach seleccionado

Junction table `booking_services`. Es normalizado, tiene FK constraints, RLS directo, consultas simples.

## DB Schema

### Nueva tabla

```sql
create table public.booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade
);
```

- `ON DELETE CASCADE` en booking_id: si se elimina una reserva, sus servicios asociados también.
- Sin unique(booking_id, service_id) — no debería haber duplicados pero no bloqueamos (pueden querer el mismo servicio 2 veces? No, pero lo manejamos desde app).

### Cambios en bookings

- `service_id` en bookings pasa a ser nullable (ALTER COLUMN DROP NOT NULL)
- No eliminamos la columna por backwards compatibilidad

### Migración de datos existentes

```sql
-- Crear booking_services desde bookings existentes
insert into booking_services (booking_id, service_id)
  select id, service_id from bookings where service_id is not null;
```

### Índices

```sql
create index idx_booking_services_booking_id on booking_services(booking_id);
create index idx_booking_services_service_id on booking_services(service_id);
```

### RLS

```sql
alter table booking_services enable row level security;

-- Authenticated: mismo tenant que booking
create policy "booking_services_select" on booking_services for select
  to authenticated
  using (booking_id in (select id from bookings where tenant_id = get_user_tenant_id()));

create policy "booking_services_insert" on booking_services for insert
  to authenticated
  with check (booking_id in (select id from bookings where tenant_id = get_user_tenant_id()));

create policy "booking_services_delete" on booking_services for delete
  to authenticated
  using (booking_id in (select id from bookings where tenant_id = get_user_tenant_id()));

-- Anon: puede insertar (booking público) via booking
create policy "booking_services_anon_insert" on booking_services for insert
  to anon
  with check (true);
```

## Types

```typescript
export interface BookingService {
  id: string
  booking_id: string
  service_id: string
}

// Booking.services ya existe como Service[] opcional
// Booking.service_id pasa a nullable en types
```

## Availability

`checkAvailability()` cambia de firma:

```typescript
// Antes
checkAvailability(tenantId: string, date: string, time: string)

// Después
checkAvailability(
  tenantId: string,
  date: string,
  time: string,
  serviceIds?: string[]  // opcional, si no se pasa no valida capacidad
)
```

Lógica nueva:
1. Si no se pasan serviceIds, comportamiento anterior (sin cambio)
2. Si se pasan, calcular duración total desde tabla services
3. Calcular hora_fin = time + duración_total
4. Traer bookings del día con sus servicios via booking_services + services
5. Para cada booking, calcular su slot (booking_time + duración_total de sus servicios)
6. Si nuevo slot se superpone con alguno existente → unavailable
7. Si no → available

La superposición se define como:
- nuevo_inicio < existente_fin AND nuevo_fin > existente_inicio

## UI — Booking público

### Selector de servicios (checkboxes)

Reemplazar el `<Select>` actual por checkboxes:

```
□ Cambio aceite       $25.000   30min
□ Frenos              $45.000   60min
□ Alineación          $30.000   45min
  ─────────────────────────────
  Total: $100.000     Tiempo: 2h 15min
```

- Cada servicio es un checkbox con label, precio, duración
- Al seleccionar/deseleccionar, recalcular total $ y tiempo
- El submit envía array de service_ids
- Tras crear booking, insertar en booking_services

### Dashboard — Nueva reserva

Mismo patrón: checkboxes en vez de select.

### Dashboard — Detalle de reserva

Mostrar lista de servicios en vez de uno solo:

```
Reserva #123 — Juan Pérez
────────────────────────────
🕐 2026-06-20 10:00 - 12:15
📋 Servicios:
  • Cambio aceite     $25.000
  • Frenos            $45.000
  • Alineación        $30.000
  Total: $100.000
```

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `supabase-schema.sql` | Agregar booking_services table + RLS + índices |
| `src/lib/types.ts` | BookingService interface, Booking.service_id nullable |
| `src/lib/availability.ts` | Nueva lógica de superposición de slots |
| `src/app/[slug]/page.tsx` | Checkboxes multi-servicio, enviar service_ids[] |
| `src/app/dashboard/bookings/page.tsx` | Checkboxes en nueva reserva, mostrar multi-servicio |
| `src/lib/supabase/client.ts` | (sin cambios) |

## No incluido (scope mínimo)

- Editar servicios de una reserva existente (post-MVP)
- Reordenar servicios
- Servicios con cantidad (ej: 2x cambio aceite)
