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
  const [tenantLogo, setTenantLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => { loadRole() }, [])

  async function loadRole() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/signin"); return }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email, tenant_id")
      .eq("id", user.id)
      .single()

    if (profile) {
      setRoleInfo({ isOwner: profile.role === "owner", role: profile.role, email: profile.email })
      const { data: tenant } = await supabase
        .from("tenants")
        .select("logo_url")
        .eq("id", profile.tenant_id)
        .single()
      if (tenant) setTenantLogo(tenant.logo_url)
    }
    setLoading(false)
  }
  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/signin")
  }

  const filteredNav = navItems.filter(item => !item.ownerOnly || roleInfo?.isOwner)

  const staffRestricted = ["/dashboard/services", "/dashboard/loyalty", "/dashboard/settings"]
  if (!loading && roleInfo && !roleInfo.isOwner && staffRestricted.includes(pathname)) {
    return <RedirectToDashboard />
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
            <Link href="/dashboard" className="flex items-center gap-2">
              {tenantLogo ? (
                <img src={tenantLogo} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain" />
              ) : (
                <span className="text-lg font-bold">CLICIO</span>
              )}
            </Link>
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
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </RoleContext.Provider>
  )
}

function RedirectToDashboard() {
  const router = useRouter()
  useEffect(() => { router.replace("/dashboard") }, [])
  return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Redirigiendo...</p></div>
}
