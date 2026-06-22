"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, Clock, CheckCircle2, Wrench, CalendarDays, TrendingUp, TrendingDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { BookingStatus } from "@/lib/types"
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from "@/lib/booking-constants"

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({})
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [prevMonthRevenue, setPrevMonthRevenue] = useState(0)
  const [monthBookings, setMonthBookings] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [tenantName, setTenantName] = useState("")
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single()
    if (!profile) return

    setTenantId(profile.tenant_id)
    const tid = profile.tenant_id

    // Fetch tenant name for greeting
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", profile.tenant_id)
      .single()
    if (tenantData) setTenantName(tenantData.name)

    // Redirect owner to onboarding if no services configured
    if (profile.role === "owner") {
      const { count: svcCount } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tid)

      if (svcCount === 0) {
        router.replace("/onboarding")
        return
      }
    }
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Today's bookings by status
    const { data: todayData } = await supabase
      .from("bookings")
      .select("status")
      .eq("tenant_id", tid)
      .eq("booking_date", today)

    const counts: Record<string, number> = {}
    todayData?.forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1 })
    setTodayCounts(counts)

    // Monthly delivered bookings + revenue
    const { data: monthData } = await supabase
      .from("bookings")
      .select("status, services(price), booking_services(services(price))")
      .eq("tenant_id", tid)
      .gte("created_at", monthStart)

    let revenue = 0
    let total = 0
    monthData?.forEach((b: any) => {
      total++
      if (b.status === "delivered") {
        if (b.booking_services?.length > 0) {
          revenue += b.booking_services.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
        } else {
          revenue += b.services?.price ?? 0
        }
      }
    })
    setMonthRevenue(revenue)
    setMonthBookings(total)

    // Previous month revenue
    const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevStart = prevD.toISOString()
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
    const { data: prevData } = await supabase
      .from("bookings")
      .select("status, booking_services(service_id, services(price)), services(price)")
      .eq("tenant_id", tid)
      .eq("status", "delivered")
      .gte("created_at", prevStart)
      .lte("created_at", prevEnd)

    let prevRev = 0
    prevData?.forEach((b: any) => {
      if (b.booking_services?.length > 0) {
        prevRev += b.booking_services.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
      } else {
        prevRev += b.services?.price ?? 0
      }
    })
    setPrevMonthRevenue(prevRev)

    // Total customers
    const { count: custCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tid)
    setTotalCustomers(custCount ?? 0)

    // Recent bookings (next 5 upcoming)
    const { data: recent } = await supabase
      .from("bookings")
      .select("*, customers(name, plate), services(name), vehicles(plate, brand), booking_services(services(name))")
      .eq("tenant_id", tid)
      .gte("booking_date", today)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })
      .limit(5)
    setRecentBookings(recent ?? [])
    setLoading(false)
  }

  if (loading) return (
    <div>
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )

  const revenueDelta = prevMonthRevenue > 0 ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : null

  const statusCards = [
    { status: "reserved", icon: Clock, color: "text-blue-600" },
    { status: "in_progress", icon: Wrench, color: "text-orange-600" },
    { status: "ready", icon: CheckCircle2, color: "text-green-600" },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)] italic font-bold text-foreground">
          Hola, {tenantName.toLowerCase()}
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} — Resumen del día
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reservas este mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{monthBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$ {monthRevenue.toLocaleString("es-CL")}</p>
            {revenueDelta !== null && (
              <p className={`text-sm mt-1 flex items-center gap-1 ${revenueDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {revenueDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(revenueDelta)}% vs mes anterior
              </p>
            )}
            {revenueDelta === null && prevMonthRevenue === 0 && monthRevenue > 0 && (
              <p className="text-xs text-muted-foreground mt-1">Sin datos del mes anterior</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Object.values(todayCounts).reduce((a: number, b: number) => a + b, 0)}
            </p>
            <p className="text-xs text-muted-foreground">reservas para hoy</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/dashboard/calendar" className="block h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calendario</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Ver semana</p>
              <p className="text-xs text-muted-foreground">Vista calendario</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Today's status breakdown */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {statusCards.map(({ status, icon: Icon, color }) => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{STATUS_LABELS[status as BookingStatus]}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{todayCounts[status] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No hay reservas aún</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentBookings.map((b: any) => (
                <div key={b.id} className="flex items-start sm:items-center justify-between gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{b.customers?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {b.vehicles && `${b.vehicles.plate}${b.vehicles.brand ? ` - ${b.vehicles.brand}` : ""}${b.booking_services?.length ? " — " : ""}`}
                      {b.booking_services?.length > 0
                        ? b.booking_services.map((bs: any) => bs.services?.name).filter(Boolean).join(", ")
                        : b.services?.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm whitespace-nowrap">{b.booking_date} {b.booking_time?.slice(0, 5)}</p>
                    <Badge className={STATUS_BADGE_CLASSES[b.status as BookingStatus]}>{STATUS_LABELS[b.status as BookingStatus]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
