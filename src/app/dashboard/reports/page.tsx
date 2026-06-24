"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, TrendingUp, Clock, AlertCircle, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { DonutChart } from "@/components/ui/donut-chart"

export default function ReportsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [metrics, setMetrics] = useState<any>(null)
  const [hasHours, setHasHours] = useState(false)
  const [bResData, setBResData] = useState<any[]>([])

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  useEffect(() => { loadTenant() }, [])

  useEffect(() => { if (tenantId) loadReport() }, [month, year, tenantId])

  async function loadTenant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return
    setTenantId(profile.tenant_id)
  }

  function monthStart() {
    return `${year}-${String(month + 1).padStart(2, "0")}-01`
  }

  function monthEnd() {
    const d = new Date(year, month + 1, 0)
    return d.toISOString().slice(0, 10)
  }

  async function loadReport() {
    if (!tenantId) return
    setLoading(true)

    const start = monthStart()
    const end = monthEnd()
    const prevD = new Date(year, month - 1, 1)
    const prevStart = prevD.toISOString().slice(0, 10)
    const prevEnd = new Date(year, month, 0).toISOString().slice(0, 10)

    const [bRes, hRes, cRes, prevBRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("status, booking_date, booking_services(service_id, services(price, name)), services(price, name)")
        .eq("tenant_id", tenantId)
        .gte("booking_date", start)
        .lte("booking_date", end),
      supabase
        .from("business_hours")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_open", true),
      supabase
        .from("customers")
        .select("id, created_at")
        .eq("tenant_id", tenantId),
      supabase
        .from("bookings")
        .select("status, booking_services(service_id, services(price))")
        .eq("tenant_id", tenantId)
        .gte("booking_date", prevStart)
        .lte("booking_date", prevEnd),
    ])

    setHasHours((hRes.data?.length ?? 0) > 0)

    if (bRes.error) { toast({ title: "Error al cargar datos", variant: "destructive" }); setLoading(false); return }
    if (!bRes.data || bRes.data.length === 0) { setMetrics(null); setBResData([]); setLoading(false); return }

    setBResData(bRes.data)

    let revenue = 0
    let prevRevenue = 0
    const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {}
    let noShowCount = 0
    const totalBookings = bRes.data.length
    const today = new Date().toISOString().slice(0, 10)

    for (const b of bRes.data) {
      if (b.status === "delivered") {
        const svcs = (b as any).booking_services
        if (svcs?.length > 0) {
          for (const bs of svcs) {
            const price = bs.services?.price ?? 0
            revenue += price
            const sid = bs.service_id
            if (!serviceCount[sid]) serviceCount[sid] = { name: bs.services?.name ?? "Sin nombre", count: 0, revenue: 0 }
            serviceCount[sid].count++
            serviceCount[sid].revenue += price
          }
        } else {
          revenue += (b as any).services?.price ?? 0
          const sid = (b as any).service_id
          if (sid && !serviceCount[sid]) serviceCount[sid] = { name: (b as any).services?.name ?? "Sin nombre", count: 1, revenue: (b as any).services?.price ?? 0 }
          else if (sid) { serviceCount[sid].count++; serviceCount[sid].revenue += (b as any).services?.price ?? 0 }
        }
      }
      if (b.status === "reserved" && b.booking_date && b.booking_date < today) {
        noShowCount++
      }
    }

    const revenueByStatus: Record<string, number> = { reserved: 0, delivered: 0, cancelled: 0 }
    const countByStatus: Record<string, number> = { reserved: 0, delivered: 0, cancelled: 0 }
    for (const b of bRes.data) {
      const st = b.status as string
      if (!revenueByStatus[st]) revenueByStatus[st] = 0
      if (!countByStatus[st]) countByStatus[st] = 0
      if (st === "delivered") {
        const svcs = (b as any).booking_services
        if (svcs?.length > 0) {
          revenueByStatus[st] += svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
        } else {
          revenueByStatus[st] += (b as any).services?.price ?? 0
        }
      }
      countByStatus[st]++
    }

    const dailyRevenueMap: Record<string, { delivered: number; total: number }> = {}
    for (const b of bRes.data) {
      const day = b.booking_date?.slice(0, 10)
      if (!day) continue
      if (!dailyRevenueMap[day]) dailyRevenueMap[day] = { delivered: 0, total: 0 }
      let total = 0
      const svcs = (b as any).booking_services
      if (svcs?.length > 0) {
        total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
      } else {
        total = (b as any).services?.price ?? 0
      }
      dailyRevenueMap[day].total += total
      if (b.status === "delivered") dailyRevenueMap[day].delivered += total
    }
    const dailyRevenue = Object.entries(dailyRevenueMap).sort(([a], [b]) => a.localeCompare(b))

    if (prevBRes.data) {
      for (const b of prevBRes.data) {
        if (b.status === "delivered") {
          const svcs = (b as any).booking_services
          if (svcs?.length > 0) {
            for (const bs of svcs) prevRevenue += bs.services?.price ?? 0
          } else {
            prevRevenue += (b as any).services?.price ?? 0
          }
        }
      }
    }

    const topServices = Object.entries(serviceCount)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const newCustomerIds = new Set<string>()
    const monthStartDate = start

    if (cRes.data) {
      for (const c of cRes.data) {
        if (c.created_at && c.created_at.slice(0, 10) >= monthStartDate) {
          newCustomerIds.add(c.id)
        }
      }
    }

    let returningCount = 0
    const seenReturning = new Set<string>()
    for (const b of bRes.data) {
      const cid = (b as any).customer_id
      if (cid && !newCustomerIds.has(cid) && !seenReturning.has(cid)) {
        seenReturning.add(cid)
        returningCount++
      }
    }

    let occupancy: number | null = null
    if (hasHours && hRes.data) {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      let totalMinutes = 0
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d)
        const dow = date.getDay()
        const hours = hRes.data.find((h: any) => h.day_of_week === dow)
        if (hours?.is_open) {
          const open = parseInt(hours.open_time.slice(0, 2))
          const close = parseInt(hours.close_time.slice(0, 2))
          totalMinutes += (close - open) * 60
        }
      }
      let bookedMinutes = 0
      for (const b of bRes.data) {
        if (b.status === "cancelled") continue
        const svcs = (b as any).booking_services
        if (svcs?.length > 0) {
          bookedMinutes += svcs.reduce((sum: number, bs: any) => sum + (bs.services?.duration ?? 60), 0)
        } else {
          bookedMinutes += (b as any).services?.duration ?? 60
        }
      }
      occupancy = totalMinutes > 0 ? Math.round((bookedMinutes / totalMinutes) * 100) : 0
    }

    setMetrics({
      revenue,
      prevRevenue,
      revenueChange: prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null,
      topServices,
      newCustomers: newCustomerIds.size,
      returningCustomers: returningCount,
      occupancy,
      noShowRate: totalBookings > 0 ? Math.round((noShowCount / totalBookings) * 100) : 0,
      noShowCount,
      totalBookings,
      revenueByStatus,
      countByStatus,
      dailyRevenue,
    })
    setLoading(false)
  }

  function exportCSV() {
    if (!metrics) return
    const rows: string[][] = [
      ["Métrica", "Valor"],
      ["Mes", `${monthNames[month]} ${year}`],
      ["Ingresos", String(metrics.revenue)],
      ["Variación %", metrics.revenueChange !== null ? `${metrics.revenueChange}%` : "N/A"],
      ["Ocupación %", metrics.occupancy !== null ? `${metrics.occupancy}%` : "N/A"],
      ["No-show rate", `${metrics.noShowRate}%`],
      ["No-show count", String(metrics.noShowCount)],
      ["Total reservas", String(metrics.totalBookings)],
      ["Clientes nuevos", String(metrics.newCustomers)],
      ["Clientes recurrentes", String(metrics.returningCustomers)],
      [],
      ["Servicio", "Cantidad", "Ingreso"],
      ...metrics.topServices.map((s: any) => [s.name, String(s.count), String(s.revenue)]),
      [],
      ["Fecha", "Hora", "Cliente", "Vehículo", "Servicios", "Total", "Estado"],
    ]

    for (const b of bResData) {
      const svcs = b.booking_services
      const svcNames = svcs?.length > 0 ? svcs.map((bs: any) => bs.services?.name).filter(Boolean).join(", ") : ""
      let total = 0
      if (svcs?.length > 0) {
        total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
      }
      rows.push([
        b.booking_date ?? "",
        b.booking_time?.slice(0, 5) ?? "",
        b.customers?.name ?? "",
        b.vehicles?.plate ?? "",
        svcNames,
        String(total),
        b.status ?? "",
      ])
    }

    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-${monthNames[month].toLowerCase()}-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
        <div className="rounded-xl border p-6 mt-6 space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    )
  }

  const years = [year - 1, year, year + 1]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reportes">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!metrics}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthNames.map((name, i) => (
                <SelectItem key={i} value={String(i)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{String(y)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {metrics ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$ {metrics.revenue.toLocaleString("es-CL")}</p>
                {metrics.revenueChange !== null && (
                  <p className={`text-sm mt-1 ${metrics.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {metrics.revenueChange >= 0 ? "\u2191" : "\u2193"} {Math.abs(metrics.revenueChange)}% vs mes anterior
                  </p>
                )}
                {metrics.revenueChange === null && metrics.prevRevenue === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Sin datos del mes anterior</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ocupación</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {metrics.occupancy !== null ? (
                  <>
                    <p className="text-3xl font-bold">{metrics.occupancy}%</p>
                    <p className="text-xs text-muted-foreground mt-1">slots ocupados del mes</p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${metrics.occupancy}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-muted-foreground">No disponible</p>
                    <p className="text-xs text-muted-foreground mt-1">Configura horarios en Ajustes para ver ocupación.</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos por estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["reserved", "delivered", "cancelled"] as const).map((s) => {
                const labels: Record<string, string> = { reserved: "Reservado", delivered: "Entregado", cancelled: "Cancelado" }
                const barColors: Record<string, string> = { reserved: "hsl(var(--primary))", delivered: "hsl(142 76% 36%)", cancelled: "hsl(0 72% 51%)" }
                const rev = metrics.revenueByStatus[s] ?? 0
                const cnt = metrics.countByStatus[s] ?? 0
                const maxRev = Math.max(...(["reserved", "delivered", "cancelled"] as const).map((st) => metrics.revenueByStatus[st] ?? 0), 1)
                return (
                  <div key={s}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{labels[s]}</span>
                      <span className="text-muted-foreground">${rev.toLocaleString("es-CL")} — {cnt} {cnt === 1 ? "reserva" : "reservas"}</span>
                    </div>
                    <div className="h-5 bg-muted rounded-sm overflow-hidden">
                      <div className="h-full rounded-sm transition-all" style={{ width: `${(rev / maxRev) * 100}%`, backgroundColor: barColors[s] }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos diarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-[2px] h-40 overflow-x-auto">
                {metrics.dailyRevenue.map(([day, data]: [string, any]) => {
                  const dayNum = parseInt(day.slice(8, 10))
                  const maxVal = Math.max(...metrics.dailyRevenue.map(([, d]: [string, any]) => d.delivered), 1)
                  const h = (data.delivered / maxVal) * 100
                  return (
                    <div key={day} className="flex flex-col items-center gap-1 min-w-[24px]">
                      <div className="flex-1 w-full flex flex-col justify-end">
                        <div
                          className="w-full bg-primary rounded-t-sm transition-all"
                          style={{ height: `${Math.max(h, 1)}%` }}
                          title={`${dayNum}: $${data.delivered.toLocaleString("es-CL")}`}
                        />
                      </div>
                      {metrics.dailyRevenue.length <= 31 && (
                        <span className="text-[10px] text-muted-foreground">{dayNum}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Servicios más vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topServices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin servicios realizados este mes</p>
              ) : (
                <div className="space-y-3">
                  {metrics.topServices.map((s: any, i: number) => {
                    const maxCount = metrics.topServices[0].count
                    const barPct = maxCount > 0 ? (s.count / maxCount) * 100 : 0
                    return (
                      <div key={s.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-muted-foreground">{s.count}x — ${s.revenue.toLocaleString("es-CL")}</span>
                        </div>
                        <div className="h-5 bg-muted rounded-sm overflow-hidden">
                          <div className="h-full bg-primary rounded-sm transition-all" style={{ width: `${barPct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  {metrics.newCustomers + metrics.returningCustomers > 0 ? (
                    <DonutChart
                      value={metrics.newCustomers}
                      max={metrics.newCustomers + metrics.returningCustomers}
                      colors={undefined}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                      Sin datos
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-blue-500" />
                      <span className="text-sm">Nuevos: <strong>{metrics.newCustomers}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-orange-500" />
                      <span className="text-sm">Recurrentes: <strong>{metrics.returningCustomers}</strong></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">No-show rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.noShowRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">{metrics.noShowCount} de {metrics.totalBookings} reservas</p>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${metrics.noShowRate}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No hay datos para {monthNames[month]} {year}</p>
          <p className="text-sm text-muted-foreground mt-1">Selecciona otro mes o espera a tener reservas.</p>
        </div>
      )}
    </div>
  )
}
