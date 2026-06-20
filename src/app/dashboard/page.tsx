"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Car, Gift, DollarSign, Clock, CheckCircle2, Wrench } from "lucide-react"

const statusLabels: Record<string, string> = {
  reserved: "Reservado",
  waiting: "Esperando",
  in_progress: "En progreso",
  ready: "Listo",
  delivered: "Entregado",
}

const statusColors: Record<string, string> = {
  reserved: "bg-blue-100 text-blue-800",
  waiting: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-800",
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({})
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [monthBookings, setMonthBookings] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
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
      .select("status, services(price)")
      .eq("tenant_id", tid)
      .gte("created_at", monthStart)

    let revenue = 0
    let total = 0
    monthData?.forEach((b) => {
      total++
      if (b.status === "delivered") {
        revenue += (b.services as any)?.price ?? 0
      }
    })
    setMonthRevenue(revenue)
    setMonthBookings(total)

    // Total customers
    const { count: custCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tid)
    setTotalCustomers(custCount ?? 0)

    // Recent bookings (last 5)
    const { data: recent } = await supabase
      .from("bookings")
      .select("*, customers(name, plate), services(name)")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false })
      .limit(5)
    setRecentBookings(recent ?? [])
    setLoading(false)
  }

  if (loading) return <div className="min-h-[200px] flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>

  const statusCards = [
    { status: "reserved", icon: Clock, color: "text-blue-600" },
    { status: "in_progress", icon: Wrench, color: "text-orange-600" },
    { status: "ready", icon: CheckCircle2, color: "text-green-600" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

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
      </div>

      {/* Today's status breakdown */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {statusCards.map(({ status, icon: Icon, color }) => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{statusLabels[status]}</CardTitle>
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
          <CardTitle>Últimas reservas</CardTitle>
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
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{b.customers?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.customers?.plate} — {b.services?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{b.booking_date} {b.booking_time?.slice(0, 5)}</p>
                    <Badge className={statusColors[b.status]}>{statusLabels[b.status]}</Badge>
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
