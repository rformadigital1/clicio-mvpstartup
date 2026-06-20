# Propuesta 2 — Refinamiento MVP

> Análisis de bugs, mejoras y pulido post-Fase D.
> Basado en auditoría de código 2026-06-20.

---

## Resumen

Problemas identificados: 4 bugs, 6 mejoras. Organizados en 4 fases de implementación.

---

## Fase 1 — Bugs críticos (dashboard roto)

### 1.1 Revenue del dashboard usa `service_id` viejo

**Archivo:** `src/app/dashboard/page.tsx` líneas 81-94

**Problema:** La query mensual hace:
```ts
supabase.from("bookings").select("status, services(price)")
```
Esto trae el precio via el FK `service_id` en bookings. Pero desde Fase B, bookings nuevos se crean SIN `service_id` (es nullable), los servicios viven en `booking_services`. Revenue siempre da $0 para bookings post-Fase B.

**Fix:**
- Query debe traer `booking_services(services(price))`
- Sumar precios desde `booking_services` para cada booking delivered
- Si no hay `booking_services`, caer a `services.price` (backwards compat)

### 1.2 Recent bookings no muestra multi-servicio ni vehículo

**Archivo:** `src/app/dashboard/page.tsx` líneas 105-112

**Problema:** `select("*, customers(name, plate), services(name)")` — no incluye `vehicles(*)` ni `booking_services(services(name))`. La UI muestra solo un servicio y no la patente del vehículo (si el booking tiene `vehicle_id`).

**Fix:**
- Expandir select a `*, customers(name, plate), vehicles(plate, brand), booking_services(services(name))`
- Mostrar lista de servicios (join con ", ") y vehículo

### 1.3 Gallery upload usa `crypto.randomUUID()`

**Archivo:** `src/app/dashboard/settings/gallery-section.tsx` línea 39

**Problema:** `crypto.randomUUID()` falla en conexiones HTTP (no HTTPS). En localhost puede lanzar `TypeError: crypto.randomUUID is not a function` si el contexto no es seguro.

**Fix:**
- Usar `Math.random().toString(36).slice(2, 10)` + `Date.now()` como fallback
- O usar `crypto.getRandomValues` con implementación manual

---

## Fase 2 — Calendar + Availability

### 2.1 Calendar ignora business_hours

**Archivo:** `src/app/dashboard/calendar/page.tsx`

**Problema:** `START_HOUR = 8` y `END_HOUR = 20` hardcodeados. Si el taller abre 10-18, el grid muestra 10 horas fantasma.

**Fix:**
- Cargar `business_hours` del tenant en `loadData()`
- Calcular `START_HOUR` = min(open_time) de todos los días, `END_HOUR` = max(close_time)
- Usar esos límites en el grid

### 2.2 Availability no considera timezone

**Archivo:** `src/lib/availability.ts` línea 15

**Problema:** `new Date(date + "T12:00:00").getDay()` — usa T12 para evitar problemas de zona horaria, pero la fecha viene del input `type="date"` que es local. En huso horario negativo (-3 Chile), T12 cae en el día correcto. En husos positivos podría偏移 al día siguiente.

**Fix:** Usar `dateStr.split("-").map(Number)` para construir fecha manualmente y evitar Date parsing.

### 2.3 Calendar: sin scroll en mobile

**Archivo:** `src/app/dashboard/calendar/page.tsx`

**Problema:** `min-w-[700px]` con overflow-x-auto. En mobile el grid se ve chico. Booking blocks con texto cortado.

**Fix:** Ajustar font-size relativo, mejorar truncate, considerar `text-[10px]` en mobile via media query.

---

## Fase 3 — UX y pulido

### 3.1 Dashboard: próximas reservas

**Archivo:** `src/app/dashboard/page.tsx`

**Problema:** "Últimas reservas" ordena por `created_at DESC`. Muestra las 5 más nuevas, no las 5 más próximas. El dueño quiere ver qué viene ahora, no qué se creó hace rato.

**Fix:** Cambiar a ordenar por `booking_date ASC, booking_time ASC` con `gte("booking_date", today)` para mostrar próximas 5.

### 3.2 Dashboard: enlace a calendario

**Archivo:** `src/app/dashboard/page.tsx`

**Problema:** Dashboard es landing page pero no hay link rápido al calendario. El dueño tiene que navegar al nav.

**Fix:** Agregar card "Ver calendario" o botón en la sección de métricas.

### 3.3 Calendar: tooltip en booking blocks

**Archivo:** `src/app/dashboard/calendar/page.tsx`

**Problema:** Booking blocks solo muestran hora + nombre cortado. No se ve la lista de servicios sin hacer click.

**Fix:** Agregar `title` attribute con texto completo (hora, cliente, servicios) o un tooltip CSS nativo.

### 3.4 Calendar: footer con totales del día

**Problema:** No hay resumen visual de cuántos bookings hay por día en el calendario.

**Fix:** Opcional (bajo prioridad) — agregar badge con count al lado del número de día en el header.

---

## Fase 4 — Deuda técnica

### 4.1 Booking creation: sin editar

**Archivo:** `src/app/dashboard/bookings/page.tsx`

**Problema:** Solo se puede cambiar estado. No se puede modificar fecha/hora/cliente/servicios de una reserva existente.

**Fix:** Modal de edición con campos precargados. Update en vez de insert.

### 4.2 Customer duplicado en dashboard

**Archivo:** `src/app/dashboard/bookings/page.tsx`

**Problema:** Al crear booking desde dashboard, el selector de cliente muestra todos. Si el cliente no existe, no hay forma de crearlo rápido (hay que ir a Clientes, crearlo, volver). Si el nombre se escribe mal, se crea duplicado.

**Fix:** Input de búsqueda con autocomplete + botón "Crear cliente rápido" inline.

### 4.3 Types frágiles (`any` casting)

**Archivo:** Múltiples archivos

**Problema:** `booking_services` se accede con `(booking as any).booking_services` en bookings, calendar, dashboard. TypeScript no puede inferir tipos anidados de Supabase joins.

**Fix:** Crear interfaz `BookingWithRelations` que extienda `Booking` con `booking_services?: BookingService[]` tipado correctamente.

### 4.4 Staff invitation sin expiración visible

**Archivo:** `src/app/dashboard/settings/staff-section.tsx`

**Problema:** Al copiar código de invitación, no se muestra cuándo expira (7 días por defecto).

**Fix:** Mostrar fecha de expiración en el UI del código generado.

---

## Orden de implementación

```
Fase 1: Bugs dashboard   ← bloquea métricas (dueño no ve ingresos reales)
Fase 2: Calendar fix      ← usability blocker
Fase 3: UX pulido         ← mejora experiencia diaria
Fase 4: Deuda técnica     ← quality of life
```

Cada fase: spec si es necesario → plan → implementación → build + push.
