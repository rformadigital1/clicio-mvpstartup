# Auditoría de Seguridad — clicio.app

> Generado: 2026-06-24
> Estado: Pendiente de implementación

---

## 🚨 Pérdida de datos

### 1. Borrar cliente con reservas → Falla silenciosamente

**Archivo:** `src/app/dashboard/customers/page.tsx:181`
**Problema:** `supabase.from("customers").delete().eq("id", id)`
- FK `bookings.customer_id` tiene `NO ACTION` → DELETE falla si hay reservas
- FK `vehicles.customer_id` tiene `ON DELETE CASCADE` → vehículos se borran aunque el DELETE falle
- Error se muestra al usuario como toast sin manejo adicional
- No hay confirmación de riesgos antes de borrar

**Fix:**
- Antes de borrar, consultar `bookings` count para el customer
- Si tiene reservas, mostrar mensaje claro: "No se puede eliminar: tiene N reservas activas"
- Si tiene vehículos, migrar FK a `SET NULL` o avisar
- Deshabilitar delete button para customers con datos asociados

### 2. Borrar servicio → borra historial de reservas

**Archivo:** `src/app/dashboard/services/page.tsx`
**Problema:** `booking_services.service_id` tiene `ON DELETE CASCADE`
- Borrar un servicio elimina todas las referencias en `booking_services`
- El historial de reservas pasadas pierde qué servicio se realizó
- FK debería ser `SET NULL` en lugar de `CASCADE`

**Fix:**
- Migration: cambiar FK `booking_services.service_id` a `ON DELETE SET NULL`
- Antes de borrar, verificar si el servicio tiene referencias en `booking_services`
- Si tiene historial, mostrar advertencia y permitir borrado sabiendo que se perderán referencias

### 3. No existe soft-delete

**Tablas sin soft-delete:** customers, services, bookings, vehicles, gallery_images
**Problema:** Todos los DELETE son irreversibles. No hay `deleted_at`, `is_active` ni papelera.

**Fix (aplazado):** Implementar soft-delete con columna `deleted_at` requiere cambios mayores de schema y queries. Por ahora, mitigar con validaciones previas al DELETE.

### 4. Storage: huérfanos al borrar galería

**Problema:** Borrar registro en `gallery_images` no borra el archivo del storage bucket.
**Fix:** Al hacer DELETE en gallery, también eliminar el objeto del storage bucket.

---

## 🔴 Vulnerabilidades críticas

### 5. `.env.local` commiteado al repo

**Archivo:** `.env.local`
**Problema:** No está en `.gitignore`. Cualquiera con acceso al repo ve:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

**Fix:** Agregar `.env.local` a `.gitignore`. Verificar que no haya quedado en histórico de git (opcional: `git rm --cached`).

### 6. Open redirect en callback de auth

**Archivo:** `src/app/auth/callback/route.ts`
**Problema:** Parámetro `next` solo verifica que empiece con `/`. Un atacante puede usar `?next=//evil.com` para redirigir después del login.

**Fix:** Validar que `next` sea una ruta interna conocida:
- Solo permitir rutas que empiecen con `/dashboard`
- Rechazar `//dominioexterno.com`

### 7. Instagram URL → XSS almacenado

**Archivo:** `src/app/[slug]/page.tsx` (línea ~148)
**Problema:** `href={tenant.instagram}` renderizado directo. Si alguien configura `javascript:alert(1)`, se ejecuta al hacer click.

**Fix:** Sanitizar URL de Instagram en el output:
- Si no empieza con `https://instagram.com/` o `https://www.instagram.com/`, no renderizar link
- O usar `rel="noopener noreferrer"` + `target="_blank"` + validar protocolo

### 8. Inserts anónimos sin restricción

**Políticas RLS:** `customer_public_insert` y `vehicles_anon_insert`
**Problema:** Cualquier usuario anónimo puede crear customers y vehicles en cualquier tenant existente. Sin rate limiting, captcha ni validación.

**Fix (limitado):**
- Implementar rate limiting a nivel de aplicación (middleware o API route)
- Agregar validación de tenant_id (que exista y esté activo)
- Agregar rate limit en el booking-wizard público

---

## 🟡 Riesgos moderados

### 9. Sin validación server-side

**Problema:** Toda la data va directo del cliente a Supabase. Validaciones HTML5 (pattern, required, min) se bypassan con curl.

**Fix (arquitectural):** Migrar operaciones críticas a API routes o server actions. Para esta app bastan las validaciones vía RLS + checks previos en el cliente.

### 10. Sin CSP headers

**Problema:** `middleware.ts` solo maneja auth. No establece Content-Security-Policy headers.

**Fix:** Agregar CSP headers en middleware para mitigar XSS.

### 11. CSV injection

**Archivos:** `calendar/page.tsx:exportAgendaCSV`, `reports/page.tsx:exportCSV`
**Problema:** Nombres de cliente/servicio que empiecen con `=`, `+`, `-`, `@` se interpretan como fórmulas en Excel.

**Fix:** Escapar caracteres de fórmula peligrosos: prefijar con `'` o `\t` si el string empieza con `=`, `+`, `-`, `@`.

### 12. Service-images bucket sin is_owner check

**Política RLS:** `service_images_authenticated_insert/update/delete`
**Problema:** Cualquier usuario autenticado (staff) puede subir/borrar imágenes en `service-images` bajo su tenant folder. A diferencia de gallery, no hay check de `is_owner()`.

**Fix:** Migration para agregar `is_owner()` check a las políticas de `service-images`, consistente con gallery.

---

## ✅ Ya está bien

- RLS en 13/13 tablas
- `is_owner()` function con `security definer`
- `get_user_tenant_id()` function previene IDOR entre tenants
- React escapa todo el output (no `dangerouslySetInnerHTML`)
- Sin `service_role key` expuesta
- WhatsApp links sanitizados a solo dígitos
- Sin `booking_delete` policy (protección contra borrado masivo)
- `profiles` RLS impide manipular `tenant_id`

---

## Checklist de implementación

- [ ] `.env.local` → `.gitignore`
- [ ] Callback: validar `next` como ruta interna
- [ ] Instagram URL sanitize
- [ ] Customer delete: check bookings + preserve vehicles
- [ ] Service delete: check booking_services antes de borrar
- [ ] Migration: booking_services FK SET NULL
- [ ] Gallery: cleanup storage al borrar
- [ ] CSV injection: escapar fórmulas
- [ ] CSP headers en middleware
- [ ] Migration: is_owner check en service-images bucket
