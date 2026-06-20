# Fase 1 — Horarios Laborales, Validación Disponibilidad, AlertDialog

## Objetivo
Que talleres puedan definir su horario de atención, validar que las reservas caigan dentro de ese horario, y evitar eliminaciones accidentales con confirmación.

## Componentes

### 1. DB: `business_hours` + `blocked_dates`

```sql
create table business_hours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  day_of_week int not null check (day_of_week between 0 and 6),
  open_time time not null,
  close_time time not null,
  is_open boolean default true,
  unique(tenant_id, day_of_week)
);

create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  date date not null,
  reason text,
  unique(tenant_id, date)
);
```

RLS: ambas tablas con policies estándar `tenant_id = get_user_tenant_id()`.

### 2. Servicio: validación disponibilidad

Función DB `is_booking_available(tenant_id, date, time, service_id)`:
- Verifica que `date` no esté en `blocked_dates`
- Verifica que `day_of_week` tenga `is_open = true`
- Verifica que `time` esté entre `open_time` y `close_time`
- Verifica que no exista booking en mismo tenant/fecha/hora

Alternativa: validar desde la app cliente antes de insertar (menos acoplado a DB).

### 3. UI Settings: editor de horarios

Card "Horarios de atención": tabla con 7 filas (lun-dom).
Cada fila: switch toggle + inputs time (apertura/cierre).
Botón guardar cambios. `useToast` para feedback.

Card "Fechas bloqueadas": lista con botón eliminar + diálogo para agregar fecha con motivo.

### 4. UI Sitio público: mostrar horarios

Sección "Horarios" en `/[slug]` con formato legible.
Si todos los días tienen mismo horario: mostrar "Lun a Vie 9:00-18:00".
Si varían: mostrar lista por día.

### 5. AlertDialog

Componente UI `<AlertDialog>` basado en `@radix-ui/react-dialog`.
Props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `onCancel`, `confirmText`, `cancelText`.

Reemplazar delete directo en:
- Services (`handleDelete`)
- Customers (`handleDelete`)
- LoyaltyRules (`handleDelete`)

### 6. Validación booking (dashboard + público)

Antes de insertar booking:
- Si existe `business_hours` configurado: validar fecha/hora
- Si no existe (migración): permitir sin restricción (backwards compatible)
- En sitio público: deshabilitar fechas/horas no disponibles en el input

## Flujo de datos

```
Settings (guardar) → Supabase `business_hours` + `blocked_dates`
Booking (cualquier origen) → validar disponibilidad → insertar o rechazar con toast/mensaje
Sitio público (cargar) → leer `business_hours` → mostrar horarios
```

## No incluye (scope explícito)
- Validación por duración del servicio (Fase 3+)
- Bloqueo por capacidad de staff
- Integración con calendario externo
