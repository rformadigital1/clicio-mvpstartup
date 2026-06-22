# Reportes Fase E — Design Doc

> Dashboard con datos históricos mensuales para el taller.
> Fecha: 2026-06-21

## Resumen

Nueva página `/dashboard/reports` con métricas mensuales agregadas: ingresos, servicios más vendidos, clientes nuevos vs recurrentes, tasa de ocupación, no-show rate. Exportable a CSV.

## Audiencia

Owner y staff del taller.

## Funcionalidad

- Selector de mes/año
- 5 cards de métricas
- Tabla de servicios más vendidos
- Export CSV de todo el reporte
- Ocupación visible solo si business_hours configurados

## Arquitectura

### Frontend

Ruta: `src/app/dashboard/reports/page.tsx`

Componente cliente (`"use client"`) que:
1. Carga tenant_id desde profile
2. Carga business_hours (para calcular ocupación)
3. Carga bookings del mes seleccionado con booking_services + services
4. Computa métricas en cliente con `useMemo`
5. Renderiza cards, barras SVG inline, gráfico torta inline

Sin librerías externas. SVG inline para gráficos.

### Queries

Todas contra Supabase client, filtradas por `tenant_id` y rango de fechas del mes seleccionado.

#### Query bookings del mes
```ts
supabase.from("bookings")
  .select("status, booking_date, booking_time, booking_services(service_id, services(price, name)), services(price, name)")
  .eq("tenant_id", tid)
  .gte("booking_date", monthStart)
  .lte("booking_date", monthEnd)
```

#### Query services (para nombres/duraciones)
```ts
supabase.from("services")
  .select("id, name, price, duration")
  .eq("tenant_id", tid)
```

#### Query customers (para nuevos vs recurrentes)
```ts
supabase.from("customers")
  .select("created_at")
  .eq("tenant_id", tid)
```

#### Query business_hours (para slots disponibles)
```ts
supabase.from("business_hours")
  .select("*")
  .eq("tenant_id", tid)
  .eq("is_open", true)
```

### Métricas calculadas (client-side con useMemo)

1. **Ingresos del mes:** Suma de `services.price` para bookings con `status = delivered`
2. **Variación %:** Misma query para mes anterior. `((actual - anterior) / anterior) * 100`
3. **Servicios más vendidos:** Agrupar todos los `booking_services` del mes, contar por `service_id`, sumar ingresos. Top 5.
4. **Clientes nuevos:** Customers con `created_at` dentro del mes
5. **Clientes recurrentes:** Bookings del mes con customer_id que ya tenía bookings de meses anteriores
6. **Tasa ocupación:** (bookings del mes / slots disponibles del mes) * 100. Slots disponibles = días hábiles * horas abiertas / slot promedio
7. **No-show rate:** Bookings con status = reserved que ya pasaron su fecha / total bookings del mes

### Export CSV

Botón que convierte las métricas a formato CSV y descarga:
```ts
function exportCSV(data: Metrics) {
  const rows = [
    ["Métrica", "Valor"],
    ["Ingresos", data.revenue],
    ["Servicios", data.topServices.map(s => `${s.name},${s.count},${s.revenue}`)],
    // ...
  ]
  const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `reporte-${mes}-${año}.csv`; a.click()
}
```

### Mockups

```
┌─────────────────────────────────────────────┐
│  Reportes  ◄ Junio ▼  2026 ▼ ►  [CSV]     │
├──────────────────┬──────────────────────────┤
│  Ingresos        │  Ocupación               │
│  $4.320.000      │  68% slots ocupados     │
│  ↑ 12% vs mayo   │  (242 de 356 slots)     │
├──────────────────┼──────────────────────────┤
│  Servicios más vendidos (top 5)             │
│  ┌────────────────────────────────────────┐ │
│  │ ████████████ Cambio aceite  12  $360K │ │
│  │ ██████████   Frenos          8  $480K │ │
│  │ ██████       Alineación      5  $100K │ │
│  │ ████         Scanner          3  $90K  │ │
│  │ ██           Suspensión      2  $240K  │ │
│  └────────────────────────────────────────┘ │
├──────────────────┬──────────────────────────┤
│  Clientes        │  No-show rate            │
│  🟦 Nuevos: 18  │  ████ 8%                 │
│  🟧 Recurrentes: │  (4 de 50 reservas)      │
│     42           │                          │
└──────────────────┴──────────────────────────┘
```

### Estados

- **Loading:** Spinner central
- **Sin datos:** Mensaje "No hay datos para este mes" con botón para cambiar mes
- **Ocupación N/A:** "Configura horarios en Ajustes para ver ocupación" (si no hay business_hours)
- **Error:** Toast con mensaje de error si falla alguna query

### Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `src/app/dashboard/reports/page.tsx` | Crear — página de reportes |
| `src/app/dashboard/layout.tsx` | Modificar — agregar nav item "Reportes" (ownerOnly: false) |

### Lo que NO incluye (scope explícito)

- No hay gráficos interactivos (tooltips, hover)
- No hay comparativa multi-mes en un solo gráfico
- No hay export PDF (solo CSV)
- No hay cálculo de costos ni margen
- No hay proyecciones
