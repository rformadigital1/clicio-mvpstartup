# Dashboard UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Five UX improvements for business owner dashboard: income visibility, booking wizard robustness, and technical consistency fixes.

**Architecture:** All data exists in current schema (bookings, booking_services, services, tenants, customers). No new tables, no new npm deps. Inline SVG for charts. wa.me for WhatsApp.

**Tech Stack:** Next.js 14, Supabase, shadcn/ui, Tailwind CSS

## Global Constraints
- No new npm dependencies
- All colors via CSS custom properties, never inline hex
- DonutChart default colors use `hsl(var(--primary))` / `hsl(var(--warning))`
- WhatsApp via `wa.me` only — no API integration
- All queries filter by `booking_date`, never `created_at`, for revenue/booking metrics

---

### Task 1: Technical Fixes — DonutChart, Occupancy, booking_date

**Files:**
- Modify: `src/components/ui/donut-chart.tsx`
- Modify: `src/app/dashboard/reports/page.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Fix DonutChart default colors to CSS vars**

File: `src/components/ui/donut-chart.tsx`

Change default colors from hardcoded hex to CSS custom properties:
```
  colors = ["#3b82f6", "#f97316"],
```
→
```
  colors = ["hsl(var(--primary))", "hsl(var(--warning))"],
```

Also update the call site in `reports/page.tsx` to remove the explicit colors prop (let it use defaults):

Remove `colors={["#3b82f6", "#f97316"]}` from the `<DonutChart>` usage at line 361.

- [ ] **Step 2: Fix occupancy calculation with real booking duration**

File: `src/app/dashboard/reports/page.tsx` — replace the occupancy block (lines ~156-172).

Current:
```ts
let occupancy: number | null = null
if (hasHours && hRes.data) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let totalSlots = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dow = date.getDay()
    const hours = hRes.data.find((h: any) => h.day_of_week === dow)
    if (hours?.is_open) {
      const open = parseInt(hours.open_time.slice(0, 2))
      const close = parseInt(hours.close_time.slice(0, 2))
      totalSlots += close - open
    }
  }
  const bookedSlots = bRes.data.filter(b => b.status !== "cancelled").length
  occupancy = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0
}
```

Replace with:
```ts
let occupancy: number | null = null
if (hasHours && hRes.data) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let totalMinutes = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dow = date.getDay()
    const hours = hRes.data.find((h: any) => h.day_of_week === dow)
    if (hours?.is_open) {
      const open = parseInt(hours.open_time.slice(0, 2))
      const close = parseInt(hours.close_time.slice(0, 2))
      totalMinutes += (close - open) * 60
    }
  }
  let bookedMinutes = 0
  for (const b of bRes.data) {
    if (b.status === "cancelled") continue
    const svcs = (b as any).booking_services
    if (svcs?.length > 0) {
      bookedMinutes += svcs.reduce((sum: number, bs: any) => sum + (bs.services?.duration ?? 60), 0)
    } else {
      bookedMinutes += (b as any).services?.duration ?? 60
    }
  }
  occupancy = totalMinutes > 0 ? Math.round((bookedMinutes / totalMinutes) * 100) : 0
}
```

- [ ] **Step 3: Fix home page revenue queries to use `booking_date`**

File: `src/app/dashboard/page.tsx`

Change line 79 from:
```ts
.gte("created_at", monthStart)
```
to:
```ts
.gte("booking_date", monthStart)
```

Change lines 101-102 from:
```ts
.gte("created_at", prevD.toISOString())
.lte("created_at", new Date(now.getFullYear(), now.getMonth(), 0).toISOString())
```
to:
```ts
.gte("booking_date", prevD.toISOString().slice(0, 10))
.lte("booking_date", new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10))
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build` in project root
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/donut-chart.tsx src/app/dashboard/reports/page.tsx src/app/dashboard/page.tsx
git commit -m "fix: DonutChart CSS vars, occupancy duration, booking_date queries"
```

---

### Task 2: Home Page — Today Income Cards

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add today revenue calculation in `loadData()`**

After line 72 (`setTodayBookings(bookings ?? [])`), add:
```ts
let todayRevenue = 0
let todayPaid = 0
bookings?.forEach((b: any) => {
  const svcs = b.booking_services
  let total = 0
  if (svcs?.length > 0) {
    total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
  } else {
    total = b.services?.price ?? 0
  }
  todayRevenue += total
  if (b.status === "delivered") todayPaid += total
})
setTodayRevenue(todayRevenue)
setTodayPaid(todayPaid)
```

Add state variables after line 22:
```ts
const [todayRevenue, setTodayRevenue] = useState(0)
const [todayPaid, setTodayPaid] = useState(0)
```

- [ ] **Step 2: Add fourth stat card to JSX**

After the existing 3-card row (after line 191 `</div>`), add:
```tsx
<div className="bg-bg-superficie border border-border-subtil rounded-lg p-4 col-span-3 md:col-span-1">
  <p className="text-xs text-muted-foreground font-medium mb-1">Ingresos hoy</p>
  <p className="text-2xl font-bold text-green-700">${todayRevenue.toLocaleString("es-CL")}</p>
  <p className="text-xs mt-1">
    <span className="text-green-700">✓ ${todayPaid.toLocaleString("es-CL")} cobrado</span>
    <span className="text-muted-foreground"> · </span>
    <span className="text-amber-600">⏳ ${(todayRevenue - todayPaid).toLocaleString("es-CL")} pendiente</span>
  </p>
  <a href="/dashboard/reports" className="text-xs text-azul-rey hover:underline mt-1 inline-block">Ver reporte →</a>
</div>
```

Change the parent container grid classes from `flex gap-3` to `grid grid-cols-2 md:grid-cols-4 gap-3` (line 178).

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: today income cards on home dashboard"
```

---

### Task 3: Reports — Revenue by Status + Daily Chart + CSV

**Files:**
- Modify: `src/app/dashboard/reports/page.tsx`

- [ ] **Step 1: Add revenue-by-status calculation in `loadReport()`**

After the `revenue` loop (after line 114), add:
```ts
let revenueByStatus: Record<string, number> = { reserved: 0, delivered: 0, cancelled: 0 }
let countByStatus: Record<string, number> = { reserved: 0, delivered: 0, cancelled: 0 }
for (const b of bRes.data) {
  const status = b.status as string
  if (!revenueByStatus[status]) revenueByStatus[status] = 0
  if (!countByStatus[status]) countByStatus[status] = 0
  if (status === "delivered") {
    const svcs = (b as any).booking_services
    if (svcs?.length > 0) {
      revenueByStatus[status] += svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
    } else {
      revenueByStatus[status] += (b as any).services?.price ?? 0
    }
  }
  countByStatus[status]++
}
```

Add to the metrics setter (after line 184):
```ts
revenueByStatus,
countByStatus,
```

Also add daily revenue data for chart. After the `occupancy` calculation, add:
```ts
const dailyRevenue: Record<string, { delivered: number; total: number }> = {}
for (const b of bRes.data) {
  const day = b.booking_date?.slice(0, 10)
  if (!day) continue
  if (!dailyRevenue[day]) dailyRevenue[day] = { delivered: 0, total: 0 }
  let total = 0
  const svcs = (b as any).booking_services
  if (svcs?.length > 0) {
    total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
  } else {
    total = (b as any).services?.price ?? 0
  }
  dailyRevenue[day].total += total
  if (b.status === "delivered") dailyRevenue[day].delivered += total
}
```

Add to metrics setter:
```ts
dailyRevenue: Object.entries(dailyRevenue).sort(([a], [b]) => a.localeCompare(b)),
```

State type for metrics — ensure it includes the new fields.

- [ ] **Step 2: Add Revenue by Status card JSX**

After the occupancy card (after `</Card>` closing at line 319), add:
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos por estado</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {(["reserved", "delivered", "cancelled"] as const).map((s) => {
      const labels: Record<string, string> = { reserved: "Reservado", delivered: "Entregado", cancelled: "Cancelado" }
      const colors: Record<string, string> = { reserved: "hsl(var(--primary))", delivered: "hsl(142 76% 36%)", cancelled: "hsl(0 72% 51%)" }
      const rev = metrics.revenueByStatus[s] ?? 0
      const cnt = metrics.countByStatus[s] ?? 0
      const maxRev = Math.max(...(["reserved", "delivered", "cancelled"].map((st) => metrics.revenueByStatus[st] ?? 0)), 1)
      return (
        <div key={s}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{labels[s]}</span>
            <span className="text-muted-foreground">${rev.toLocaleString("es-CL")} — {cnt} {cnt === 1 ? "reserva" : "reservas"}</span>
          </div>
          <div className="h-5 bg-muted rounded-sm overflow-hidden">
            <div className="h-full rounded-sm transition-all" style={{ width: `${(rev / maxRev) * 100}%`, backgroundColor: colors[s] }} />
          </div>
        </div>
      )
    })}
  </CardContent>
</Card>
```

- [ ] **Step 3: Add Daily Revenue Chart JSX**

After the revenue-by-status card (after its `</Card>`), add:
```tsx
<Card className="md:col-span-2">
  <CardHeader>
    <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos diarios</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-end gap-[2px] h-40 overflow-x-auto">
      {metrics.dailyRevenue.map(([day, data]: [string, any]) => {
        const dayNum = parseInt(day.slice(8, 10))
        const maxVal = Math.max(...metrics.dailyRevenue.map(([, d]: [string, any]) => d.delivered), 1)
        const h = (data.delivered / maxVal) * 100
        return (
          <div key={day} className="flex flex-col items-center gap-1 min-w-[24px]">
            <div className="flex-1 w-full flex flex-col justify-end">
              <div
                className="w-full bg-primary rounded-t-sm transition-all"
                style={{ height: `${Math.max(h, 1)}%` }}
                title={`${dayNum}: $${data.delivered.toLocaleString("es-CL")}`}
              />
            </div>
            {metrics.dailyRevenue.length <= 31 && (
              <span className="text-[10px] text-muted-foreground">{dayNum}</span>
            )}
          </div>
        )
      })}
    </div>
  </CardContent>
</Card>
```

Update the grid container for the bottom cards. Change `className="grid gap-4 md:grid-cols-2"` (line 351) to include `md:grid-cols-2` for the clients + no-show row. The daily chart card needs `md:col-span-2` as shown above.

- [ ] **Step 4: Enhance CSV export with individual bookings**

Replace `exportCSV` function (lines ~189-215):

```ts
function exportCSV() {
  if (!metrics) return
  const rows: string[][] = [
    ["Métrica", "Valor"],
    ["Mes", `${monthNames[month]} ${year}`],
    ["Ingresos", String(metrics.revenue)],
    ["Variación %", metrics.revenueChange !== null ? `${metrics.revenueChange}%` : "N/A"],
    ["Ocupación %", metrics.occupancy !== null ? `${metrics.occupancy}%` : "N/A"],
    ["No-show rate", `${metrics.noShowRate}%`],
    ["No-show count", String(metrics.noShowCount)],
    ["Total reservas", String(metrics.totalBookings)],
    ["Clientes nuevos", String(metrics.newCustomers)],
    ["Clientes recurrentes", String(metrics.returningCustomers)],
    [],
    ["Servicio", "Cantidad", "Ingreso"],
    ...metrics.topServices.map((s: any) => [s.name, String(s.count), String(s.revenue)]),
    [],
    ["Fecha", "Hora", "Cliente", "Vehículo", "Servicios", "Total", "Estado"],
  ]

  for (const b of bRes.data) {
    const svcs = (b as any).booking_services
    const svcNames = svcs?.length > 0 ? svcs.map((bs: any) => bs.services?.name).filter(Boolean).join(", ") : ""
    let total = 0
    if (svcs?.length > 0) {
      total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
    }
    rows.push([
      b.booking_date ?? "",
      b.booking_time ?? "",
      (b as any).customers?.name ?? "",
      (b as any).vehicles?.plate ?? "",
      svcNames,
      String(total),
      STATUS_LABELS[b.status as BookingStatus] ?? b.status,
    ])
  }

  const csv = rows.map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `reporte-${monthNames[month].toLowerCase()}-${year}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

Note: `bRes.data` is currently not accessible inside `exportCSV` because it's scoped to `loadReport()`. Need to lift it to component state.

Add state after line 21:
```ts
const [bResData, setBResData] = useState<any[]>([])
```

Set it after line 83:
```ts
setBResData(bRes.data)
```

Change `exportCSV` to use `bResData` instead of the scoped variable.

- [ ] **Step 5: Import STATUS_LABELS and BookingStatus at top**

Add to existing imports:
```ts
import type { BookingStatus } from "@/lib/types"
import { STATUS_LABELS } from "@/lib/booking-constants"
```

- [ ] **Step 6: Verify build passes**

Run: `npm run build`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/reports/page.tsx
git commit -m "feat: revenue by status, daily chart, enhanced CSV export"
```

---

### Task 4: Booking Wizard — Overlap Validation + WhatsApp

**Files:**
- Modify: `src/components/booking/booking-wizard.tsx`

- [ ] **Step 1: Add overlap validation in `handleConfirm`**

Before the availability check in `handleConfirm()` (before line 167), add:

```ts
// Real duration overlap check
const svcDuration = selectedServiceIds.reduce((sum, sid) => {
  const svc = services.find((s) => s.id === sid)
  return sum + (svc?.duration ?? 30)
}, 0)
const [selH, selM] = selectedTime.split(":").map(Number)
const selStart = selH * 60 + selM
const selEnd = selStart + svcDuration
for (const b of dayBookings) {
  if (!b.booking_time) continue
  const [bH, bM] = b.booking_time.split(":").map(Number)
  const bStart = bH * 60 + bM
  let bDuration = 60
  if (b.booking_services?.length > 0) {
    bDuration = b.booking_services.reduce((sum: number, bs: any) => sum + (bs.services?.duration ?? 30), 0)
  }
  const bEnd = bStart + bDuration
  if (selStart < bEnd && selEnd > bStart) {
    setError("El horario seleccionado se solapa con otra reserva. Elige otro horario.")
    setSubmitting(false)
    return
  }
}
```

- [ ] **Step 2: Add WhatsApp confirmation button in step 4**

After the deposit info block (after line 501), add:

```tsx
{tenant.phone && (
  <a
    href={`https://wa.me/${tenant.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
      `Hola, quiero confirmar mi hora en ${tenant.name} del ${selectedDate} a las ${selectedTime} para ${services.filter((s) => selectedServiceIds.includes(s.id)).map((s) => s.name).join(", ")}.`
    )}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-green-600 text-green-700 font-medium text-sm hover:bg-green-50 transition-colors mt-3"
  >
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    Confirmar por WhatsApp
  </a>
)}
```

- [ ] **Step 3: Add pointer-events-none to confirm button during submission**

Change the confirm button (line 515) from:
```tsx
<Button onClick={handleConfirm} disabled={submitting} className="text-sm bg-azul-rey hover:bg-celeste-cielo transition-colors">
```
to:
```tsx
<Button onClick={handleConfirm} disabled={submitting} className={`text-sm bg-azul-rey hover:bg-celeste-cielo transition-colors ${submitting ? "pointer-events-none" : ""}`}>
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: No errors
Note: There's a `formatDateDisplay` function defined inside the JSX return block which is a React anti-pattern (function defined inside component render). If the build complains about it, move it outside the component. Check if it currently works — it's defined inside the success block branch (line 265) which is returned early, so it may be fine. If build fails, move it above the return.

- [ ] **Step 5: Commit**

```bash
git add src/components/booking/booking-wizard.tsx
git commit -m "feat: overlap validation, WhatsApp confirm btn, double-click guard"
```

---

### Task 5: New Ingresos Page + Sidebar Link

**Files:**
- Create: `src/app/dashboard/ingresos/page.tsx`
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Create `/dashboard/ingresos/page.tsx`**

New page with summary bar, filters, and table.

```tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { BookingStatus } from "@/lib/types"
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from "@/lib/booking-constants"

export default function IngresosPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [bookings, setBookings] = useState<any[]>([])

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  useEffect(() => { loadTenant() }, [])

  useEffect(() => { if (tenantId) loadBookings() }, [month, year, tenantId])

  async function loadTenant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return
    setTenantId(profile.tenant_id)
  }

  function monthStart() {
    return `${year}-${String(month + 1).padStart(2, "0")}-01`
  }

  function monthEnd() {
    const d = new Date(year, month + 1, 0)
    return d.toISOString().slice(0, 10)
  }

  async function loadBookings() {
    if (!tenantId) return
    setLoading(true)
    const { data, error } = await supabase
      .from("bookings")
      .select("*, customers(*), vehicles(*), booking_services(service_id, services(*))")
      .eq("tenant_id", tenantId)
      .gte("booking_date", monthStart())
      .lte("booking_date", monthEnd())
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false })
    if (error) { toast({ title: "Error al cargar datos", variant: "destructive" }); setLoading(false); return }
    setBookings(data ?? [])
    setLoading(false)
  }

  async function markPaid(bookingId: string) {
    const { error } = await supabase.from("bookings").update({ status: "delivered" }).eq("id", bookingId)
    if (error) { toast({ title: "Error al actualizar", variant: "destructive" }); return }
    toast({ title: "Marcado como pagado" })
    loadBookings()
  }

  const totals = bookings.reduce(
    (acc, b) => {
      let total = 0
      const svcs = b.booking_services
      if (svcs?.length > 0) {
        total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
      }
      acc.total += total
      if (b.status === "delivered") acc.paid += total
      else if (b.status === "cancelled") acc.cancelled += total
      else acc.pending += total
      return acc
    },
    { total: 0, paid: 0, pending: 0, cancelled: 0 }
  )

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter)

  const years = [year - 1, year, year + 1]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Ingresos">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthNames.map((name, i) => (
                <SelectItem key={i} value={String(i)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{String(y)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <p className="text-xl font-bold mt-1">${totals.total.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Cobrado</p>
            <p className="text-xl font-bold mt-1 text-green-700">${totals.paid.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Pendiente</p>
            <p className="text-xl font-bold mt-1 text-amber-600">${totals.pending.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Cancelado</p>
            <p className="text-xl font-bold mt-1 text-red-600">${totals.cancelled.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { value: "all", label: "Todos" },
          { value: "delivered", label: "Pagados" },
          { value: "reserved", label: "Pendientes" },
          { value: "cancelled", label: "Anulados" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-azul-rey text-white"
                : "bg-bg-superficie text-muted-foreground hover:bg-border-subtil"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">Sin movimientos</p>
          <p className="text-sm text-muted-foreground mt-1">No hay ingresos registrados este mes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b: any) => {
            const svcs = b.booking_services
            const svcNames = svcs?.length > 0 ? svcs.map((bs: any) => bs.services?.name).filter(Boolean).join(", ") : ""
            let total = 0
            if (svcs?.length > 0) {
              total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
            }
            return (
              <div key={b.id} className="bg-white border border-border-subtil rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="sm:w-28 shrink-0">
                  <p className="text-sm font-medium">{b.booking_date?.slice(0, 10)}</p>
                  <p className="text-xs text-muted-foreground">{b.booking_time?.slice(0, 5)} hrs</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{b.customers?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.vehicles?.plate}{b.vehicles?.brand ? ` — ${b.vehicles.brand}` : ""}</p>
                  <p className="text-xs text-muted-foreground truncate">{svcNames}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className={STATUS_BADGE_CLASSES[b.status as BookingStatus]}>
                    {STATUS_LABELS[b.status as BookingStatus]}
                  </Badge>
                  <span className="text-sm font-bold whitespace-nowrap">${total.toLocaleString("es-CL")}</span>
                  {b.status === "reserved" && (
                    <Button size="sm" variant="outline" onClick={() => markPaid(b.id)} className="text-xs h-8">
                      <CheckCircle className="h-3 w-3 mr-1" /> Pagar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add sidebar link in layout**

File: `src/app/dashboard/layout.tsx`

Find the nav items list. Add a new item between "Reportes" and "Ajustes":

```tsx
{
  href: "/dashboard/ingresos",
  icon: DollarSign,
  label: "Ingresos",
},
```

Import `DollarSign` from `lucide-react` if not already imported.

Note: the layout already maps through nav items — just add the object to the array.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/ingresos/page.tsx src/app/dashboard/layout.tsx
git commit -m "feat: ingresos page with summary, filters, mark-paid"
```

---

### Task 6: Final Verification and Push

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: No errors, all files compile successfully.

- [ ] **Step 2: Git status check**

Run: `git status` — verify clean working tree, all expected changes staged/committed.

- [ ] **Step 3: Push to origin**

```bash
git push origin main
```

Expected: Remote accepts all commits.
