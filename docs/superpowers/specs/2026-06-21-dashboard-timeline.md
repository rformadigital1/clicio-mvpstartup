# Dashboard Timeline Redesign

**Date:** 2026-06-21
**Status:** Approved

## Concept

Replace current metric cards + recent bookings with a today-focused operational dashboard. Primary view: timeline del día (vertical schedule of today's bookings). Compact stats bar above for quick glance.

## Layout

```
[Hero greeting — already done]
[Stats bar: 3 compact cards — today's total, in_progress, ready]
[Timeline del día — vertical schedule]
```

## Stats Bar

Three compact cards above the timeline:

| Card | Value | Color |
|------|-------|-------|
| Reservas hoy | Total count | azul-rey |
| En progreso | count (in_progress) | rojo |
| Listos para entregar | count (ready) | verde |

## Timeline Design

Vertical column with time markers on the left, booking cards on the right.

**Time markers:** Every 30 min (09:00, 09:30, 10:00...). Current time highlighted with azul-rey dot.

**Booking card:**
- Left border colored by status (like pizarra magnética)
- Time + Customer name (bold)
- Vehicle plate + brand
- Services list
- Phone
- Status badge

**Empty slots:** Dashed border, muted text "Disponible"

## Implementation

Modify `src/app/dashboard/page.tsx` to:
1. Keep existing hero greeting
2. Replace current metric grid with 3 compact stat cards (horizontal row)
3. Replace monthly metrics + status cards + recent bookings section with the timeline
4. Remove "Calendario" link card (redundant — sidebar has it)

Fetch today's bookings with full relations (customers, vehicles, booking_services.services) in loadData.
