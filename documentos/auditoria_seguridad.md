# Auditoría de Seguridad — CLICIO.app

> Auditoría de seguridad integral del código base.
> Basado en revisión de RLS policies, auth flow, middleware, storage, y config.
> Fecha: 2026-06-20

---

## Resumen

16 hallazgos: **3 altos**, **5 medios**, **5 bajos**, **3 informativos**.
Todas las tablas tienen RLS habilitado. No hay service_role key expuesta. No hay SQL injection.
Riesgos principales: datos de vehículos expuestos públicamente, creación sin restricción de clientes/vehículos por anon, falta de security headers.

---

## 🔴 Riesgos Altos

### A1 — Vehículos expuestos públicamente

**Archivo:** `supabase-schema.sql` línea ~526

**Problema:** Política `vehicles_anon_select` con `USING (true)`. Cualquier persona no autenticada puede listar TODAS las patentes, marcas, modelos, VIN de todos los talleres registrados. Grave violación de privacidad.

**Fix:**
- Eliminar `vehicles_anon_select` o restringirla para que solo devuelva vehículos asociados al tenant del slug solicitado
- Alternativa: solo permitir SELECT anónimo de vehículos vinculados a una solicitud de booking activa

### A2 — Clientes creados por cualquiera en cualquier taller

**Archivo:** `supabase-schema.sql` línea ~205

**Problema:** `customer_public_insert` con `with check (true)`. Cualquier anónimo puede insertar clientes en cualquier tenant_id si conoce el ID del taller (obtenible del slug público). Posibilidad de llenar la BD con datos falsos.

**Fix:**
- Restringir `with check` para validar que `tenant_id` coincida con el tenant del slug actual
- Requiere función `security definer` que valide el contexto

### A3 — Vehículos insertados por cualquiera

**Archivo:** `supabase-schema.sql` línea ~525

**Problema:** `vehicles_anon_insert` con `with check (true)`. Mismo problema que A2 pero para vehículos.

**Fix:**
- Ídem A2: restringir inserción al tenant_id válido

---

## 🟡 Riesgos Medios

### B1 — Sin Security Headers

**Archivo:** `next.config.ts`

**Problema:** No hay `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`. La app puede ser iframeada (clickjacking), no fuerza HTTPS, MIME sniffing posible.

**Fix:**
```ts
// next.config.ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ]
  }]
}
```
CSP requiere configuración más específica según recursos cargados.

### B2 — Dashboard sin protección server-side

**Archivo:** `src/middleware.ts`

**Problema:** El middleware solo refresca la sesión/cookie. No bloquea rutas no autenticadas. La única protección del dashboard es client-side en `layout.tsx` (verifica `getUser()` y redirige). Deshabilitando JavaScript se evade la redirección (aunque RLS bloquearía datos).

**Fix:**
- Agregar verificación server-side en middleware para rutas `/dashboard/*`
- Redirigir a `/signin` si `getUser()` no retorna usuario

### B3 — Sin políticas RLS para bucket `logos`

**Archivo:** `supabase-schema.sql`

**Problema:** El bucket `logos` se usa en settings para subir logos. No hay políticas RLS definidas en el schema SQL para `storage.objects` con `bucket_id = 'logos'`. Si no se configuraron manualmente en dashboard de Supabase, las operaciones fallan por denegación implícita.

**Fix:**
- Agregar políticas RLS para bucket `logos` en el schema SQL (SELECT pública, INSERT/UPDATE/DELETE autenticado con restricción de tenant_id en folder path)

### B4 — `logo_url` podría ser XSS

**Archivo:** `src/app/[slug]/page.tsx` línea ~236

**Problema:** `logo_url` se renderiza como `<img src={tenant.logo_url} />`. El valor viene de la BD. Un owner malicioso (o alguien con acceso a la tabla tenants) podría setear `logo_url = "javascript:alert(1)"`. Aunque React escape atributos, `javascript:` en `src` es ejecutable en algunos contextos.

**Fix:**
- Validar que `logo_url` pertenezca al bucket `logos` de Supabase Storage
- O prefixar con la URL del storage y no permitir URLs arbitrarias

### B5 — Open redirect potencial en callback

**Archivo:** `src/app/(auth)/callback/route.ts` línea ~7

**Problema:** `const next = searchParams.get("next") ?? "/dashboard"`. No hay validación de la URL de redirect. Un atacante podría usar `?next=https://evil.com` para phishing.

**Fix:**
```ts
const rawNext = searchParams.get("next") ?? "/dashboard"
const next = rawNext.startsWith("/") ? rawNext : "/dashboard"
```

---

## 🟢 Riesgos Bajos

### C1 — `crypto.randomUUID()` falla en HTTP

**Archivo:** `src/app/dashboard/settings/gallery-section.tsx` línea ~14

**Problema:** `crypto.randomUUID()` lanza error en contexto HTTP (no HTTPS). Ya tiene fallback (`Date.now() + Math.random()`), pero el fallback es criptográficamente débil.

**Estado:** ✅ **YA CORREGIDO** — Se implementó `genId()` con try-catch implícito y fallback. Aceptable para nombres de archivo imagen.

### C2 — Flash de contenido no autenticado

**Archivo:** `src/app/dashboard/layout.tsx` líneas ~61-68

**Problema:** El dashboard se renderiza momentáneamente antes de que la verificación client-side redirija. Hay un breve flash del layout sin datos (skeleton o loader no implementado).

**Fix:**
- Agregar estado `loading` inicial y mostrar spinner hasta verificar auth
- O migrar protección a server-side (ver B2)

### C3 — Token de invitación en URL

**Archivo:** `src/app/(auth)/join/page.tsx`

**Problema:** El código de invitación va en la URL (`/join?code=...`). Visible en historial, referrer headers, y captura de pantalla.

**Mitigación:** Código temporal (expira), UUID de 16 chars difícil de adivinar. Riesgo bajo.

### C4 — Sin rate limiting en auth

**Problema:** No hay protección contra fuerza bruta en `/signin` ni en endpoints de Supabase Auth.

**Mitigación:** Supabase Auth tiene rate limiting interno (por IP, por email). No configurable desde app.

**Estado:** ✅ **GESTIONADO POR SUPABASE**

### C5 — Validación débil de folder path en storage RLS

**Archivo:** `supabase-schema.sql` línea ~336

**Problema:** La política de storage usa `(storage.foldername(name))[1]` para extraer el tenant_id. Solo revisa el primer folder. Un subpath como `tenant_id/../malicious/` podría evadir la validación.

**Riesgo:** Muy bajo — Supabase Storage normaliza paths y no interpreta `..`.

---

## ℹ️ Informativos

### D1 — Funciones `security definer` correctas

Tres funciones usan `security definer` con `set search_path = ''`:
- `get_user_tenant_id()`
- `is_owner()`
- `handle_new_user()` (trigger)
- `handle_booking_delivered()` (trigger)
- `check_reward_eligibility()` (trigger)

**Estado:** ✅ **BUENA PRÁCTICA** — `set search_path = ''` previene ataques de search_path. Las funciones trigger están correctamente revocadas de anon/authenticated.

### D2 — No hay SQL injection

Todas las consultas usan Supabase JavaScript client (parametrizado). No hay SQL raw en la app.

**Estado:** ✅ **SEGURO**

### D3 — No hay service_role key en código

No se usa `SUPABASE_SERVICE_ROLE_KEY` en ningún archivo. Solo `ANON_KEY` que es pública por diseño.

**Estado:** ✅ **BUENA PRÁCTICA**

---

## Prioridades de Acción

| # | Hallazgo | Severidad | Esfuerzo | Acción |
|---|---|---|---|---|
| 1 | A1 — Vehículos expuestos | 🔴 Alta | Bajo | Restringir RLS `vehicles_anon_select` |
| 2 | A2 — Clientes insertados por cualquiera | 🔴 Alta | Bajo | Restringir RLS `customer_public_insert` |
| 3 | A3 — Vehículos insertados por cualquiera | 🔴 Alta | Bajo | Restringir RLS `vehicles_anon_insert` |
| 4 | B1 — Security headers | 🟡 Media | Bajo | Agregar en `next.config.ts` |
| 5 | B2 — Protección dashboard server-side | 🟡 Media | Medio | Modificar middleware |
| 6 | B3 — RLS bucket logos | 🟡 Media | Bajo | Agregar políticas en schema SQL |
| 7 | B4 — XSS en logo_url | 🟡 Media | Bajo | Validar URL en upload |
| 8 | B5 — Open redirect | 🟡 Media | Bajo | Validar `next` parameter |

---

## Lo que ya está asegurado

- ✅ RLS habilitado en TODAS las tablas
- ✅ No hay service_role key en el código
- ✅ Funciones `security definer` con `set search_path = ''`
- ✅ No hay SQL injection (queries parametrizadas)
- ✅ Triggers correctamente revocados de roles públicos
- ✅ `crypto.randomUUID()` con fallback implementado (genId)
- ✅ Rate limiting delegado a Supabase Auth
- ✅ Storage paths normalizados por Supabase (no interpretan `..`)
