"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
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
import { Calendar, Users, Car, Settings, LayoutDashboard, LogOut, Menu, BarChart3, ExternalLink, DollarSign, ChevronDown, Info, Clock, Image, UsersRound, Palette } from "lucide-react"
import { TrialBanner } from "@/components/dashboard/trial-banner"
import { ThemeToggle } from "@/components/ui/theme-toggle"
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
  { href: "/dashboard/calendar", label: "Calendario", icon: Calendar, ownerOnly: false },
  { href: "/dashboard/ingresos", label: "Ingresos", icon: DollarSign, ownerOnly: true },
  { href: "/dashboard/customers", label: "Clientes", icon: Users, ownerOnly: false },
  { href: "/dashboard/services", label: "Servicios", icon: Car, ownerOnly: true },
  { href: "/dashboard/reports", label: "Reportes", icon: BarChart3, ownerOnly: false },
]

const configSubItems = [
  { href: "/dashboard/settings/taller", label: "Información del Taller", icon: Info },
  { href: "/dashboard/settings/horarios", label: "Horarios y Fechas Bloqueadas", icon: Clock },
  { href: "/dashboard/settings/galeria", label: "Galería de Trabajos", icon: Image },
  { href: "/dashboard/settings/equipo", label: "Equipo", icon: UsersRound },
  { href: "/dashboard/settings/apariencia", label: "Apariencia", icon: Palette },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider><DashboardInner>{children}</DashboardInner><Toaster /></ToastProvider>
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null)
  const [tenantLogo, setTenantLogo] = useState<string | null>(null)
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(() => pathname.startsWith("/dashboard/settings"))
  const supabase = createClient()

  useEffect(() => { loadRole() }, [])
  useEffect(() => { setSettingsOpen(pathname.startsWith("/dashboard/settings")) }, [pathname])

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
        .select("logo_url, slug, status, trial_ends_at")
        .eq("id", profile.tenant_id)
        .single()
      if (tenant) {
        setTenantLogo(tenant.logo_url)
        setTenantSlug(tenant.slug)
        if (tenant.status === "paused" || tenant.status === "cancelled") {
          router.push("/dashboard/suspended")
          return
        }
        if (tenant.status === "trial" && tenant.trial_ends_at && new Date(tenant.trial_ends_at) < new Date()) {
          await fetch("/api/tenant/auto-pause", { method: "POST" })
          router.push("/dashboard/suspended")
          return
        }
      }
    }
    setLoading(false)
  }
  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/signin")
  }

  const filteredNav = navItems.filter(item => !item.ownerOnly || roleInfo?.isOwner)

  const staffRestricted = ["/dashboard/services", "/dashboard/settings", "/dashboard/appearance", ...configSubItems.map(i => i.href)]
  if (!loading && roleInfo && !roleInfo.isOwner && staffRestricted.includes(pathname)) {
    return <RedirectToDashboard />
  }

  if (loading || !roleInfo) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div className="flex gap-6">
          <div className="hidden md:block w-64 space-y-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-azul-rey/20 to-celeste-cielo/20 animate-pulse" />
            <div className="h-4 bg-bg-superficie rounded animate-pulse w-3/4" />
            <div className="h-4 bg-bg-superficie rounded animate-pulse w-1/2" />
            <div className="h-4 bg-bg-superficie rounded animate-pulse w-2/3" />
            <div className="pt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-bg-superficie rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-azul-rey/20 to-celeste-cielo/20 animate-pulse" />
              <div className="h-6 bg-bg-superficie rounded animate-pulse w-48" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-bg-superficie rounded-xl animate-pulse p-4 flex flex-col justify-between">
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-5 bg-muted rounded animate-pulse w-1/3" />
                </div>
              ))}
            </div>
            <div className="h-64 bg-bg-superficie rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <RoleContext.Provider value={roleInfo}>
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="flex h-16 items-center px-4 gap-4">
            <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg font-bold">CLICIO</span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full overflow-hidden border-2 border-border-subtil hover:border-azul-rey transition-colors">
                    {tenantLogo ? (
                      <img src={tenantLogo} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-muted text-sm font-bold text-muted-foreground">
                        {roleInfo.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{roleInfo.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {roleInfo.isOwner && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings/taller">Configuración</Link>
                      </DropdownMenuItem>
                      {tenantSlug && (
                        <DropdownMenuItem asChild>
                          <a href={`/${tenantSlug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> Ver Perfil
                          </a>
                        </DropdownMenuItem>
                      )}
                    </>
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
          {sidebarOpen && (
            <div className="fixed inset-0 top-16 z-30 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <aside className={`${sidebarOpen ? "block fixed left-0 top-16 bottom-0 z-40" : "hidden"} md:block md:relative md:top-0 w-64 border-r bg-background min-h-[calc(100vh-4rem)]`}>
            <nav className="p-4 space-y-1">
              {filteredNav.map((item) => {
                const itemPath = item.href.split("?")[0]
                const isActive = itemPath === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(itemPath)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 relative ${
                      isActive
                        ? "bg-card text-azul-rey font-medium shadow-sm before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-gradient-to-b before:from-azul-rey before:to-celeste-cielo"
                        : "text-muted-foreground hover:text-azul-rey hover:bg-card/50"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-azul-rey" : "group-hover:text-azul-rey"}`} />
                    {item.label}
                  </Link>
                )
                })}
              {roleInfo?.isOwner && (
                <div>
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-colors ${
                      settingsOpen || pathname.startsWith("/dashboard/settings")
                        ? "bg-card text-azul-rey font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      Configuración
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
                  </button>
                  {settingsOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-muted pl-2">
                      {configSubItems.map((item) => {
                        const isSubActive = pathname === item.href
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 relative ${
                              isSubActive
                                ? "bg-white text-azul-rey font-medium shadow-sm before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-gradient-to-b before:from-azul-rey before:to-celeste-cielo"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>
            {tenantSlug && roleInfo?.isOwner && (
              <div className="px-4 mt-auto mb-4">
                <a
                  href={`/${tenantSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-azul-rey transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver Perfil Público
                </a>
              </div>
            )}
          </aside>
          <main className="flex-1 p-4 md:p-6 max-w-full overflow-x-hidden"><TrialBanner />{children}</main>
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
