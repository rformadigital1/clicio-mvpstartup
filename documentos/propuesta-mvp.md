# Propuesta MVP — CLICIO

> Análisis de brechas: qué falta para que CLICIO sea una herramienta útil y vendible para talleres automotrices.
> Fecha: 2026-06-20

---

## Estado actual

Multi-tenant con auth (signup/signin), booking público, dashboard con métricas, gestión de reservas, CRM básico (clientes), servicios, programa de fidelización (stamps), horarios, fechas bloqueadas, staff (invite codes), onboarding wizard, logo upload.

---

## Tier 1 — Sin esto NO es útil (uso diario)

### 1. Notificaciones

**Problema:** Booking entra silencioso. Nadie en el taller se entera. Dueño revisa manualmente el dashboard. Cliente no recibe confirmación ni recordatorio. Sin notificaciones la app no reemplaza el papelito ni el WhatsApp directo.

**Impacto:** El loop de comunicación está roto. El taller entiende que hay una reserva solo si abre la app. El cliente no sabe si su hora está confirmada.

**Solución ideal mínima:** WhatsApp — cuando se crea booking → notificar al taller. Cuando cambia estado → notificar al cliente. Twilio API o similar.

### 2. Vista calendario

**Problema:** Lista plana de bookings no sirve para taller con 10+ reservas al día. Necesitan ver la semana, los slots ocupados/libres, cambiar estado visualmente.

**Impacto:** La agenda es la herramienta principal del taller. Si no es visual, no la usan a diario.

**Solución ideal mínima:** Vista semana/día estilo calendario con drag para cambiar estado. FullCalendar o similar.

### 3. Validación de capacidad (evitar doble booking)

**Problema:** `checkAvailability()` valida horario vs blocked_dates pero no mira bookings existentes. Dos clientes pueden reservar el mismo día y hora. Servicios tienen duración pero no se usa para slotear.

**Impacto:** Doble reservas. Clientes llegan y chocan.

**Solución ideal mínima:** Al validar disponibilidad, traer bookings del día y chequear que el slot (hora + duración) no se superponga.

### 4. Vehículos por cliente

**Problema:** Solo campo `plate` en customer. Un cliente con 2 autos no tiene historial separado. No hay marca, modelo, año, VIN.

**Impacto:** El taller pierde trazabilidad. No puede recomendar servicios basados en historial del vehículo.

**Solución ideal mínima:** Tabla `vehicles` separada, customer puede tener varios. Booking se asocia a un vehicle. Historial por vehículo.

---

## Tier 2 — Sin esto NO se vende

### 5. Pagos online (seña)

**Problema:** No hay pago al reservar. No-shows son el dolor #1 del taller. Dueño pregunta "¿y si no vienen?".

**Impacto:** Sin esto el dueño no confía en el sistema. No paga por él.

**Solución ideal mínima:** Seña (porcentaje o monto fijo) al reservar. Flow simple: Webpay + integración. (Deferido en roadmap actual.)

### 6. Recordatorios automáticos 24h

**Problema:** No hay recordatorio. Cliente olvida. No-show asegurado.

**Impacto:** Reduce no-shows ~30-50%, el feature que más valoran los talleres.

**Solución ideal mínima:** 24h antes (o 2h), enviar WhatsApp/email recordando fecha, hora, servicio. Debe poder configurarse por taller.

### 7. Dominio personalizado

**Problema:** Taller quiere `taller.cl`, no `clicio.app/taller-mecanico`. Para vender SaaS a dueños de taller, necesitan URL propia. Se ve más profesional.

**Impacto:** Barrera de compra. Dueño no quiere compartir link con "/clicio" en medio.

**Solución ideal mínima:** El tenant configura su dominio (CNAME → clicio.app). La app sirve contenido del tenant según dominio.

### 8. Reportes y analytics

**Problema:** Dashboard muestra métricas del día y mes, pero no hay tendencias, servicios más vendidos, comparativas, tasa de conversión.

**Impacto:** Para justificar suscripción mensual, el dueño necesita ver datos que le ayuden a tomar decisiones.

**Solución ideal mínima:** Reportes mensuales: ingresos vs mes anterior, top servicios, clientes nuevos vs recurrentes, ocupación por hora/día.

---

## Tier 3 — Diferenciación (cuando el producto base funcione)

| Brecha | Impacto |
|--------|---------|
| **Catálogo con imágenes** | El sitio público se ve genérico. Servicios sin foto no venden. |
| **Multi-servicio por reserva** | "Cambio aceite + frenos + alineación" en un bloque. Realidad del taller. |
| **Historial completo por vehículo** | Kilometraje, servicios anteriores, próximo mantenimiento. Vinculante para el cliente. |
| **PWA / mobile** | Staff usa la app en el taller con el celular. La UI actual es desktop-first. |
| **Reseñas y valoraciones** | Confianza en el sitio público. Prueba social. |
| **Multi-sucursal** | Dueño con 2+ talleres. Una cuenta, múltiples sedes. |
| **Inventario / repuestos** | Gestión de stock para talleres grandes. |
| **Órdenes de trabajo** | Documento interno: qué se hace, qué repuestos se usan, horas hombre. |

---

## Lo que NO implementamos (por ahora)

| Feature | Motivo |
|---------|--------|
| Notificaciones WhatsApp | Sin Twilio, postergado |
| Pagos online | Postergado |
| Recordatorios 24h | Atado a notificaciones |
| Dominio personalizado | Postergado |
| Multi-sucursal | Postergado |
| Inventario / repuestos | Postergado |
| PWA | Pendiente |
| Reseñas | Postergado |
| Órdenes de trabajo | Postergado |

---

## Plan de implementación

Orden acordado, cada fase genera su propio spec y plan.

---

### Fase A — Vehículos + Historial por vehículo

**Objetivo:** Separar vehículo de cliente. Un cliente puede tener varios vehículos. Cada booking se asocia a un vehículo. Historial por vehículo visible.

**DB:**
- Tabla `vehicles`: id (uuid PK), tenant_id, customer_id, plate, brand, model, year (int), vin, created_at
- Columna `vehicle_id` en `bookings` (FK → vehicles.id, nullable para backwards compat)
- Migración: crear vehicles desde datos existentes de customers (plate), vincular bookings existentes

**RLS:**
- `vehicles`: anon puede insert (booking público), authenticated same tenant puede todo, solo owner elimina
- `bookings.vehicle_id`: mismo RLS que bookings, no requiere cambios adicionales

**Types (`src/lib/types.ts`):**
- Interface `Vehicle`
- Booking agrega `vehicle_id` opcional

**UI — Customers page:**
- En cada customer, mostrar lista de vehículos (plate, brand, model)
- Botón "Agregar vehículo" → modal con plate (requerido), brand, model, year, vin
- Botón editar/eliminar vehículo

**UI — Public booking:**
- Formulario de booking: después de nombre/teléfono, campo "Patente" con autocompletado si el cliente ya existe
- Si el cliente existe y tiene vehículos, selector de vehículo existente
- Si no, input para crear vehículo nuevo

**UI — Bookings list (dashboard):**
- Columna vehículo con plate + brand/model

**UI — Vehicle detail page (nueva):**
- `/dashboard/vehicles/[id]` — historial de bookings para ese vehículo
- Lista de servicios realizados, fechas, costos
- Botón para agendar nuevo servicio

**UI — Customer detail:**
- Sección "Vehículos" con enlace a historial de cada uno

---

### Fase B — Multi-servicio por reserva + Validación de capacidad

**Objetivo:** Una reserva puede tener múltiples servicios. `checkAvailability()` usa duración total para evitar superposición.

**DB:**
- Tabla `booking_services`: id (uuid PK), booking_id (FK → bookings.id, ON DELETE CASCADE), service_id (FK → services.id)
- `service_id` en `bookings` pasa a ser nullable (o se elimina a futuro, mantenemos por compat)
- Migración: crear `booking_services` desde `bookings.service_id` existente
- Trigger `on_booking_services_change` (opcional, podemos manejarlo desde app)

**Types (`src/lib/types.ts`):**
- Interface `BookingService` (booking_id, service_id)
- Booking.services pasa a ser `Service[]` (join vía booking_services)

**Availability (`src/lib/availability.ts`):**
- `checkAvailability()` se expande:
  1. Recibe service_ids[] y sus duraciones
  2. Calcula duración total en minutos
  3. Calcula hora fin = hora inicio + duración total
  4. Trae bookings del día con sus servicios y duraciones
  5. Por cada booking existente, calcula su slot (hora inicio → hora fin)
  6. Si el nuevo slot se superpone con alguno existente → unavailable
  7. Si no → available

**UI — Public booking:**
- Selector de servicios cambia de single a multi-select (checkboxes con precio + duración)
- Total estimado en vivo (suma de precios)
- Tiempo total estimado en vivo (suma de duraciones)

**UI — Dashboard booking detail:**
- Mostrar lista de servicios en vez de uno solo
- Editar servicios de una reserva

**UI — Dashboard create booking (manual):**
- Multi-select similar al público

---

### Fase C — Catálogo con imágenes

**Objetivo:** Servicios tienen imagen. Se muestra en sitio público y dashboard.

**Storage:**
- Bucket `service-images`, público, máximo 2MB, PNG/JPG/WebP
- Ruta: `{tenant_id}/{service_id}.{ext}`
- RLS: authenticated puede subir/borrar en su tenant, público puede leer

**DB:**
- Columna `image_url` en `services` (nullable)

**Types (`src/lib/types.ts`):**
- Service agrega `image_url: string | null`

**UI — Dashboard services:**
- En la lista/tarjeta de cada servicio, mostrar thumbnail
- Al crear/editar servicio, input para subir imagen (mismo patrón que logo upload)

**UI — Public site:**
- Servicios se muestran en grid con imagen, nombre, precio, duración
- Si no tiene imagen, placeholder o color sólido con icono

---

### Fase D — Vista calendario

**Objetivo:** Reemplazar/aumentar la lista plana de bookings con un calendario visual semanal.

**Dependencia:** Necesita duración de servicios (Fase B) para dimensionar slots.

**UI:**
- Nueva ruta `/dashboard/calendar` (o pestaña dentro de bookings)
- Vista semana como default, vista día opcional
- Cuadrícula: columnas = días (Lun-Sáb), filas = horas (08:00 - 20:00)
- Booking se muestra como bloque coloreado por status, con alto proporcional a duración
- Click en slot vacío → abrir modal "Nueva reserva" (con cliente, vehículo, servicios)
- Click en booking existente → abrir modal detalle (ver info, cambiar estado)
- Drag para cambiar estado (opcional, fase 2 del calendario)

**Implementación:**
- Componente custom (no librería externa) para mantener bundle pequeño
- Grid CSS con position absoluta para los bloques
- Fetch bookings del rango (semana actual)
- Navegación: semana anterior / siguiente / hoy

**Backend:**
- Nueva query `getCalendarBookings(tenant_id, start_date, end_date)` que trae bookings con servicios + duración + customer + vehicle en un solo viaje

---

### Fase E — Reportes básicos

**Objetivo:** Dashboard con datos históricos que justifiquen el valor del producto.

**UI - Nueva página `/dashboard/reports`:**
- Selector de mes/año
- **Ingresos del mes** — total, comparado con mes anterior (%)
- **Servicios más vendidos** — top 5 por cantidad y por ingreso
- **Clientes nuevos vs recurrentes** — gráfico de torta simple
- **Tasa de ocupación** — % de slots ocupados vs disponibles (según horarios configurados)
- **No-show rate** — % de bookings que nunca llegaron (reserved que pasaron la fecha)

**Implementación:**
- Queries agregadas con `GROUP BY` y ventanas mensuales
- Sin librería de gráficos — barras y tortas con CSS + SVG inline
- Cache en cliente (useMemo con dependencias de datos brutos)

---

## Orden de implementación

```
Fase A: Vehículos + Historial       ← base para booking multi-servicio
Fase B: Multi-servicio + Capacidad  ← bloquea doble booking, habilita calendario
Fase C: Catálogo imágenes           ← independiente
Fase D: Vista calendario            ← necesita Fase B (duración)
Fase E: Reportes                    ← independiente
```

Cada fase: spec → plan → implementación → build + push.
