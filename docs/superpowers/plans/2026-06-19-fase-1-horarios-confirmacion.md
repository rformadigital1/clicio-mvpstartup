# Fase 1 — Horarios, Validación, AlertDialog

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Talleres configuran horarios, bookings validan disponibilidad, acciones destructivas piden confirmación

**Architecture:** DB tables + app-side validation + reusable AlertDialog component

**Tech Stack:** Next.js 16, Supabase, Radix UI Dialog, Tailwind 4

## Global Constraints
- RLS en toda tabla nueva con `get_user_tenant_id()`
- Backwards compatible: si no hay business_hours configurados, booking funciona sin restricción
- AlertDialog basado en `@radix-ui/react-dialog` existente
- Types actualizados en `src/lib/types.ts`
- UI en español (mercado chileno)

---

### Task 1: DB migration — business_hours + blocked_dates

**Files:**
- Modify: `supabase-schema.sql`
- Execute via: MCP `supabase_execute_sql`

**Interfaces:**
- Produces: Tablas `business_hours`, `blocked_dates` con RLS + indexes

- [ ] **Step 1: Agregar tablas a schema file**

Insertar después de `reward_notifications` en `supabase-schema.sql`:

```sql
-- 9. BUSINESS HOURS
create table if not exists business_hours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  day_of_week int not null check (day_of_week between 0 and 6),
  open_time time not null,
  close_time time not null,
  is_open boolean default true,
  unique(tenant_id, day_of_week)
);

alter table business_hours enable row level security;

create policy "business_hours_select" on business_hours for select to authenticated using (
  tenant_id = public.get_user_tenant_id()
);
create policy "business_hours_insert" on business_hours for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id()
);
create policy "business_hours_update" on business_hours for update to authenticated using (
  tenant_id = public.get_user_tenant_id()
) with check (
  tenant_id = public.get_user_tenant_id()
);
create policy "business_hours_delete" on business_hours for delete to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

create index if not exists idx_business_hours_tenant_id on business_hours(tenant_id);

-- 10. BLOCKED DATES
create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  date date not null,
  reason text,
  unique(tenant_id, date)
);

alter table blocked_dates enable row level security;

create policy "blocked_dates_select" on blocked_dates for select to authenticated using (
  tenant_id = public.get_user_tenant_id()
);
create policy "blocked_dates_insert" on blocked_dates for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id()
);
create policy "blocked_dates_delete" on blocked_dates for delete to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

create index if not exists idx_blocked_dates_tenant_id on blocked_dates(tenant_id);

-- PUBLIC: anon can read business_hours for site display
create policy "business_hours_public_select" on business_hours for select to anon using (true);
```

- [ ] **Step 2: Aplicar migración a Supabase via MCP**

```sql
-- (mismo SQL de Step 1)
```

- [ ] **Step 3: Commit**

```bash
git add supabase-schema.sql
git commit -m "feat: add business_hours and blocked_dates tables"
```

---

### Task 2: AlertDialog component

**Files:**
- Create: `src/components/ui/alert-dialog.tsx`

**Interfaces:**
- Produces: `<AlertDialog>` component export

- [ ] **Step 1: Crear componente**

```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "destructive",
}: AlertDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
          <DialogPrimitive.Title className="text-lg font-semibold">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-muted-foreground mt-2">
            {description}
          </DialogPrimitive.Description>
          <div className="flex justify-end gap-3 mt-6">
            <DialogPrimitive.Close asChild>
              <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
            </DialogPrimitive.Close>
            <DialogPrimitive.Close asChild>
              <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/alert-dialog.tsx
git commit -m "feat: add AlertDialog component"
```

---

### Task 3: AlertDialog en acciones destructivas

**Files:**
- Modify: `src/app/dashboard/services/page.tsx`
- Modify: `src/app/dashboard/customers/page.tsx`
- Modify: `src/app/dashboard/loyalty/page.tsx`

- [ ] **Step 1: Services — agregar confirmación a delete**

Importar `AlertDialog` y `useState`. Envolver delete en confirmación:

```tsx
const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null)

// Antes de handleDelete, en lugar de llamar directo:
// <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
// Cambiar a:
<Button variant="ghost" size="icon" onClick={() => setDeleteTarget({id: s.id, name: s.name})}>

// Agregar al final del JSX:
<AlertDialog
  open={!!deleteTarget}
  onOpenChange={() => setDeleteTarget(null)}
  title="Eliminar servicio"
  description={`¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
  confirmText="Eliminar"
  onConfirm={() => { handleDelete(deleteTarget!.id); setDeleteTarget(null) }}
/>
```

- [ ] **Step 2: Customers — mismo patrón**

```tsx
const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null)

// onClick del botón delete:
onClick={() => setDeleteTarget({id: c.id, name: c.name})}

// JSX:
<AlertDialog
  open={!!deleteTarget}
  onOpenChange={() => setDeleteTarget(null)}
  title="Eliminar cliente"
  description={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
  confirmText="Eliminar"
  onConfirm={() => { handleDelete(deleteTarget!.id); setDeleteTarget(null) }}
/>
```

- [ ] **Step 3: Loyalty — mismo patrón**

```tsx
const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null)

// onClick del botón delete rule:
onClick={() => setDeleteTarget({id: rule.id, name: rule.reward_name})}

// JSX:
<AlertDialog
  open={!!deleteTarget}
  onOpenChange={() => setDeleteTarget(null)}
  title="Eliminar regla"
  description={`¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
  confirmText="Eliminar"
  onConfirm={() => { handleDelete(deleteTarget!.id); setDeleteTarget(null) }}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/services/page.tsx src/app/dashboard/customers/page.tsx src/app/dashboard/loyalty/page.tsx
git commit -m "feat: add AlertDialog confirmation to destructive actions"
```

---

### Task 4: Editor horarios en Settings

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Agregar tipos**

```tsx
// En types.ts
export interface BusinessHour {
  id: string
  tenant_id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_open: boolean
}

export interface BlockedDate {
  id: string
  tenant_id: string
  date: string
  reason: string | null
}
```

- [ ] **Step 2: Agregar editor de horarios a Settings**

Agregar al final del JSX de `settings/page.tsx`, antes del último `</div>`:

```tsx
import { Switch } from "@/components/ui/switch"
import { Plus, X } from "lucide-react"
import type { BusinessHour, BlockedDate } from "@/lib/types"

// En el componente, agregar estados:
const [hours, setHours] = useState<BusinessHour[]>([])
const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
const [savingHours, setSavingHours] = useState(false)
const [blockDialogOpen, setBlockDialogOpen] = useState(false)

// En loadTenant, después de cargar tenant, cargar hours + dates:
const [hRes, bRes] = await Promise.all([
  supabase.from("business_hours").select("*").eq("tenant_id", profile.tenant_id).order("day_of_week"),
  supabase.from("blocked_dates").select("*").eq("tenant_id", profile.tenant_id).order("date"),
])
if (hRes.data) setHours(hRes.data)
if (bRes.data) setBlockedDates(bRes.data)

// handleSaveHours: upsert business_hours
async function handleSaveHours() {
  setSavingHours(true)
  for (const h of hours) {
    await supabase.from("business_hours").upsert({
      id: h.id,
      tenant_id: tenant.id,
      day_of_week: h.day_of_week,
      open_time: h.open_time,
      close_time: h.close_time,
      is_open: h.is_open,
    })
  }
  toast({ title: "Horarios guardados" })
  setSavingHours(false)
}

// handleAddBlockedDate
async function handleAddBlockedDate(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  const form = new FormData(e.currentTarget)
  await supabase.from("blocked_dates").insert({
    tenant_id: tenant.id,
    date: form.get("date") as string,
    reason: form.get("reason") as string,
  })
  setBlockDialogOpen(false)
  loadTenant()
}

// handleRemoveBlockedDate
async function handleRemoveBlockedDate(id: string) {
  await supabase.from("blocked_dates").delete().eq("id", id)
  loadTenant()
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
```

Card JSX adicional:

```tsx
<Card className="mt-6">
  <CardHeader><CardTitle>Horarios de Atención</CardTitle></CardHeader>
  <CardContent className="space-y-4">
    {hours.map((h) => (
      <div key={h.day_of_week} className="flex items-center gap-3">
        <Switch
          checked={h.is_open}
          onCheckedChange={(v) => setHours(hours.map(x => x.day_of_week === h.day_of_week ? {...x, is_open: v} : x))}
        />
        <span className={`w-24 text-sm ${!h.is_open ? "line-through text-muted-foreground" : ""}`}>
          {DAY_NAMES[h.day_of_week]}
        </span>
        <Input
          type="time"
          value={h.open_time}
          onChange={(e) => setHours(hours.map(x => x.day_of_week === h.day_of_week ? {...x, open_time: e.target.value} : x))}
          disabled={!h.is_open}
          className="w-32"
        />
        <span className="text-muted-foreground">a</span>
        <Input
          type="time"
          value={h.close_time}
          onChange={(e) => setHours(hours.map(x => x.day_of_week === h.day_of_week ? {...x, close_time: e.target.value} : x))}
          disabled={!h.is_open}
          className="w-32"
        />
      </div>
    ))}
    <Button onClick={handleSaveHours} disabled={savingHours}>
      {savingHours ? "Guardando..." : "Guardar horarios"}
    </Button>
  </CardContent>
</Card>

<Card className="mt-6">
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>Fechas Bloqueadas</CardTitle>
    <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Bloquear fecha</DialogTitle></DialogHeader>
        <form onSubmit={handleAddBlockedDate} className="space-y-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input name="date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Input name="reason" placeholder="Ej: Feriado" />
          </div>
          <Button type="submit" className="w-full">Bloquear</Button>
        </form>
      </DialogContent>
    </Dialog>
  </CardHeader>
  <CardContent>
    {blockedDates.length === 0 ? (
      <p className="text-sm text-muted-foreground">No hay fechas bloqueadas</p>
    ) : (
      <div className="space-y-2">
        {blockedDates.map((bd) => (
          <div key={bd.id} className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">{bd.date}</span>
              {bd.reason && <span className="text-sm text-muted-foreground ml-2">— {bd.reason}</span>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleRemoveBlockedDate(bd.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/settings/page.tsx src/lib/types.ts
git commit -m "feat: business hours editor and blocked dates in settings"
```

---

### Task 5: Switch UI component

**Files:**
- Create: `src/components/ui/switch.tsx`

- [ ] **Step 1: Crear Switch component**

```tsx
"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className="peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/switch.tsx
git commit -m "feat: add Switch component"
```

---

### Task 6: Horarios en sitio público

**Files:**
- Modify: `src/app/[slug]/page.tsx`

- [ ] **Step 1: Cargar y mostrar business_hours en sitio público**

En `loadTenant()`, después de cargar servicios, cargar horarios:

```tsx
const { data: hoursData } = await supabase
  .from("business_hours")
  .select("*")
  .eq("tenant_id", tenants[0].id)
  .order("day_of_week")
```

Agregar estado `hours` y sección en el JSX:

```tsx
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

// Después de sección de servicios o antes de beneficios:
{hours.length > 0 && (
  <section className="border-t py-16 bg-muted/50">
    <div className="container max-w-lg">
      <h3 className="text-2xl font-bold text-center mb-8">Horarios</h3>
      <div className="space-y-3">
        {hours.filter(h => h.is_open).length > 0 ? (
          hours.map((h) => (
            <div key={h.day_of_week} className="flex justify-between items-center">
              <span className="font-medium">{DAY_NAMES[h.day_of_week]}</span>
              {h.is_open ? (
                <span className="text-muted-foreground">
                  {h.open_time.slice(0, 5)} — {h.close_time.slice(0, 5)}
                </span>
              ) : (
                <span className="text-muted-foreground">Cerrado</span>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground">Sin horario disponible</p>
        )}
      </div>
    </div>
  </section>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\[slug\]/page.tsx
git commit -m "feat: show business hours on public site"
```

---

### Task 7: Validación disponibilidad en booking

**Files:**
- Create: `src/lib/availability.ts`
- Modify: `src/app/[slug]/page.tsx` (handleBooking)
- Modify: `src/app/dashboard/bookings/page.tsx` (handleAddBooking)

- [ ] **Step 1: Crear utilidad de validación**

```tsx
// src/lib/availability.ts
import { createClient } from "@/lib/supabase/client"
import type { BusinessHour, BlockedDate } from "@/lib/types"

export async function checkAvailability(
  tenantId: string,
  date: string,
  time: string
): Promise<{ available: boolean; reason?: string }> {
  const supabase = createClient()

  const dayOfWeek = new Date(date + "T12:00:00").getDay()

  const { data: hours } = await supabase
    .from("business_hours")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle()

  // Si no hay horarios configurados, permitir (backwards compatible)
  if (!hours) return { available: true }

  if (!hours.is_open) return { available: false, reason: "Cerrado este día" }

  const bookingTime = time.slice(0, 5)
  if (bookingTime < hours.open_time.slice(0, 5) || bookingTime >= hours.close_time.slice(0, 5)) {
    return { available: false, reason: "Fuera del horario de atención" }
  }

  const { data: blocked } = await supabase
    .from("blocked_dates")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("date", date)
    .maybeSingle()

  if (blocked) return { available: false, reason: "Fecha bloqueada" }

  return { available: true }
}
```

- [ ] **Step 2: Validar en booking público (`[slug]/page.tsx`)**

En `handleBooking`, después de `if (!tenant) return;`:

```tsx
const form = new FormData(e.currentTarget)

const check = await checkAvailability(tenant.id, form.get("date") as string, form.get("time") as string)
if (!check.available) {
  setBookError(check.reason ?? "Horario no disponible")
  return
}
```

- [ ] **Step 3: Validar en dashboard booking (`page.tsx`)**

En `handleAddBooking`:

```tsx
const date = form.get("booking_date") as string
const time = form.get("booking_time") as string

const check = await checkAvailability(tenantId, date, time)
if (!check.available) {
  toast({ title: "Horario no disponible", description: check.reason, variant: "destructive" })
  return
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/availability.ts src/app/\[slug\]/page.tsx src/app/dashboard/bookings/page.tsx
git commit -m "feat: booking availability validation against business hours"
```

---

### Task 8: Build verification + push

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: Compiled successfully

- [ ] **Step 2: Push**

```bash
git push
```
