# Fase B — Multi-servicio + Validación capacidad

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans.

**Goal:** Una reserva puede tener múltiples servicios. `checkAvailability()` evita superposición de horarios.

**Architecture:** Junction table `booking_services` para N:M. Availability calcula duración total y compara slots.

**Tech Stack:** Supabase (Postgres + RLS), Next.js 16, shadcn/ui

## Global Constraints

- RLS usa `get_user_tenant_id()` y `is_owner()` (security definer)
- Anon puede insert en booking_services (booking público)
- `service_id` en bookings pasa a nullable (no drop column)
- Migraciones vía `supabase_apply_migration` tool
- Types en `src/lib/types.ts`
- Español: toda UI
- Build: `npm run build` desde `/home/hp-laptop/Documentos/clicio.app/`

---

### Task 1: DB Migration — booking_services table + service_id nullable + RLS

**Files:**
- Execute: migration vía Supabase MCP

**Interfaces:**
- Produces: tabla `booking_services`, `service_id` nullable, RLS policies, migración datos existentes

- [ ] **Step 1: Ejecutar migration**

```sql
-- Create booking_services junction table
create table public.booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade
);

-- Make service_id nullable in bookings (backwards compat)
alter table public.bookings alter column service_id drop not null;

-- Indexes
create index idx_booking_services_booking_id on public.booking_services(booking_id);
create index idx_booking_services_service_id on public.booking_services(service_id);

-- Migrate existing data
insert into public.booking_services (booking_id, service_id)
  select id, service_id from public.bookings where service_id is not null;

-- Enable RLS
alter table public.booking_services enable row level security;

-- RLS: authenticated can select
create policy "booking_services_select" on public.booking_services for select
  to authenticated
  using (booking_id in (select id from public.bookings where tenant_id = (select get_user_tenant_id())));

-- RLS: authenticated can insert
create policy "booking_services_insert" on public.booking_services for insert
  to authenticated
  with check (booking_id in (select id from public.bookings where tenant_id = (select get_user_tenant_id())));

-- RLS: authenticated can delete
create policy "booking_services_delete" on public.booking_services for delete
  to authenticated
  using (booking_id in (select id from public.bookings where tenant_id = (select get_user_tenant_id())));

-- RLS: anon can insert (public booking)
create policy "booking_services_anon_insert" on public.booking_services for insert
  to anon
  with check (true);
```

- [ ] **Step 2: Verificar migration**

```sql
select count(*) from public.booking_services;
```

---

### Task 2: Types — BookingService interface + Booking actualizado

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Agregar BookingService interface**

```typescript
export interface BookingService {
  id: string
  booking_id: string
  service_id: string
}
```

- [ ] **Step 2: Actualizar Booking.service_id a nullable y agregar booking_services**

```typescript
export interface Booking {
  id: string
  tenant_id: string
  customer_id: string
  service_id?: string  // nullable ahora
  vehicle_id?: string
  booking_date: string
  booking_time: string
  status: BookingStatus
  created_at: string
  customers?: Customer
  services?: Service
  vehicles?: Vehicle
  booking_services?: BookingService[]
}
```

---

### Task 3: Availability — validación de superposición de slots

**Files:**
- Modify: `src/lib/availability.ts`

- [ ] **Step 1: Reescribir checkAvailability**

```typescript
export interface AvailabilityResult {
  available: boolean
  reason?: string
}

export async function checkAvailability(
  tenantId: string,
  date: string,
  time: string,
  serviceIds?: string[]
): Promise<AvailabilityResult> {
  const supabase = createClient()

  // Check blocked dates
  const { data: blocked } = await supabase
    .from("blocked_dates")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("date", date)
    .maybeSingle()

  if (blocked) return { available: false, reason: "Fecha bloqueada" }

  // Check business hours
  const dayOfWeek = new Date(date + "T12:00:00").getDay()
  const { data: hours } = await supabase
    .from("business_hours")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle()

  if (hours) {
    if (!hours.is_open) return { available: false, reason: "Cerrado este día" }
    if (time < hours.open_time.slice(0, 5) || time >= hours.close_time.slice(0, 5)) {
      return { available: false, reason: "Fuera del horario de atención" }
    }
  }

  // If no serviceIds provided, skip slot validation (backwards compat)
  if (!serviceIds || serviceIds.length === 0) {
    return { available: true }
  }

  // Calculate total duration
  const { data: services } = await supabase
    .from("services")
    .select("duration")
    .in("id", serviceIds)

  if (!services || services.length === 0) return { available: false, reason: "Servicios no encontrados" }

  const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0)
  if (totalDuration === 0) return { available: true } // No duration data, skip check

  // Calculate new booking slot in minutes from midnight
  const [h, m] = time.split(":").map(Number)
  const newStart = h * 60 + m
  const newEnd = newStart + totalDuration

  // Get existing bookings for the day with their services
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("booking_time, booking_services(service_id)")
    .eq("tenant_id", tenantId)
    .eq("booking_date", date)
    .neq("status", "cancelled")

  if (!existingBookings) return { available: true }

  for (const booking of existingBookings) {
    if (!booking.booking_time) continue
    const [bh, bm] = booking.booking_time.slice(0, 5).split(":").map(Number)
    const bStart = bh * 60 + bm

    // Get duration of this booking's services
    let bDuration = 0
    const svcIds = (booking.booking_services as any[])?.map(bs => bs.service_id) || []
    if (svcIds.length > 0) {
      const { data: bsServices } = await supabase
        .from("services")
        .select("duration")
        .in("id", svcIds)
      if (bsServices) {
        bDuration = bsServices.reduce((sum, s) => sum + (s.duration || 0), 0)
      }
    }
    const bEnd = bStart + (bDuration || 60) // default 60min if no duration data

    // Check overlap: newStart < bEnd AND newEnd > bStart
    if (newStart < bEnd && newEnd > bStart) {
      return { available: false, reason: "Horario ocupado" }
    }
  }

  return { available: true }
}
```

- [ ] **Step 2: Verificar que la importación de createClient existe**

```typescript
import { createClient } from "@/lib/supabase/client"
```

---

### Task 4: Public booking — multi-servicio checkboxes + submit booking_services

**Files:**
- Modify: `src/app/[slug]/page.tsx`

- [ ] **Step 1: Reemplazar selector de servicio único con checkboxes multi-servicio**

State adicional:

```typescript
const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
const [totalPrice, setTotalPrice] = useState(0)
const [totalDuration, setTotalDuration] = useState(0)
```

Función para toggle servicio:

```typescript
function toggleService(serviceId: string, price: number, duration: number) {
  setSelectedServiceIds(prev => {
    const exists = prev.includes(serviceId)
    if (exists) {
      setTotalPrice(p => p - price)
      setTotalDuration(d => d - duration)
      return prev.filter(id => id !== serviceId)
    } else {
      setTotalPrice(p => p + price)
      setTotalDuration(d => d + duration)
      return [...prev, serviceId]
    }
  })
}
```

Reemplazar el `<Select name="service">`:

```tsx
<div className="space-y-2">
  <Label>Servicios</Label>
  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
    {services.map((s) => (
      <label key={s.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
        <input
          type="checkbox"
          checked={selectedServiceIds.includes(s.id)}
          onChange={() => toggleService(s.id, s.price ?? 0, s.duration ?? 0)}
          className="h-4 w-4"
        />
        <div className="flex-1">
          <span className="text-sm font-medium">{s.name}</span>
          {s.duration && <span className="text-xs text-muted-foreground ml-2">{s.duration} min</span>}
        </div>
        {s.price && <span className="text-sm font-medium">${s.price.toLocaleString("es-CL")}</span>}
      </label>
    ))}
  </div>
  {(selectedServiceIds.length > 0) && (
    <div className="flex justify-between text-sm font-medium pt-1 border-t">
      <span>Total: {totalDuration > 0 && `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}min`}</span>
      <span>${totalPrice.toLocaleString("es-CL")}</span>
    </div>
  )}
</div>
```

- [ ] **Step 2: Modificar handleBooking para enviar service_ids[] y crear booking_services**

```typescript
// En handleBooking, antes de insert:
if (selectedServiceIds.length === 0) { setBookError("Selecciona al menos un servicio"); return }

// Validar disponibilidad con service_ids
const check = await checkAvailability(tenant.id, form.get("date") as string, form.get("time") as string, selectedServiceIds)

// Al insertar booking, no enviar service_id
const { data: newBooking, error: bookingErr } = await supabase
  .from("bookings")
  .insert({
    tenant_id: tenant.id,
    customer_id: customerId,
    vehicle_id: vehicleId,
    booking_date: form.get("date") as string,
    booking_time: form.get("time") as string,
    status: "reserved",
  })
  .select()
  .single()

if (bookingErr || !newBooking) { setBookError("Error al crear reserva"); return }

// Insert booking_services
const { error: bsErr } = await supabase.from("booking_services").insert(
  selectedServiceIds.map(sid => ({ booking_id: newBooking.id, service_id: sid }))
)

if (bsErr) { setBookError("Error al guardar servicios"); return }
```

---

### Task 5: Dashboard bookings — multi-service display + new booking with checkboxes

**Files:**
- Modify: `src/app/dashboard/bookings/page.tsx`

- [ ] **Step 1: Actualizar query de bookings para traer booking_services + services**

```typescript
supabase.from("bookings").select("*, customers(*), services(*), vehicles(*), booking_services(service_id, services(*))")
```

- [ ] **Step 2: Mostrar servicios múltiples en cada booking card**

```tsx
{/* En el card de booking, reemplazar el texto de servicio único */}
<div className="flex-1 min-w-0">
  <p className="font-medium truncate">{booking.customers?.name}</p>
  <p className="text-sm text-muted-foreground">
    {booking.vehicles && (
      <Link href={`/dashboard/vehicles/${booking.vehicles.id}`} className="hover:underline">
        {booking.vehicles.plate}
      </Link>
    )}
  </p>
  {/* Multi-service display */}
  {booking.booking_services && booking.booking_services.length > 0 && (
    <div className="flex flex-wrap gap-1 mt-1">
      {booking.booking_services.map((bs: any) => (
        <span key={bs.service_id} className="text-xs bg-muted px-1.5 py-0.5 rounded">
          {bs.services?.name ?? "Servicio"}
        </span>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 3: Reemplazar Select de servicio único por checkboxes en nueva reserva**

State adicional:

```typescript
const [newBookingServiceIds, setNewBookingServiceIds] = useState<string[]>([])
```

Función toggle + UI similar a public booking.

En handleAddBooking:

```typescript
async function handleAddBooking(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  if (!tenantId) return
  if (newBookingServiceIds.length === 0) { toast({ title: "Error", description: "Selecciona al menos un servicio", variant: "destructive" }); return }

  const form = new FormData(e.currentTarget)

  const check = await checkAvailability(tenantId, form.get("booking_date") as string, form.get("booking_time") as string, newBookingServiceIds)
  if (!check.available) { toast({ title: "Horario no disponible", description: check.reason, variant: "destructive" }); return }

  const vehId = form.get("vehicle_id") as string
  const payload: Record<string, any> = {
    tenant_id: tenantId,
    customer_id: form.get("customer_id") as string,
    booking_date: form.get("booking_date") as string,
    booking_time: form.get("booking_time") as string,
    status: "reserved",
  }
  if (vehId && vehId !== "__none__") payload.vehicle_id = vehId

  const { data: newBooking, error } = await supabase.from("bookings").insert(payload).select().single()
  if (error || !newBooking) { toast({ title: "Error al crear reserva", description: error?.message, variant: "destructive" }); return }

  // Insert booking_services
  const { error: bsErr } = await supabase.from("booking_services").insert(
    newBookingServiceIds.map(sid => ({ booking_id: newBooking.id, service_id: sid }))
  )
  if (bsErr) { toast({ title: "Error al guardar servicios", description: bsErr.message, variant: "destructive" }); return }

  toast({ title: "Reserva creada" })
  setDialogOpen(false)
  setNewBookingCustomerId("")
  setNewBookingServiceIds([])
  loadData()
}
```

- [ ] **Step 4: Reset service selection on dialog close**

```typescript
onOpenChange={(open) => { setDialogOpen(open); if (!open) { setNewBookingCustomerId(""); setNewBookingServiceIds([]) } }}
```

---

### Task 6: Actualizar supabase-schema.sql local

**Files:**
- Modify: `supabase-schema.sql`

- [ ] **Step 1: Agregar booking_services table + RLS + indexes + alter bookings**

Agregar sección 13 al schema con la tabla, políticas e índices.

---

### Task 7: Build + push final

- [ ] **Step 1: Build**

```bash
npm run build
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: multi-service booking + capacity validation"
```

- [ ] **Step 3: Push**

```bash
git push
```
