# Booking Wizard — Embedded Step-by-Step en Página Pública

## Objetivo

Reemplazar el botón "Agendar Ahora" + Dialog modal por un wizard de reservas
embebido directamente en la página pública `/[slug]`. El cliente ve día/hora
disponible, selecciona servicios, ingresa datos y confirma — todo sin modales.

## Arquitectura

```
TenantSitePage (page.tsx)
└─ BookingWizard (nuevo componente)
   ├─ WizardProgress        — barra con 4 pasos
   ├─ StepCalendar          — grid días + chips horas
   ├─ StepServices          — selección múltiple servicios
   ├─ StepCustomerData      — nombre, teléfono, vehículo
   └─ StepConfirm           — resumen + abono opcional
```

- BookingWizard mantiene estado compartido entre pasos via state local.
- No modales. No cambios de ruta. El wizard se revela paso a paso en la misma
  sección de la página.

## Layout de Página

```
Header (logo / nombre)
Hero gradient azul-rey → celeste-cielo
  ┌─ BookingWizard (fondo blanco, shadow, rounded-xl) ─┐
  │  Paso 1–4                                           │
  │  ← Atrás  |  Siguiente →                           │
  └─────────────────────────────────────────────────────┘
Servicios (sección existente)
Galería (sección existente)
Horarios (sección existente)
Beneficios (sección existente)
Ubicación (sección existente)
CTA inferior (sección existente)
Footer
```

- Wizard ocupa ~600px-700px de alto. Scroll natural si contenido excede.
- Hero padding reducido (`py-8 md:py-12`) para no empujar wizard abajo.

## Paso 1 — Calendario + Horas

**Estado:** `{ selectedDate: string | null, selectedTime: string | null }`

```
[<  Abril 2026  >]
Lu Ma Mi Ju Vi Sa Do
     1  2  3  4  5  6
 7  8  9 10 11 12 13
14 15 16 17 18 19 20
21 22 23 24 25 26 27
28 29 30

Horas disponibles:
[09:00] [10:00] [11:00] [14:00] [15:00]
```

- Grid de calendario simple (sin librería externa — generar manual).
- Días sin disponibilidad se ven `opacity-30` sin pointer.
- Día seleccionado: `bg-azul-rey text-white` con border visible.
- Horas disponibles debajo del grid, scroll horizontal si muchas.
- Hora seleccionada: `border-azul-rey bg-azul-rey/10`.
- Disponibilidad calculada en frontend via `checkAvailability()` o fetch
  de bookings del día + `business_hours` + `blocked_dates`.
- CTA "Siguiente" habilitado solo con día + hora seleccionados.

**Carga de slots disponibles:**
- Fetch `business_hours` para el `day_of_week`.
- Fetch bookings del día para calcular slots ocupados.
- Cada slot = bloque de 30min (o según duración de servicios).
- Si no hay `business_hours`, el día se muestra no disponible.

## Paso 2 — Servicios

**Estado:** `{ selectedServiceIds: string[], totalPrice: number, totalDuration: number }`

```
Selecciona servicios
☐ Cambio de aceite    30min  $25.000
☑ Frenos              60min  $45.000
☐ Alineación          20min  $15.000
☑ Scanner Diag.       15min  $20.000

Duración total: 1h 15min
Total: $65.000
```

- Misma lógica de `toggleService()` existente.
- Cada fila: checkbox + nombre + duración + precio.
- Footer: duración total + precio total.
- CTA "Siguiente" habilitado solo con ≥1 servicio seleccionado.

## Paso 3 — Datos del Cliente

**Estado:** `{ name, phone, plate, brand, model, existingCustomer, vehicles, selectedVehicleId }`

```
Nombre *
[________________________]

Teléfono *
[+56 9 __________________]

Patente *
[ABC123__________________]

Marca (opcional)
[________________________]

Modelo (opcional)
[________________________]
```

- Si teléfono ya existe en DB: muestra selector de vehículos guardados.
- Si selecciona "Agregar otro vehículo": muestra inputs patente/marca/modelo.
- Validación: nombre, teléfono, patente requeridos. Marca/modelo opcionales.
- Botón "Siguiente" con validación inline.

## Paso 4 — Confirmar + Abono

**Estado:** `{ depositAmount: number | null }`

```
Confirma tu reserva

┌─ Resumen ──────────────────────────┐
│ Fecha:     mié 15 abr 2026         │
│ Hora:      10:00 hrs               │
│ Servicios: Cambio de aceite     │
│            Frenos                  │
│ Total:     $65.000                 │
│ Cliente:   Juan Pérez              │
│ Vehículo:  ABC123 — Mazda 3        │
└───────────────────────────────────┘

Si abono configurado:
┌─ Abono ────────────────────────────┐
│ Abono requerido: 50% = $32.500    │
│ Transferencia a: ...               │
│ Referencia: #RES-XXX               │
└───────────────────────────────────┘

[← Atrás]  [✓ Confirmar Reserva]
```

- Resumen read-only con todos los datos seleccionados.
- Si `tenant.deposit_enabled = true`: muestra monto de abono
  (calculado como % o monto fijo según config del dueño).
- Al confirmar: llama a `handleBooking()` existente.
- Éxito: muestra pantalla de confirmación (reemplaza el wizard).

## Componentes Nuevos

### BookingWizard (`src/components/booking/booking-wizard.tsx`)
Props: `tenant, services, hours, onComplete`

Estado interno:
- `step: 1 | 2 | 3 | 4`
- `formData: { date, time, serviceIds, name, phone, plate, brand, model }`
- `ui: { loading, error, existingCustomer, vehicles }`

Métodos:
- `goNext() / goBack()` — validan paso actual antes de avanzar.
- `handleConfirm()` — ejecuta booking. Muestra éxito.

### WizardProgress (`src/components/booking/wizard-progress.tsx`)
Props: `currentStep: number, steps: string[]`

Barra horizontal con 4 círculos numerados + labels. Círculo actual azul-rey,
completados verde (checkmark), futuros gris.

### StepCalendar (`src/components/booking/step-calendar.tsx`)
Props: `tenantId, businessHours, onSelect(date, time)`
State: `currentMonth, selectedDate, selectedTime, availableSlots`

### StepServices (`src/components/booking/step-services.tsx`)
Props: `services, selectedIds, onToggle, onNext`
Misma lógica que el selector actual en el Dialog.

### StepCustomerData (`src/components/booking/step-customer-data.tsx`)
Props: `onChange(data), initialData`
State: `existingCustomer, vehicles, selectedVehicleId`
Misma lógica que el formulario actual.

### StepConfirm (`src/components/booking/step-confirm.tsx`)
Props: `formData, tenant, services, onConfirm, onBack`
State: `submitting, success`

## Cambios en DB

### Tenants — nuevo campos de abono
```sql
ALTER TABLE tenants
  ADD COLUMN deposit_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN deposit_type text CHECK (deposit_type IN ('percent', 'fixed')) DEFAULT 'percent',
  ADD COLUMN deposit_value numeric(10,0) DEFAULT NULL;
```

- `deposit_enabled`: si está activo el abono
- `deposit_type`: `'percent'` (porcentaje del total) o `'fixed'` (monto fijo)
- `deposit_value`: si type=percent, es 0-100; si type=fixed, monto en CLP

### blocked_dates (ya existe, verificar)
Ya existe tabla `blocked_dates` con `id, tenant_id, date`. No requiere cambios.

## Migración de Página Existente

1. Hero actual (`py-12 md:py-20` gradient) conserva título + subtítulo pero
   padding reducido en mobile para que wizard sea visible.
2. Botón "Agendar Ahora" se elimina del hero (el wizard ES el booking).
3. Wizard se inserta como card blanca dentro del hero section o
   inmediatamente debajo.
4. Secciones existentes (servicios, galería, etc.) se mantienen abajo sin
   cambios.
5. El Dialog de booking actual se elimina (reemplazado por wizard).
6. `checkAvailability` se mantiene como está — usado por StepCalendar.

## Consideraciones Técnicas

- Fetch de `business_hours` + `blocked_dates` + bookings del mes se hace
  una vez al montar el wizard. Cacheado en estado.
- Cada paso es un componente separado para mantener el archivo page.tsx
  manejable.
- `checkAvailability` corre en StepCalendar para cada slot candidato.
- Abono se calcula al confirmar: si `deposit_enabled`, mostrar monto
  informativo. El pago real se maneja fuera de scope (solo referencia).
- Mobile: wizard ocupa 100% del container con padding. Time chips en
  horizontal scroll. Grid de calendario no más de 7 columnas.
- Estados: loading skeleton para días, error inline si falla fetch,
  disabled buttons si paso incompleto.

## Próximos Pasos

1. Migración DB: agregar campos deposit a tenants
2. Crear componentes BookingWizard, WizardProgress, StepCalendar,
   StepServices, StepCustomerData, StepConfirm
3. Modificar `src/app/[slug]/page.tsx`: reemplazar hero + dialog por wizard
4. Eliminar Dialog booking del page.tsx
5. Agregar UI de bloqueo de días en admin (futuro)
