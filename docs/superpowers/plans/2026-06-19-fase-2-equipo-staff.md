# Fase 2 — Staff Management Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax.

**Goal:** Owner invites staff via code, staff signs up with limited dashboard (bookings + customers read-only).

**Architecture:** DB trigger detects `invite_code` metadata → creates staff profile linked to existing tenant. Frontend reads `profiles.role` to filter nav + restrict pages.

**Tech Stack:** Supabase (DB triggers, RLS), Next.js App Router, shadcn/ui

---

## Files

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase-schema.sql` | Modify | Add `staff_invitations` table, `is_owner()` function, updated trigger, RLS |
| `src/lib/types.ts` | Modify | Add `StaffInvitation` type |
| `src/app/(auth)/join/page.tsx` | Create | Staff signup with invite code |
| `src/app/dashboard/layout.tsx` | Modify | Load role, filter nav, pass role context |
| `src/app/dashboard/page.tsx` | No change | — |
| `src/app/dashboard/bookings/page.tsx` | Modify | Hide delete for staff |
| `src/app/dashboard/customers/page.tsx` | Modify | Hide delete for staff |
| `src/app/dashboard/services/page.tsx` | Modify | Redirect staff to dashboard |
| `src/app/dashboard/loyalty/page.tsx` | Modify | Redirect staff to dashboard |
| `src/app/dashboard/settings/page.tsx` | Modify | Add staff section, redirect staff |
| `src/app/dashboard/settings/staff-section.tsx` | Create | Staff management UI |

---

### Task 1: DB — apply functions + table + trigger + RLS via Supabase MCP

- [ ] **Step 1: Execute SQL via Supabase MCP (`supabase_execute_sql`)**

```sql
-- 1. is_owner() helper function
create or replace function public.is_owner()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

revoke execute on function public.is_owner from anon, public;
grant execute on function public.is_owner to authenticated;

-- 2. staff_invitations table
create table if not exists staff_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null unique,
  used boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

alter table staff_invitations enable row level security;

create policy "staff_invitations_select" on staff_invitations for select to authenticated
  using (tenant_id = public.get_user_tenant_id() and public.is_owner());

create policy "staff_invitations_insert" on staff_invitations for insert to authenticated
  with check (tenant_id = public.get_user_tenant_id() and public.is_owner());

create policy "staff_invitations_update" on staff_invitations for update to authenticated
  using (tenant_id = public.get_user_tenant_id() and public.is_owner())
  with check (tenant_id = public.get_user_tenant_id() and public.is_owner());

create policy "staff_invitations_delete" on staff_invitations for delete to authenticated
  using (tenant_id = public.get_user_tenant_id() and public.is_owner());

create index if not exists idx_staff_invitations_tenant_id on staff_invitations(tenant_id);
create index if not exists idx_staff_invitations_code on staff_invitations(code);

-- 3. restrict staff from DELETE on services
drop policy if exists "service_delete" on services;
create policy "service_delete" on services for delete to authenticated using (
  tenant_id = public.get_user_tenant_id() and public.is_owner()
);

-- 4. restrict staff from DELETE on customers
drop policy if exists "customer_delete" on customers;
create policy "customer_delete" on customers for delete to authenticated using (
  tenant_id = public.get_user_tenant_id() and public.is_owner()
);

-- Note: customers INSERT/UPDATE remain open (staff adds customers via booking)
-- Note: customers page will hide edit/delete buttons for staff (frontend)

-- 5. restrict staff from mutations on business_hours
drop policy if exists "business_hours_insert" on business_hours;
create policy "business_hours_insert" on business_hours for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id() and public.is_owner()
);
drop policy if exists "business_hours_update" on business_hours;
create policy "business_hours_update" on business_hours for update to authenticated
  using (tenant_id = public.get_user_tenant_id() and public.is_owner())
  with check (tenant_id = public.get_user_tenant_id() and public.is_owner());
drop policy if exists "business_hours_delete" on business_hours;
create policy "business_hours_delete" on business_hours for delete to authenticated using (
  tenant_id = public.get_user_tenant_id() and public.is_owner()
);

-- 6. restrict staff from mutations on blocked_dates
drop policy if exists "blocked_dates_insert" on blocked_dates;
create policy "blocked_dates_insert" on blocked_dates for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id() and public.is_owner()
);
drop policy if exists "blocked_dates_delete" on blocked_dates;
create policy "blocked_dates_delete" on blocked_dates for delete to authenticated using (
  tenant_id = public.get_user_tenant_id() and public.is_owner()
);

-- 7. restrict staff from mutations on loyalty_rules
drop policy if exists "loyalty_insert" on loyalty_rules;
create policy "loyalty_insert" on loyalty_rules for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id() and public.is_owner()
);
drop policy if exists "loyalty_update" on loyalty_rules;
create policy "loyalty_update" on loyalty_rules for update to authenticated
  using (tenant_id = public.get_user_tenant_id() and public.is_owner())
  with check (tenant_id = public.get_user_tenant_id() and public.is_owner());
drop policy if exists "loyalty_delete" on loyalty_rules;
create policy "loyalty_delete" on loyalty_rules for delete to authenticated using (
  tenant_id = public.get_user_tenant_id() and public.is_owner()
);

-- 8. restrict staff from updating tenants (settings)
drop policy if exists "tenant_update" on tenants;
create policy "tenant_update" on tenants for update to authenticated
  using (id = public.get_user_tenant_id() and public.is_owner())
  with check (id = public.get_user_tenant_id() and public.is_owner());
```

- [ ] **Step 2: Execute trigger replacement SQL via Supabase MCP**

```sql
-- Replace handle_new_user trigger to support staff invites
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_tenant_id uuid;
  v_tenant_slug text;
  v_invite record;
begin
  -- Staff invite flow
  if new.raw_user_meta_data ? 'invite_code' then
    select * into v_invite from public.staff_invitations
    where code = new.raw_user_meta_data ->> 'invite_code'
      and used = false
      and expires_at > now();

    if found then
      update public.staff_invitations set used = true where id = v_invite.id;
      insert into public.profiles (id, tenant_id, email, role)
      values (new.id, v_invite.tenant_id, new.email, 'staff');
      return new;
    end if;
  end if;

  -- Normal flow: create tenant + owner
  v_tenant_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'taller_nombre', 'taller'),
    '[^a-z0-9]+', '-', 'g'
  ));
  v_tenant_slug := v_tenant_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.tenants (name, slug, email)
  values (
    coalesce(new.raw_user_meta_data ->> 'taller_nombre', 'Mi Taller'),
    v_tenant_slug,
    new.email
  )
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, email, role)
  values (new.id, v_tenant_id, new.email, 'owner');

  return new;
end;
$$;

-- Re-link trigger (in case it was dropped)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

- [ ] **Step 3: Verify DB changes via MCP**

Run: `supabase_execute_sql` with `SELECT /* check tables exist */ count(*) from staff_invitations`
Expected: returns 0 (table exists, empty)

---

### Task 2: Types + StaffInvitation

- [ ] **Step 1: Add StaffInvitation to `src/lib/types.ts`**

```typescript
export interface StaffInvitation {
  id: string
  tenant_id: string
  code: string
  used: boolean
  created_at: string
  expires_at: string
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit` or check build

---

### Task 3: Layout — load role + filter nav + context

- [ ] **Step 1: Rewrite `src/app/dashboard/layout.tsx`**

Read profile.role on mount, store in state + context. Filter navItems by role. Remove "Configuración" from staff dropdown menu. Show user initials in avatar.

```tsx
"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToastProvider } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Calendar, Users, Car, Settings, LayoutDashboard, Gift, LogOut, Menu, UserCog } from "lucide-react"
import { useState, useEffect, createContext, useContext } from "react"

type RoleInfo = {
  isOwner: boolean
  role: "owner" | "staff"
  email: string
}

const RoleContext = createContext<RoleInfo | null>(null)

export function useRole() {
  return useContext(RoleContext)
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, ownerOnly: false },
  { href: "/dashboard/bookings", label: "Agenda", icon: Calendar, ownerOnly: false },
  { href: "/dashboard/customers", label: "Clientes", icon: Users, ownerOnly: false },
  { href: "/dashboard/services", label: "Servicios", icon: Car, ownerOnly: true },
  { href: "/dashboard/loyalty", label: "Fidelización", icon: Gift, ownerOnly: true },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings, ownerOnly: true },
  { href: "/dashboard/settings?tab=staff", label: "Equipo", icon: UserCog, ownerOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider><DashboardInner>{children}</DashboardInner><Toaster /></ToastProvider>
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    loadRole()
  }, [])

  async function loadRole() {
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) { router.push("/signin"); return }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single()

    if (profile) {
      setRoleInfo({ isOwner: profile.role === "owner", role: profile.role, email: profile.email })
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/signin")
  }

  const filteredNav = navItems.filter(item => !item.ownerOnly || roleInfo?.isOwner)

  const staffOnlyPaths = ["/dashboard/services", "/dashboard/loyalty", "/dashboard/settings"]
  if (!loading && roleInfo && !roleInfo.isOwner && staffOnlyPaths.includes(pathname)) {
    return <DashboardInnerRedirect />
  }

  if (loading || !roleInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  const userInitial = roleInfo.email.charAt(0).toUpperCase()

  return (
    <RoleContext.Provider value={roleInfo}>
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="flex h-16 items-center px-4 gap-4">
            <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="text-lg font-bold">CLICIO</Link>
            <div className="ml-auto flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{roleInfo.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {roleInfo.isOwner && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">Configuración</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex">
          <aside className={`${sidebarOpen ? "block" : "hidden"} md:block w-64 border-r bg-background min-h-[calc(100vh-4rem)]`}>
            <nav className="p-4 space-y-1">
              {filteredNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleContext.Provider>
  )
}

function DashboardInnerRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/dashboard") }, [])
  return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Redirigiendo...</p></div>
}
```

---

### Task 4: Page `/join` — staff signup

- [ ] **Step 1: Create `src/app/(auth)/join/page.tsx`**

```tsx
"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function JoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code") || ""
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!code) { setError("Código de invitación inválido"); setLoading(false); return }

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { invite_code: code },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push("/signin?staff_ok=true")
  }

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link href="/" className="text-xl font-bold block mb-2">CLICIO</Link>
            <CardTitle>Código requerido</CardTitle>
            <CardDescription>Necesitas un código de invitación para unirte a un taller.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-xl font-bold block mb-2">CLICIO</Link>
          <CardTitle>Unirse al taller</CardTitle>
          <CardDescription>Ingresa tus datos para acceder al sistema del taller.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="empleado@ejemplo.cl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Unirse al taller"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/signin" className="text-primary hover:underline">Acceder</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function JoinPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>}>
    <JoinForm />
  </Suspense>
}
```

---

### Task 5: Settings staff section

- [ ] **Step 1: Create `src/app/dashboard/settings/staff-section.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRole } from "@/app/dashboard/layout"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Copy, Check, Plus, Trash2 } from "lucide-react"
import type { StaffInvitation, Profile } from "@/lib/types"

export function StaffSection() {
  const supabase = createClient()
  const { toast } = useToast()
  const roleInfo = useRole()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<StaffInvitation[]>([])
  const [showCode, setShowCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => { setOrigin(window.location.origin); loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return

    const [pRes, iRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("tenant_id", profile.tenant_id).order("created_at"),
      supabase.from("staff_invitations").select("*").eq("tenant_id", profile.tenant_id).eq("used", false).order("created_at"),
    ])
    if (pRes.data) setProfiles(pRes.data)
    if (iRes.data) setInvitations(iRes.data)
  }

  async function handleGenerate() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return

    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    const { error } = await supabase.from("staff_invitations").insert({
      tenant_id: profile.tenant_id,
      code,
    })
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    setShowCode(code)
    loadData()
  }

  async function handleRemoveStaff(id: string) {
    const { error } = await supabase.from("profiles").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Miembro eliminado" })
    setDeleteTarget(null)
    loadData()
  }

  async function copyCode() {
    if (!showCode) return
    try {
      await navigator.clipboard.writeText(`${origin}/join?code=${showCode}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (!roleInfo?.isOwner) return null

  const pendingInvites = invitations.filter(i => !i.used)

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Equipo</CardTitle>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            <Plus className="h-4 w-4 mr-1" /> Generar código
          </Button>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin miembros</p>
          ) : (
            <div className="space-y-3">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{p.email}</p>
                    <Badge variant={p.role === "owner" ? "default" : "secondary"} className="mt-1">
                      {p.role === "owner" ? "Dueño" : "Staff"}
                    </Badge>
                  </div>
                  {p.role === "staff" && (
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: p.id, email: p.email })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCode && (
        <Card className="mt-4 border-primary">
          <CardHeader>
            <CardTitle className="text-primary">Código generado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Comparte este link con el empleado:</p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm break-all">{origin}/join?code={showCode}</code>
              <Button variant="ghost" size="icon" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCode(null)}>
              Cerrar
            </Button>
          </CardContent>
        </Card>
      )}

      {pendingInvites.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Invitaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Código: {inv.code}</span>
                  <span className="text-xs text-muted-foreground">Expira: {new Date(inv.expires_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Eliminar miembro"
        description={`¿Eliminar a "${deleteTarget?.email}"? Perderá acceso al taller.`}
        confirmText="Eliminar"
        onConfirm={() => { if (deleteTarget) handleRemoveStaff(deleteTarget.id) }}
      />
    </>
  )
}
```

- [ ] **Step 2: Update `src/app/dashboard/settings/page.tsx` — add `StaffSection` at bottom + redirect staff**

Add import and component at end of settings page. Page already redirects staff via layout (Task 3).

```tsx
import { StaffSection } from "./staff-section"
// ... at end of JSX before closing div
<StaffSection />
```

Since settings page is large, just append `StaffSection` after the last Card.

---

### Task 6: Page restrictions

- [ ] **Step 1: Modify `src/app/dashboard/bookings/page.tsx` — hide delete for staff**

No delete buttons exist currently in bookings page (only status changes). No change needed.

- [ ] **Step 2: Modify `src/app/dashboard/customers/page.tsx` — hide delete for staff**

Wrap delete button and edit functionality:

```tsx
import { useRole } from "@/app/dashboard/layout"

// Inside component:
const roleInfo = useRole()

// Only show delete button if owner:
{roleInfo?.isOwner && (
  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: c.id, name: c.name })}>
    <Trash2 className="h-4 w-4" />
  </Button>
)}
```

- [ ] **Step 3: Services, Loyalty pages — already handled by layout redirect** (Task 3 handles redirect for all staff-only paths)

---

### Task 7: Schema file sync + build + push

- [ ] **Step 1: Update `supabase-schema.sql`** with all new objects (staff_invitations, is_owner, updated trigger, RLS policies)

Insert after the `reward_notifications` section:
- `is_owner()` function
- `staff_invitations` table + indexes + RLS
- Updated RLS for services/customers/tenants/business_hours/blocked_dates/loyalty_rules
- Updated `handle_new_user` trigger

- [ ] **Step 2: Build verification**

```bash
npm run build
```

Expected: Compiles successfully, no TypeScript errors.

- [ ] **Step 3: Commit + push**

```bash
git add -A && git commit -m "feat: phase 2 staff management
- staff_invitations table + is_owner() function
- RLS restrict staff from delete/mutations
- handle_new_user supports invite_code for staff
- /join page for staff signup with code
- Layout filters nav by role, redirects staff
- Staff section in settings (generate code, manage members)"
git push
```
