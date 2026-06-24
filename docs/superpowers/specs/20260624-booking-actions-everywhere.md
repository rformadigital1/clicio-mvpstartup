# Booking Actions Everywhere — Design Spec

## Problem

Booking action buttons (status change, mark paid) are only accessible inside the calendar detail modal. The remaining 5 pages that display booking data — Dashboard timeline, Clientes, Calendario agenda, Ingresos, Reports, Vehicle detail — show bookings as read-only with no inline actions.

"cancelled" is referenced in code but does not exist in DB schema, TypeScript types, or booking constants.

## Scope

6 areas, 2 reusable components, 1 DB migration:

### 1. Add "cancelled" as real status

- DB: alter CHECK constraint `status in ('reserved','waiting','in_progress','ready','delivered','cancelled')`
- `BookingStatus` type: add `| "cancelled"`
- `booking-constants.ts`: add `"cancelled"` → label `"Anulado"`, grey color/badge
- `handle_booking_delivered()` trigger: skip if `new.status = 'cancelled'` (no stamp awarded)
- Ingresos page and Reports page: no code change needed — they already reference `"cancelled"`

### 2. BookingActions (shared component)

Path: `src/components/booking/booking-actions.tsx`

Props:
- `bookingId: string`
- `currentStatus: BookingStatus`
- `onStatusChange?: (bookingId: string, newStatus: BookingStatus) => void` — optional parent callback

Behavior:
- Renders 6 compact buttons in a row, one per status
- Active status: `variant="default"`, rest: `variant="outline"`
- Labels: Reserv, Espera, Progreso, Listo, Entrega, Anular
- On click: `supabase.from("bookings").update({ status }).eq("id", bookingId)` + calls `onStatusChange` if provided
- Clicked button shows loading spinner; all buttons disabled during update
- Error toast on failure

### 3. CustomerHistoryModal (shared component)

Path: `src/components/booking/customer-history-modal.tsx`

Props:
- `customerId: string`
- `open: boolean`
- `onClose: () => void`

Content:
- Header: customer name, phone, total visits count, total spent sum
- Scrollable list of ALL customer bookings (past + future), ordered by `booking_date DESC`
- Each row: date, time, service names, amount, status badge + BookingActions
- Fetch data via Supabase: `bookings` joined with `booking_services`, `services`, `customers`

### 4. Clientes page update

File: `src/app/dashboard/customers/page.tsx`

Changes:
- Each customer card loads recent bookings (max 5, ordered by `booking_date DESC`)
- Card displays: total spent, total visits
- Expandable "Últimos servicios" section listing recent bookings with status badge + BookingActions
- Link "Ver historial completo" opens CustomerHistoryModal
- Data loaded via a per-customer Supabase query or batched query

### 5. Calendar agenda — inline actions

File: `src/app/dashboard/calendar/page.tsx`

Changes:
- Add "Acciones" column to the agenda table
- Each row renders BookingActions
- Status change updates immediately without opening detail modal

### 6. Dashboard timeline — booking actions + customer history

File: `src/app/dashboard/page.tsx`

Changes:
- Each timeline booking card gets BookingActions inline
- Card becomes clickable (or add "Ver cliente" button) → opens CustomerHistoryModal
- Modal shows full customer history

## Architecture

```
src/components/booking/
├── booking-actions.tsx          # Shared status button bar
└── customer-history-modal.tsx   # Customer detail + booking history modal

DB:
- migration: alter bookings CHECK constraint to add 'cancelled'

Types:
- src/lib/types.ts: BookingStatus updated
- src/lib/booking-constants.ts: STATUS_LABELS etc. updated
```

## Edge cases

- **Staff role:** Staff can change status same as in current calendar modal. "Anular" is just another status — no owner restriction.
- **Rapid double-click:** Disable all buttons during update (same pattern as booking-wizard double-click guard)
- **CustomerHistoryModal empty:** Show "Sin historial" message
- **Concurrent status updates:** Optimistic not required — each update is independent; error toast on failure
- **cancelled no-stamp:** Trigger function checks `new.status != 'cancelled'` before awarding stamp

## Out of scope

- Reports page: keep read-only (it's analytical, not operational)
- Ingresos page: already has "Pagar" button; no change needed (BookingActions could replace it later but not now)
- Vehicle detail page: keep read-only (it's historical reference)
- Delete/void booking (hard delete): not implemented
