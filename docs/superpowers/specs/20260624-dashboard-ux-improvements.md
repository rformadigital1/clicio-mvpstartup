# Dashboard UX Improvements — Business Owner Needs

Date: 2026-06-24
Status: Draft

## Overview

Five improvements to the Clicio dashboard from a business owner perspective: income visibility, booking wizard robustness, and technical consistency.

## 1. Home — Today Income Cards

Add fourth stat card alongside existing "Reservas hoy / En progreso / Listos":

**Hoy: $XXX.XXX**
- Sub-line: "✓ $YYY cobrados · ⏳ $ZZZ por cobrar"
- Cobrados = bookings with status `delivered`
- Por cobrar = bookings with status `reserved` | `in_progress` | `ready`
- Small link "Ver reporte →" pointing to `/dashboard/reports`

### Implementation
- `src/app/dashboard/page.tsx`: add today revenue calculation in `loadData()`
- New card JSX below existing three-cards row, or as fourth card in a 4-column grid (preferred)
- Revenue per booking = sum of `booking_services[*].services.price`

## 2. Reports — Revenue by Status + Daily Chart + Better Export

### Revenue by Status card
- Three horizontal bars: **Reservado ($X)**, **Entregado ($Y)**, **Cancelado ($Z)**
- Colors: reserved = blue, delivered = green, cancelled = red
- Shows amount and count for each status (e.g. "$450.000 — 12 reservas")

### Daily Revenue Chart
- Line chart (recharts) showing last 30 days of the selected month
- X-axis: day of month
- Y-axis: revenue in CLP
- One line for daily revenue, one for cumulative
- Only visible when month data exists

### Export CSV enhancement
- Current: aggregated metrics
- New: include individual bookings rows: `booking_date, booking_time, customer, vehicle, services, total, status`
- Keep aggregated section at top

### Implementation
- `src/app/dashboard/reports/page.tsx`
- Inline SVG bar chart for daily revenue (no new npm deps)
- Revenue by status calculated from `bRes.data` grouping by `status`

## 3. Booking Wizard — Overlap Validation + WhatsApp Link

### Real duration overlap check
- On step 4 confirm, calculate total duration of selected services
- Check against all existing bookings for that day (excluding current booking time window)
- If overlap detected, show error: "El horario seleccionado se solapa con otra reserva. Elige otro horario."
- Visual: amber warning on slot selection if accumulated duration exceeds slot availability

### WhatsApp confirmation button
- On step 4 (confirm step), add secondary button: "Confirmar por WhatsApp"
- Opens `wa.me/{tenant_phone}?text={prefilled_message}`
- Message template: `Hola, quiero confirmar mi hora en {tenant_name} del {fecha} a las {hora} para {servicios}.`
- Telephone from `tenant.phone` field

### Double-click protection
- Already partially implemented via `submitting` state
- Add `pointer-events-none` class to confirm button during submission

### Implementation
- `src/components/booking/booking-wizard.tsx`

## 4. New Page: `/dashboard/ingresos`

### Summary bar
- Total cobrado (delivered): $X
- Total pendiente (reserved/in_progress): $Y
- Abonos pendientes: count + total amount

### Table
- Columns: Fecha, Hora, Cliente, Vehículo, Servicios, Total, Abono, Estado Pago, Acciones
- Servicios column: comma-separated list of service names
- Estado Pago: badge (Pagado/Pendiente/Anulado/Abono)
- Actions: "Marcar como pagado" button for reserved bookings

### Filters
- Date range picker (month/year, same as Reports)
- Status filter dropdown: Todos, Pendiente, Pagado, Anulado, Abono

### Implementation
- New file: `src/app/dashboard/ingresos/page.tsx`
- Add sidebar link in `src/app/dashboard/layout.tsx`
- Insert between "Reportes" and "Ajustes" nav items
- Icon: `DollarSign`

## 5. Technical Fixes

### DonutChart hardcoded colors
- Replace `["#3b82f6", "#f97316"]` with CSS variable references
- Use `hsl(var(--primary))` and `hsl(var(--warning))` or template-derived colors
- File: `src/components/ui/donut-chart.tsx`

### Occupancy with real duration
- Replace slot counting with sum of actual booking durations / total available minutes
- Occupancy = `(sum of booking durations in minutes) / (total open hours in minutes) * 100`
- File: `src/app/dashboard/reports/page.tsx`

### prevMonthRevenue with booking_date
- Change `created_at` to `booking_date` for month filtering
- Apply to both Home and Reports queries
- Files: `src/app/dashboard/page.tsx`, `src/app/dashboard/reports/page.tsx`

### Home monthRevenue consistency
- Already uses `booking_date` approach? Check.
- Ensure same pattern as Reports

## Data Schema Impact

No new tables or columns required. All data exists in:
- `bookings` (status, booking_date, booking_time)
- `booking_services` (service_id: FK)
- `services` (price, duration)
- `tenants` (phone for WhatsApp)
- `customers` (name, phone)

## Non-Goals

- No WhatsApp API integration (wa.me only)
- No real-time notifications
- No SMS/email reminders
- No payment gateway integration
- No multi-currency
