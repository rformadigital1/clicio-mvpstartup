# Fase 1 — Bugs Críticos Dashboard Implementation Plan

> **For agentic workers:** Inline execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir revenue $0 post-Fase B, recent bookings rotos, y crypto.randomUUID en gallery upload.

**Architecture:** Solo cambios frontend en dashboard/page.tsx y gallery-section.tsx. No requiere migración DB.

**Tech Stack:** Next.js 16, Supabase JS client, TypeScript.

## Global Constraints

- No tocar DB ni schema
- Backwards compat: bookings viejos con service_id deben seguir funcionando
- Build debe pasar

---

### Task 1: Revenue dashboard con booking_services

**Files:**
- Modify: `src/app/dashboard/page.tsx:80-96`

**Interfaces:**
- Consumes: Booking.booking_services[].services.price
- Produces: monthRevenue calculado desde booking_services

- [ ] **Step 1: Actualizar query revenue para incluir booking_services**

Cambiar:
```ts
supabase.from("bookings")
  .select("status, services(price)")
```
a:
```ts
supabase.from("bookings")
  .select("status, services(price), booking_services(services(price))")
```

- [ ] **Step 2: Actualizar cálculo de revenue**

Cambiar loop para sumar desde booking_services con fallback a services.price:

```ts
monthData?.forEach((b) => {
  total++
  if (b.status === "delivered") {
    const bs = (b as any).booking_services
    if (bs?.length > 0) {
      revenue += bs.reduce((sum: number, s: any) => sum + (s.services?.price ?? 0), 0)
    } else {
      revenue += (b.services as any)?.price ?? 0
    }
  }
})
```

- [ ] **Step 3: Build check**

```bash
npm run build
```
Esperado: Compiled successfully.

---

### Task 2: Recent bookings con multi-servicio + vehículo

**Files:**
- Modify: `src/app/dashboard/page.tsx:105-112,198-210`

- [ ] **Step 1: Actualizar query recent bookings**

Cambiar:
```ts
supabase.from("bookings")
  .select("*, customers(name, plate), services(name)")
```
a:
```ts
supabase.from("bookings")
  .select("*, customers(name, plate), services(name), vehicles(plate, brand), booking_services(services(name))")
```

- [ ] **Step 2: Actualizar display de servicios y vehículo**

Reemplazar línea ~203-205:
```tsx
<p className="text-sm text-muted-foreground">
  {b.customers?.plate} — {b.services?.name}
</p>
```
con:
```tsx
<p className="text-sm text-muted-foreground">
  {b.vehicles && `${b.vehicles.plate}${b.vehicles.brand ? ` - ${b.vehicles.brand}` : ""} — `}
  {b.booking_services?.length > 0
    ? b.booking_services.map((bs: any) => bs.services?.name).filter(Boolean).join(", ")
    : b.services?.name}
</p>
```

- [ ] **Step 3: Build check**

```bash
npm run build
```
Esperado: Compiled successfully.

---

### Task 3: Fix crypto.randomUUID en gallery upload

**Files:**
- Modify: `src/app/dashboard/settings/gallery-section.tsx:37-40`

- [ ] **Step 1: Agregar helper uuid seguro**

Agregar función helper al inicio del componente:
```tsx
function genId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
```

- [ ] **Step 2: Reemplazar crypto.randomUUID()**

Cambiar:
```tsx
const path = `${tenantId}/${crypto.randomUUID()}.${ext}`
```
a:
```tsx
const path = `${tenantId}/${genId()}.${ext}`
```

- [ ] **Step 3: Build + commit + push**

```bash
npm run build && git add -A && git commit -m "fix: revenue booking_services, recent bookings, gallery uuid" && git push
```

---

## Resumen

| Task | Archivo | Cambio |
|------|---------|--------|
| 1 | dashboard/page.tsx | Revenue desde booking_services |
| 2 | dashboard/page.tsx | Recent bookings multi-servicio + vehículo |
| 3 | gallery-section.tsx | UUID seguro sin crypto.randomUUID |
