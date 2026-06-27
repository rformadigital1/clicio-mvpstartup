# Trial & Subscription System — Design Spec

## Overview

Sistema de prueba gratuita de 14 días para talleres (tenants) en CLICIO. Los pagos son manuales (transferencia, efectivo). El dueño de CLICIO administra las cuentas desde un panel super admin. Notificaciones in-app no intrusivas recuerdan al usuario los días restantes.

---

## 1. Database Changes

### 1.1 tenants — new columns

```sql
alter table tenants
  add column status text not null default 'trial'
    check (status in ('trial', 'active', 'paused', 'cancelled')),
  add column trial_ends_at timestamptz,
  add column notes text;  -- admin notes about payment/client
```

### 1.2 super_admin table

```sql
create table super_admin (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Seed (hash de "admin123" generado al deploy)
insert into super_admin (username, password_hash)
values ('cliciobdl', '<generated-scrypt-hash>');
```

### 1.3 admin_sessions table

```sql
create table admin_sessions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
```

### 1.4 trial_notifications table

```sql
create table trial_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  last_notified_at date not null,
  unique(tenant_id, last_notified_at)
);
```

### 1.5 Modified trigger: handle_new_user()

Add to existing function before `return new;`:

```sql
  -- Set trial period
  update public.tenants
  set trial_ends_at = now() + interval '14 days'
  where id = v_tenant_id;
```

---

## 2. Enforcement (Access Control)

### Layer 1 — Middleware (`src/middleware.ts`)

- On every `/dashboard/**` request, check tenant status
- If status = `paused` or `cancelled` → redirect to `/dashboard/suspended`
- If status = `trial` → allow (banner shown in layout)
- Uses cookie-based session to identify user → reads profile → reads tenant status

Implementation: new file `src/lib/tenant-guard.ts` with `getTenantStatus(userId)` function.

### Layer 2 — Dashboard Layout (`src/app/dashboard/layout.tsx`)

After loading profile + tenant, check status client-side:
- If paused/cancelled → render `<SuspendedScreen />` instead of dashboard
- If trial → render `<TrialBanner />` component

### Suspended Screen (`src/app/dashboard/suspended/page.tsx`)

- Static page: "Tu período de prueba terminó. Contacta a tu asesor para regularizar tu situación."
- No sidebar, no nav. Minimal layout.
- Contact via WhatsApp link (wa.me) or email.

---

## 3. In-App Notifications

### Component: `<TrialBanner />`

Rendered in dashboard layout when tenant status = `trial`. Dismissible, one alert per day.

**Logic:**
1. On mount, call API route `GET /api/trial/notification`
2. Server checks `trial_notifications` for today's entry
3. If already notified today → return null (no banner)
4. If not notified → return message based on days remaining
5. Banner dismiss → calls `POST /api/trial/notification/dismiss`
6. Server inserts `(tenant_id, today)` into `trial_notifications`

**Messages per days remaining:**

| Days left | Banner text |
|-----------|-------------|
| > 7 | Sin banner (primeros días sin presión) |
| 7–2 | "Te quedan {X} días de prueba gratuita." |
| 1 | "Último día de prueba. Regula tu situación para seguir usando CLICIO." |
| 0+ | "Prueba finalizada. Contacta a tu asesor para activar tu plan." |

**Styling:**
- Blue/indigo background
- Dismiss button (X)
- No modal — inline banner below header
- Fade in animation

---

## 4. Admin Panel (`/adminboard`)

### Authentication

- Separate from Supabase Auth
- POST `/api/admin/login` with JSON `{ username, password }`
- Server verifies hash against `super_admin` table
- Creates session in `admin_sessions`, returns token
- Cookie: `admin_token` (httpOnly, secure, sameSite=lax, 24h expiry)
- Middleware on `/adminboard/*` checks cookie → redirects to `/adminboard/login` if invalid

### Pages

**`/adminboard/login`** — Simple login form (username + password)

**`/adminboard`** — Dashboard listing all tenants
- Table columns: Nombre, Email, Slug, Status (badge colored), Trial ends, Days left, Notes
- Each row: buttons Activar / Pausar / Cancelar
- Confirmation dialog before status change

**`/adminboard/settings`** — Change password form

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/login` | POST | Authenticate, return token |
| `/api/admin/logout` | POST | Destroy session |
| `/api/admin/me` | GET | Verify session |
| `/api/admin/password` | PUT | Change password |
| `/api/admin/tenants` | GET | List all tenants |
| `/api/admin/tenants/[id]/status` | PUT | Update tenant status |
| `/api/admin/tenants/[id]/notes` | PUT | Update tenant notes |

All admin API routes check `admin_token` cookie and verify session.

### Seed Script

Script to generate password hash for initial admin user. Run via `node scripts/seed-admin.mjs`:

```js
const crypto = require('crypto');
// generates scrypt hash for given password
```

---

## 5. Security Considerations

| Attack | Mitigation |
|--------|------------|
| Bypass status check via direct DB write | RLS on tenants — only super_admin or the trigger can change status. Regular users have RLS restricted. |
| Bypass middleware by calling API directly | API routes check auth + tenant status independently |
| Session hijacking | httpOnly cookie, short expiry (24h), token is random 32 bytes |
| Timing attack on admin login | Constant-time comparison via crypto.timingSafeEqual |
| User modifies trial_ends_at | RLS prevents updates to trial_ends_at from user. Only trigger sets it. |
| Access after suspension via stale JWT | Middleware check happens on every request, not just at login. |

---

## 6. Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260627001_add_trial_status.sql` | Create | DB changes (columns, tables, trigger update) |
| `src/lib/tenant-guard.ts` | Create | `getTenantStatus()`, `checkAccess()` utils |
| `src/middleware.ts` | Modify | Add tenant status check for dashboard routes |
| `src/app/dashboard/suspended/page.tsx` | Create | Suspended screen |
| `src/components/dashboard/trial-banner.tsx` | Create | Banner component |
| `src/app/dashboard/layout.tsx` | Modify | Add trial banner + status check |
| `src/app/api/trial/notification/route.ts` | Create | GET (check) + POST (dismiss) |
| `src/app/adminboard/page.tsx` | Create | Admin dashboard |
| `src/app/adminboard/login/page.tsx` | Create | Login form |
| `src/app/adminboard/settings/page.tsx` | Create | Change password |
| `src/app/adminboard/layout.tsx` | Create | Admin layout + auth check |
| `src/app/api/admin/login/route.ts` | Create | Admin auth |
| `src/app/api/admin/logout/route.ts` | Create | Admin logout |
| `src/app/api/admin/me/route.ts` | Create | Verify session |
| `src/app/api/admin/password/route.ts` | Create | Change password |
| `src/app/api/admin/tenants/route.ts` | Create | List tenants |
| `src/app/api/admin/tenants/[id]/status/route.ts` | Create | Update status |
| `src/app/api/admin/tenants/[id]/notes/route.ts` | Create | Update notes |
| `scripts/seed-admin.mjs` | Create | Generate hash + insert admin |

---

## 7. Future Considerations (not implemented now)

- Payment gateway integration (MercadoPago, Khipu)
- Automatic status change from trial → active when payment confirmed
- Email notifications (for users who don't visit dashboard)
- Plan tiers (basic/pro)
