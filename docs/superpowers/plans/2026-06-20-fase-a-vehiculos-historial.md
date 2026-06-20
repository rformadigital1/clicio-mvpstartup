# Fase A — Vehículos + Historial por vehículo

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task.

**Goal:** Separar vehículo de cliente. Cliente puede tener varios vehículos. Booking se asocia a vehículo. Historial por vehículo visible.

**Architecture:** Tabla `vehicles` + FK en `bookings`. UI de clientes muestra vehículos. Ruta nueva `/dashboard/vehicles/[id]` con historial. Booking público permite seleccionar/crear vehículo.

**Tech Stack:** Supabase (Postgres + RLS), Next.js 16 (App Router), shadcn/ui

## Global Constraints

- RLS policies usan `get_user_tenant_id()` y `is_owner()` (security definer)
- Anon puede insert en customers + vehicles (booking público), authenticated puede leer/escribir en su tenant, solo owner elimina
- Migraciones vía `supabase_apply_migration` tool
- Types en `src/lib/types.ts`
- Español: toda UI, mensajes, documentos
- Build: `npm run build` desde `/home/hp-laptop/Documentos/clicio.app/`

---

### Task 1: DB Migration — vehicles table + vehicle_id en bookings

**Files:**
- Modify: `supabase-schema.sql` (agregar tabla + RLS)
- Execute: migration vía Supabase MCP

**Interfaces:**
- Produces: tabla `vehicles`, columna `bookings.vehicle_id`, RLS policies, migración de datos existentes

- [ ] **Step 1: Ejecutar migration para crear tabla vehicles + columna vehicle_id**

```sql
-- Create vehicles table
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  plate text not null,
  brand text,
  model text,
  year integer,
  vin text,
  created_at timestamptz not null default now()
);

-- Add vehicle_id to bookings
alter table public.bookings add column vehicle_id uuid references public.vehicles(id) on delete set null;

-- Indexes
create index vehicles_tenant_id_idx on public.vehicles(tenant_id);
create index vehicles_customer_id_idx on public.vehicles(customer_id);
create index vehicles_plate_idx on public.vehicles(plate);
create index bookings_vehicle_id_idx on public.bookings(vehicle_id);

-- Enable RLS
alter table public.vehicles enable row level security;

-- RLS policies for vehicles
create policy "vehicles_anon_insert"
  on public.vehicles for insert
  to anon
  with check (true);

create policy "vehicles_authenticated_select"
  on public.vehicles for select
  to authenticated
  using (tenant_id = get_user_tenant_id());

create policy "vehicles_authenticated_insert"
  on public.vehicles for insert
  to authenticated
  with check (tenant_id = get_user_tenant_id());

create policy "vehicles_authenticated_update"
  on public.vehicles for update
  to authenticated
  using (tenant_id = get_user_tenant_id())
  with check (tenant_id = get_user_tenant_id());

create policy "vehicles_owner_delete"
  on public.vehicles for delete
  to authenticated
  using (tenant_id = get_user_tenant_id() and is_owner());

-- Migrate existing data: create vehicles from customers with plate
insert into public.vehicles (tenant_id, customer_id, plate)
  select tenant_id, id, plate
  from public.customers
  where plate is not null and plate != '';

-- Link existing bookings to vehicles by matching customer_id + plate
update public.bookings b
  set vehicle_id = v.id
  from public.vehicles v
  where b.customer_id = v.customer_id
  and b.tenant_id = v.tenant_id;
```

- [ ] **Step 2: Verificar migration**

Ejecutar: consultar `select count(*) from public.vehicles` y `select count(*) from public.bookings where vehicle_id is not null`

- [ ] **Step 3: Actualizar `supabase-schema.sql` local**

Agregar la tabla `vehicles` y sus políticas al archivo de schema.

---

### Task 2: Types — agregar Vehicle interface + Booking.vehicle_id

**Files:**
- Modify: `src/lib/types.ts`

**Interfaces:**
- Produces: `Vehicle` interface, `Booking` con `vehicle_id`

- [ ] **Step 1: Agregar Vehicle interface y actualizar Booking**

En `src/lib/types.ts`:

```typescript
export interface Vehicle {
  id: string
  tenant_id: string
  customer_id: string
  plate: string
  brand: string | null
  model: string | null
  year: number | null
  vin: string | null
  created_at: string
}
```

En `Booking`, agregar:
```typescript
  vehicle_id?: string
  vehicles?: Vehicle
```

---

### Task 3: Customers page — mostrar vehículos por cliente + CRUD

**Files:**
- Modify: `src/app/dashboard/customers/page.tsx`

- [ ] **Step 1: Leer customers page actual**

```bash
cat src/app/dashboard/customers/page.tsx
```

- [ ] **Step 2: Agregar state para vehículos por customer**

```typescript
const [vehiclesByCustomer, setVehiclesByCustomer] = useState<Record<string, Vehicle[]>>({})
```

- [ ] **Step 3: Cargar vehículos junto con customers**

```typescript
async function loadData() {
  // ...existing code...
  const { data: custData } = await supabase.from("customers").select("*").eq("tenant_id", tid)
  if (custData) {
    setCustomers(custData)
    // Load vehicles for all customers
    const { data: vehData } = await supabase.from("vehicles").select("*").eq("tenant_id", tid)
    if (vehData) {
      const grouped: Record<string, Vehicle[]> = {}
      vehData.forEach((v) => {
        if (!grouped[v.customer_id]) grouped[v.customer_id] = []
        grouped[v.customer_id].push(v)
      })
      setVehiclesByCustomer(grouped)
    }
  }
  // ...
}
```

- [ ] **Step 4: Agregar vehículo en cada fila de customer**

En la fila de cada customer, después de la info básica, agregar:

```tsx
{vehiclesByCustomer[c.id]?.length > 0 && (
  <div className="mt-2 space-y-1">
    {vehiclesByCustomer[c.id].map((v) => (
      <div key={v.id} className="flex items-center gap-2 text-sm text-muted-foreground">
        <Car className="h-3 w-3" />
        <span>{v.plate}</span>
        {v.brand && <span>{v.brand}</span>}
        {v.model && <span>{v.model}</span>}
        {v.year && <span>({v.year})</span>}
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 5: Botón "Agregar vehículo" + modal**

Modal con campos: plate (required), brand, model, year, vin.

```tsx
const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
const [vehicleCustomerId, setVehicleCustomerId] = useState<string | null>(null)
const [newVehiclePlate, setNewVehiclePlate] = useState("")
const [newVehicleBrand, setNewVehicleBrand] = useState("")
const [newVehicleModel, setNewVehicleModel] = useState("")
const [newVehicleYear, setNewVehicleYear] = useState("")

async function handleAddVehicle() {
  if (!vehicleCustomerId || !newVehiclePlate.trim()) return
  const { error } = await supabase.from("vehicles").insert({
    tenant_id: tid,
    customer_id: vehicleCustomerId,
    plate: newVehiclePlate.trim(),
    brand: newVehicleBrand.trim() || null,
    model: newVehicleModel.trim() || null,
    year: newVehicleYear ? parseInt(newVehicleYear) : null,
  })
  if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
  toast({ title: "Vehículo agregado" })
  setVehicleDialogOpen(false)
  resetVehicleForm()
  loadData()
}

// Reset form
function resetVehicleForm() {
  setNewVehiclePlate("")
  setNewVehicleBrand("")
  setNewVehicleModel("")
  setNewVehicleYear("")
}
```

Modal:

```tsx
<Dialog open={vehicleDialogOpen} onOpenChange={(open) => { setVehicleDialogOpen(open); if (!open) resetVehicleForm() }}>
  <DialogContent>
    <DialogHeader><DialogTitle>Agregar vehículo</DialogTitle></DialogHeader>
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Patente *</Label>
        <Input value={newVehiclePlate} onChange={(e) => setNewVehiclePlate(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Marca</Label>
        <Input value={newVehicleBrand} onChange={(e) => setNewVehicleBrand(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Modelo</Label>
        <Input value={newVehicleModel} onChange={(e) => setNewVehicleModel(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Año</Label>
        <Input value={newVehicleYear} onChange={(e) => setNewVehicleYear(e.target.value)} type="number" />
      </div>
      <Button onClick={handleAddVehicle} className="w-full">Guardar</Button>
    </div>
  </DialogContent>
</Dialog>
```

Botón en cada fila o en header del customer:

```tsx
<Button variant="ghost" size="sm" onClick={() => { setVehicleCustomerId(c.id); setVehicleDialogOpen(true) }}>
  <Plus className="h-3 w-3 mr-1" /> Vehículo
</Button>
```

- [ ] **Step 6: Agregar icono Car a imports**

```typescript
import { ..., Car, Plus } from "lucide-react"
```

- [ ] **Step 7: Build + verificar**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: vehicles CRUD on customers page"
```

---

### Task 4: Bookings list — mostrar vehículo en cada booking

**Files:**
- Modify: `src/app/dashboard/bookings/page.tsx`
- Modify: `src/lib/types.ts` (ya hecho en Task 2)

- [ ] **Step 1: Leer bookings page actual**

```bash
cat src/app/dashboard/bookings/page.tsx
```

- [ ] **Step 2: Cargar vehicles con bookings**

En la query de bookings, hacer join con vehicles:

```typescript
const { data: bookingsData } = await supabase
  .from("bookings")
  .select("*, customers(*), services(*), vehicles(*)")
  .eq("tenant_id", tid)
  .order("booking_date", { ascending: false })
```

- [ ] **Step 3: Mostrar columna vehículo en la tabla**

Donde se muestra cada booking, agregar:

```tsx
{b.vehicles ? (
  <span className="text-sm">{b.vehicles.plate}{b.vehicles.brand ? ` - ${b.vehicles.brand}` : ""}</span>
) : (
  <span className="text-sm text-muted-foreground">—</span>
)}
```

- [ ] **Step 4: Build + verificar**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: show vehicle info in bookings list"
```

---

### Task 5: Public booking — seleccionar/crear vehículo por cliente

**Files:**
- Modify: `src/app/[slug]/page.tsx`

- [ ] **Step 1: Leer public booking page actual**

```bash
cat src/app/[slug]/page.tsx
```

- [ ] **Step 2: Modificar flujo de booking para incluir vehículo**

El nuevo flujo:
1. Cliente ingresa nombre + teléfono
2. Si el teléfono ya existe en customers, buscar vehículos de ese cliente
3. Mostrar selector de vehículos existentes o "Agregar nuevo"
4. Si no existe, input para crear vehículo (plate requerido + marca/modelo opcionales)

State adicional:

```typescript
const [existingCustomer, setExistingCustomer] = useState<any>(null)
const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([])
const [selectedVehicleId, setSelectedVehicleId] = useState<string>("new")
const [newVehiclePlate, setNewVehiclePlate] = useState("")
const [newVehicleBrand, setNewVehicleBrand] = useState("")
const [newVehicleModel, setNewVehicleModel] = useState("")
```

Al cambiar teléfono, buscar cliente:

```typescript
async function handlePhoneBlur(phone: string) {
  if (!tenant || phone.length < 6) return
  const { data } = await supabase
    .from("customers")
    .select("*, vehicles(*)")
    .eq("tenant_id", tenant.id)
    .eq("phone", phone)
    .maybeSingle()
  if (data) {
    setExistingCustomer(data)
    setCustomerVehicles(data.vehicles || [])
    if (data.vehicles?.length > 0) {
      setSelectedVehicleId(data.vehicles[0].id)
    }
  } else {
    setExistingCustomer(null)
    setCustomerVehicles([])
    setSelectedVehicleId("new")
  }
}
```

En el form, después de teléfono:

```tsx
{existingCustomer && (
  <div className="space-y-2">
    <Label>Vehículo</Label>
    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar vehículo" />
      </SelectTrigger>
      <SelectContent>
        {customerVehicles.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            {v.plate} {v.brand ? `- ${v.brand}` : ""} {v.model ? v.model : ""}
          </SelectItem>
        ))}
        <SelectItem value="new">+ Agregar nuevo</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}

{selectedVehicleId === "new" && (
  <>
    <div className="space-y-2">
      <Label>Patente *</Label>
      <Input value={newVehiclePlate} onChange={(e) => setNewVehiclePlate(e.target.value)} required />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-2">
        <Label>Marca</Label>
        <Input value={newVehicleBrand} onChange={(e) => setNewVehicleBrand(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Modelo</Label>
        <Input value={newVehicleModel} onChange={(e) => setNewVehicleModel(e.target.value)} />
      </div>
    </div>
  </>
)}
```

- [ ] **Step 3: Modificar handleBooking para usar vehículo**

Al crear booking:

```typescript
async function handleBooking(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  if (!tenant) return
  setBookError("")

  const form = new FormData(e.currentTarget)

  // Find or create customer
  let customerId: string
  let vehicleId: string | null = null

  if (existingCustomer) {
    customerId = existingCustomer.id
    if (selectedVehicleId === "new") {
      const { data: newV, error: vehErr } = await supabase.from("vehicles").insert({
        tenant_id: tenant.id,
        customer_id: customerId,
        plate: form.get("plate") as string,
        brand: form.get("brand") as string || null,
        model: form.get("model") as string || null,
      }).select().single()
      if (vehErr) { setBookError("Error al crear vehículo"); return }
      vehicleId = newV.id
    } else {
      vehicleId = selectedVehicleId
    }
  } else {
    const { data: newC, error: custErr } = await supabase.from("customers").insert({
      tenant_id: tenant.id,
      name: form.get("name") as string,
      phone: form.get("phone") as string,
    }).select().single()
    if (custErr) { setBookError("Error al crear cliente"); return }
    customerId = newC.id

    const { data: newV, error: vehErr } = await supabase.from("vehicles").insert({
      tenant_id: tenant.id,
      customer_id: customerId,
      plate: form.get("plate") as string,
      brand: form.get("brand") as string || null,
      model: form.get("model") as string || null,
    }).select().single()
    if (vehErr) { setBookError("Error al crear vehículo"); return }
    vehicleId = newV.id
  }

  // Check availability (placeholder, will be enhanced in Phase B)
  // ...existing availability check...

  // Create booking
  const { error: bookingErr } = await supabase.from("bookings").insert({
    tenant_id: tenant.id,
    customer_id: customerId,
    vehicle_id: vehicleId,
    service_id: form.get("service") as string,
    booking_date: form.get("date") as string,
    booking_time: form.get("time") as string,
    status: "reserved",
  })
  // ...
}
```

- [ ] **Step 4: Remover campo plate antiguo del form público**

El campo "Patente" independiente se reemplaza por la sección de vehículo.

- [ ] **Step 5: Build + verificar**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: vehicle selection in public booking flow"
```

---

### Task 6: Vehicle detail page — historial de bookings

**Files:**
- Create: `src/app/dashboard/vehicles/[id]/page.tsx`
- Modify: `src/app/dashboard/layout.tsx` (agregar ruta a nav si aplica)

- [ ] **Step 1: Crear página de detalle de vehículo**

```typescript
// src/app/dashboard/vehicles/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Car, Calendar, Wrench } from "lucide-react"
import type { Vehicle, Booking, Service } from "@/lib/types"

const statusLabels: Record<string, string> = {
  reserved: "Reservado",
  waiting: "Esperando",
  in_progress: "En progreso",
  ready: "Listo",
  delivered: "Entregado",
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [bookings, setBookings] = useState<(Booking & { services?: Service })[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()
    if (!profile) return

    setTenantId(profile.tenant_id)

    const [vehRes, bookRes] = await Promise.all([
      supabase.from("vehicles").select("*, customers(*)").eq("id", id).single(),
      supabase
        .from("bookings")
        .select("*, services(*)")
        .eq("vehicle_id", id)
        .eq("tenant_id", profile.tenant_id)
        .order("booking_date", { ascending: false }),
    ])

    if (vehRes.data) setVehicle(vehRes.data)
    setBookings(bookRes.data ?? [])
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Cargando...</p></div>
  if (!vehicle) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Vehículo no encontrado</p></div>

  const customer = (vehicle as any).customers
  const totalSpent = bookings
    .filter(b => b.status === "delivered")
    .reduce((sum, b) => sum + ((b.services as any)?.price ?? 0), 0)

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-muted-foreground" />
            <div>
              <CardTitle>{vehicle.plate}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                {vehicle.year ? ` (${vehicle.year})` : ""}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {customer && (
              <>
                <div>
                  <span className="text-muted-foreground">Cliente</span>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teléfono</span>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </>
            )}
            {vehicle.vin && (
              <div>
                <span className="text-muted-foreground">VIN</span>
                <p className="font-medium">{vehicle.vin}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Total gastado</span>
              <p className="font-medium">$ {totalSpent.toLocaleString("es-CL")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5" /> Historial de servicios
      </h2>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Wrench className="h-8 w-8 mx-auto mb-2" />
            <p>Sin servicios registrados para este vehículo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.booking_date}</span>
                    <span className="text-muted-foreground">{b.booking_time?.slice(0, 5)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(b as any).services?.name ?? "Servicio"}
                    {(b as any).services?.price ? ` - $${(b as any).services.price.toLocaleString("es-CL")}` : ""}
                  </p>
                </div>
                <Badge>{statusLabels[b.status] || b.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Agregar enlace desde customers page**

En customers page, hacer clic en plate del vehículo → navega a `/dashboard/vehicles/[id]`:

```tsx
// En lugar de solo mostrar texto:
<Link href={`/dashboard/vehicles/${v.id}`} className="hover:underline">
  {v.plate}
</Link>
```

- [ ] **Step 3: Build + verificar**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: vehicle detail page with booking history"
```

---

### Task 7: Actualizar supabase-schema.sql local

**Files:**
- Modify: `supabase-schema.sql`

- [ ] **Step 1: Agregar vehicles table + RLS + indexes al schema local**

Copiar la definición de la tabla, índices y políticas del Task 1 al archivo `supabase-schema.sql` en la sección correspondiente.

- [ ] **Step 2: Commit final**

```bash
git add -A && git commit -m "docs: update schema with vehicles table"
```

---

### Task 8: Build + Push final

- [ ] **Step 1: Build final**

```bash
npm run build
```

- [ ] **Step 2: Push a GitHub**

```bash
git push
```

---

## Resumen de archivos

| Archivo | Acción |
|---------|--------|
| `supabase-schema.sql` | Modificar (agregar vehicles) |
| `src/lib/types.ts` | Modificar (Vehicle interface) |
| `src/app/dashboard/customers/page.tsx` | Modificar (vehículos por cliente + CRUD) |
| `src/app/dashboard/bookings/page.tsx` | Modificar (columna vehículo) |
| `src/app/[slug]/page.tsx` | Modificar (selección vehículo en booking) |
| `src/app/dashboard/vehicles/[id]/page.tsx` | Crear (historial de bookings) |
