# Admin Panel Redesign v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign admin panel UI with dropdown actions, tenant history logs, fix suspended page infinite loading, fix TrialBanner visibility.

**Architecture:** SECURITY DEFINER Postgres functions for admin DB access. Next.js App Router with route groups for isolated layouts. Shadcn DropdownMenu for admin actions.

**Tech Stack:** Next.js 16, Supabase, Tailwind CSS, shadcn/ui

## Global Constraints

- All DB mutations go through SECURITY DEFINER functions (never direct table access)
- Cookie path: `/` for admin_token
- Status values: `trial`, `active`, `paused`, `cancelled` (validated server-side)
- `tenant_logs.changed_by`: only `'admin'` or `'system'` or `'trial_expired'`
- All API routes check `admin_token` cookie + session in DB before any operation

---

### Task 1: DB — tenant_logs table + update functions

**Files:**
- Apply: via Supabase MCP migration
- Migration: `supabase/migrations/20260627003_add_tenant_logs.sql`

**Interfaces:**
- Consumes: existing `tenants` table, existing `admin_update_tenant` function
- Produces: `tenant_logs` table, `admin_get_tenant_logs(uuid)` function, updated `admin_update_tenant`, updated `admin_list_tenants`

- [ ] **Step 1: Apply migration to create tenant_logs + update functions**

Run via Supabase MCP tool `supabase_apply_migration`:

```sql
create table if not exists tenant_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  from_status text,
  to_status text not null,
  changed_by text not null default 'admin',
  created_at timestamptz default now()
);

create or replace function admin_update_tenant(
  p_tenant_id uuid,
  p_status text default null,
  p_notes text default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_current_status text;
begin
  select status into v_current_status from tenants where id = p_tenant_id;

  if p_status is not null and p_status != v_current_status then
    update tenants set status = p_status where id = p_tenant_id;

    insert into tenant_logs (tenant_id, from_status, to_status, changed_by)
    values (p_tenant_id, v_current_status, p_status, 'admin');
  end if;

  if p_notes is not null then
    update tenants set notes = p_notes where id = p_tenant_id;
  end if;

  return found;
end;
$$;

grant execute on function admin_update_tenant to anon, public;

create or replace function admin_get_tenant_logs(p_tenant_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_agg(json_build_object(
    'from_status', from_status,
    'to_status', to_status,
    'changed_by', changed_by,
    'created_at', created_at
  ) order by created_at desc)
  into result
  from tenant_logs
  where tenant_id = p_tenant_id;

  return coalesce(result, '[]'::json);
end;
$$;

grant execute on function admin_get_tenant_logs to anon, public;

create or replace function admin_list_tenants()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_agg(json_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'email', t.email,
    'status', t.status,
    'trial_ends_at', t.trial_ends_at,
    'notes', t.notes,
    'created_at', t.created_at,
    'days_remaining', case
      when t.status = 'trial' and t.trial_ends_at is not null then
        greatest(0, ceil(extract(epoch from (t.trial_ends_at - now())) / 86400))
      else null
    end,
    'planned_at', (
      select min(created_at) from tenant_logs
      where tenant_id = t.id and to_status = 'active' and from_status = 'trial'
    )
  ) order by t.created_at desc)
  into result
  from tenants t;

  return coalesce(result, '[]'::json);
end;
$$;

grant execute on function admin_list_tenants to anon, public;
```

- [ ] **Step 2: Save migration file locally**

```bash
cat > supabase/migrations/20260627003_add_tenant_logs.sql
```
Content is the SQL from Step 1 minus the `create table if not exists` (which is already in the DB).

```sql
create or replace function admin_update_tenant(
  p_tenant_id uuid,
  p_status text default null,
  p_notes text default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_current_status text;
begin
  select status into v_current_status from tenants where id = p_tenant_id;

  if p_status is not null and p_status != v_current_status then
    update tenants set status = p_status where id = p_tenant_id;

    insert into tenant_logs (tenant_id, from_status, to_status, changed_by)
    values (p_tenant_id, v_current_status, p_status, 'admin');
  end if;

  if p_notes is not null then
    update tenants set notes = p_notes where id = p_tenant_id;
  end if;

  return found;
end;
$$;

grant execute on function admin_update_tenant to anon, public;

create or replace function admin_get_tenant_logs(p_tenant_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_agg(json_build_object(
    'from_status', from_status,
    'to_status', to_status,
    'changed_by', changed_by,
    'created_at', created_at
  ) order by created_at desc)
  into result
  from tenant_logs
  where tenant_id = p_tenant_id;

  return coalesce(result, '[]'::json);
end;
$$;

grant execute on function admin_get_tenant_logs to anon, public;

create or replace function admin_list_tenants()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_agg(json_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'email', t.email,
    'status', t.status,
    'trial_ends_at', t.trial_ends_at,
    'notes', t.notes,
    'created_at', t.created_at,
    'days_remaining', case
      when t.status = 'trial' and t.trial_ends_at is not null then
        greatest(0, ceil(extract(epoch from (t.trial_ends_at - now())) / 86400))
      else null
    end,
    'planned_at', (
      select min(created_at) from tenant_logs
      where tenant_id = t.id and to_status = 'active' and from_status = 'trial'
    )
  ) order by t.created_at desc)
  into result
  from tenants t;

  return coalesce(result, '[]'::json);
end;
$$;

grant execute on function admin_list_tenants to anon, public;
```

- [ ] **Step 3: Commit migration**

```bash
git add supabase/migrations/20260627003_add_tenant_logs.sql
git commit -m "feat: add tenant_logs table and update admin functions"
```

---

### Task 2: Create logs API route

**Files:**
- Create: `src/app/api/admin/tenants/[id]/logs/route.ts`

**Interfaces:**
- Consumes: `admin_get_tenant_logs(uuid)` from Task 1, `createAdminClient` from `@/lib/supabase/admin`
- Produces: `GET /api/admin/tenants/[id]/logs` → JSON array of logs

- [ ] **Step 1: Create logs route**

```typescript
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAdminClient()

  const { data: session } = await supabase
    .from("admin_sessions")
    .select("id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase.rpc("admin_get_tenant_logs", { p_tenant_id: id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/tenants/[id]/logs/route.ts
git commit -m "feat: add admin tenant logs API route"
```

---

### Task 3: Rewrite admin dashboard UI (dropdown + Plan column + history modal)

**Files:**
- Modify: `src/app/controlroot/(protected)/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `GET /api/admin/tenants` (returns `planned_at` and `days_remaining: null` when not trial), `PUT /api/admin/tenants/[id]/status`, `GET /api/admin/tenants/[id]/logs`
- Produces: New admin dashboard with dropdown + plan column + history modal

- [ ] **Step 1: Rewrite admin page**

```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Tenant {
  id: string
  name: string
  slug: string
  email: string | null
  status: string
  trial_ends_at: string | null
  notes: string | null
  created_at: string | null
  days_remaining: number | null
  planned_at: string | null
}

interface LogEntry {
  from_status: string | null
  to_status: string
  changed_by: string
  created_at: string
}

const statusColors: Record<string, string> = {
  trial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" })
}

function getPlanLabel(t: Tenant): string {
  switch (t.status) {
    case "trial":
      return t.days_remaining !== null ? `Prueba: ${t.days_remaining} días` : "Prueba"
    case "active":
      return t.planned_at ? `Plan pagado desde ${formatDate(t.planned_at)}` : "Plan pagado"
    case "paused":
      return "Pausada"
    case "cancelled":
      return "Cancelada"
    default:
      return t.status
  }
}

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [historyTenant, setHistoryTenant] = useState<Tenant | null>(null)
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const router = useRouter()

  async function loadTenants() {
    const res = await fetch("/api/admin/tenants")
    if (res.status === 401) { router.push("/controlroot/login"); return }
    setTenants(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadTenants() }, [])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/tenants/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setOpenDropdown(null)
    await loadTenants()
  }

  async function updateNotes(id: string, notes: string) {
    await fetch(`/api/admin/tenants/${id}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    })
  }

  async function openHistory(t: Tenant) {
    setHistoryTenant(t)
    setHistoryOpen(true)
    setOpenDropdown(null)
    const res = await fetch(`/api/admin/tenants/${t.id}/logs`)
    setHistoryLogs(await res.json())
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/controlroot/login")
  }

  const statusLabel: Record<string, string> = {
    trial: "Prueba",
    active: "Activo",
    paused: "Pausado",
    cancelled: "Cancelado",
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="animate-pulse space-y-4 max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">CLICIO Admin</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/controlroot/settings")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cambiar contraseña</button>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 transition-colors">Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground">{tenants.length} cuenta{tenants.length !== 1 ? "s" : ""}</p>

        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Taller</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Notas</th>
                <th className="text-left px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getPlanLabel(t)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status] || ""}`}>
                      {statusLabel[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      defaultValue={t.notes || ""}
                      onBlur={(e) => updateNotes(t.id, e.target.value)}
                      className="w-32 rounded border border-border bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Nota..."
                    />
                  </td>
                  <td className="px-4 py-3 relative">
                    {t.status !== "cancelled" ? (
                      <>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === t.id ? null : t.id)}
                          className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          Acciones ▾
                        </button>
                        {openDropdown === t.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-border bg-background shadow-lg py-1">
                              {t.status === "trial" && (
                                <button onClick={() => updateStatus(t.id, "active")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Activar plan pagado</button>
                              )}
                              {t.status === "paused" && (
                                <button onClick={() => updateStatus(t.id, "active")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Activar plan pagado</button>
                              )}
                              {t.status !== "paused" && (
                                <button onClick={() => updateStatus(t.id, "paused")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Pausar</button>
                              )}
                              <button onClick={() => updateStatus(t.id, "cancelled")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Cancelar</button>
                              <hr className="my-1 border-border" />
                              <button onClick={() => openHistory(t)} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Ver historial</button>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <button onClick={() => openHistory(t)} className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors">Historial</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {historyOpen && historyTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setHistoryOpen(false)}>
          <div className="bg-background rounded-xl shadow-2xl border border-border max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="font-semibold">{historyTenant.name}</h2>
              <button onClick={() => setHistoryOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              {historyLogs.length === 0 && <p className="text-sm text-muted-foreground">Sin historial</p>}
              {historyLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm">
                      {log.from_status ? `${capitalize(log.from_status)} → ${capitalize(log.to_status)}` : capitalize(log.to_status)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("es-CL")} · {log.changed_by === "admin" ? "Admin" : log.changed_by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function capitalize(s: string) {
  const map: Record<string, string> = { trial: "Prueba", active: "Activo", paused: "Pausado", cancelled: "Cancelado" }
  return map[s] || s
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/controlroot/(protected)/page.tsx
git commit -m "feat: redesign admin dashboard with dropdown actions, plan column, and history modal"
```

---

### Task 4: Fix suspended page — move outside dashboard layout

**Files:**
- Create: `src/app/(suspended)/dashboard/suspended/page.tsx`
- Delete: `src/app/dashboard/suspended/page.tsx`

- [ ] **Step 1: Create suspended page in isolated route group**

```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function SuspendedPage() {
  const [reason, setReason] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/signin"); return }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

      if (!profile) return

      const { data: tenant } = await supabase
        .from("tenants")
        .select("status")
        .eq("id", profile.tenant_id)
        .single()

      if (tenant) setReason(tenant.status)
    })
  }, [])

  const messages: Record<string, { title: string; desc: string }> = {
    paused: {
      title: "Cuenta en pausa",
      desc: "Tu cuenta está temporalmente en pausa. Contacta a tu asesor para reactivar tu plan.",
    },
    cancelled: {
      title: "Cuenta cancelada",
      desc: "Tu cuenta ha sido cancelada. Si deseas volver, contacta a tu asesor.",
    },
  }

  const m = messages[reason || ""] || {
    title: "Acceso temporalmente suspendido",
    desc: "Tu período de prueba gratuita terminó. Contacta a tu asesor para activar tu plan.",
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <span className="text-2xl">⏸</span>
        </div>
        <h1 className="text-2xl font-bold">{m.title}</h1>
        <p className="text-muted-foreground leading-relaxed">{m.desc}</p>
        <a
          href="https://wa.me/56912345678"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Contactar por WhatsApp
        </a>
        <p className="text-xs text-muted-foreground">
          Tus datos están seguros. Nada se elimina. Al activar tu plan, todo vuelve a estar disponible.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Delete old suspended page**

```bash
rm src/app/dashboard/suspended/page.tsx
```

- [ ] **Step 3: Remove import of TrialBanner from dashboard layout** (will be handled in Task 5)

- [ ] **Step 4: Commit**

```bash
git add src/app/\(suspended\)/dashboard/suspended/page.tsx
git rm src/app/dashboard/suspended/page.tsx
git commit -m "fix: move suspended page outside dashboard layout to prevent infinite loading"
```

---

### Task 5: Fix TrialBanner — only show for trial

**Files:**
- Modify: `src/components/dashboard/trial-banner.tsx`

- [ ] **Step 1: Rewrite TrialBanner to check status before showing**

```typescript
"use client"

import { useEffect, useState, useCallback } from "react"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function TrialBanner() {
  const [message, setMessage] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

      if (!profile) return

      const { data: tenant } = await supabase
        .from("tenants")
        .select("status")
        .eq("id", profile.tenant_id)
        .single()

      // Only show banner for trial status
      if (!tenant || tenant.status !== "trial") return

      fetch("/api/trial/notification")
        .then((r) => r.json())
        .then((data) => {
          if (data.show) setMessage(data.message)
        })
        .catch(() => {})
    })
  }, [])

  const handleDismiss = useCallback(async () => {
    setDismissed(true)
    try { await fetch("/api/trial/notification/dismiss", { method: "POST" }) } catch {}
  }, [])

  if (!message || dismissed) return null

  return (
    <div className="flex items-center justify-between gap-4 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/30 px-4 py-2.5 text-sm text-indigo-700 dark:text-indigo-300">
      <p className="flex-1 text-center">{message}</p>
      <button onClick={handleDismiss} className="shrink-0 rounded p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors" aria-label="Cerrar">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/trial-banner.tsx
git commit -m "fix: TrialBanner only shows for trial status"
```

---

### Task 6: Update migration file locally

**Files:**
- Create: `supabase/migrations/20260627003_add_tenant_logs.sql` (if not already done)

- [ ] **Step 1: Write migration file**

Write the SQL from Task 1 Step 2 to `supabase/migrations/20260627003_add_tenant_logs.sql` (if not already saved).

- [ ] **Step 2: Build and verify**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Push all commits**

```bash
git push
```
