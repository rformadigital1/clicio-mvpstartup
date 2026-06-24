"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Clock, Wrench, CheckCircle2, Calendar, DollarSign, TrendingUp, TrendingDown, User } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { BookingStatus } from "@/lib/types"
import { STATUS_LABELS, STATUS_BADGE_CLASSES, STATUS_TEXT_COLORS } from "@/lib/booking-constants"
import BookingActions from "@/components/booking/booking-actions"
import CustomerHistoryModal from "@/components/booking/customer-history-modal"

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState("")
  const [todayBookings, setTodayBookings] = useState<any[]>([])
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({})
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [prevMonthRevenue, setPrevMonthRevenue] = useState(0)
  const [monthBookings, setMonthBookings] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todayPaid, setTodayPaid] = useState(0)
  const [historyCustomerId, setHistoryCustomerId] = useState<string | null>(null)
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

    const { data: tenantData } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", tid)
      .single()
    if (tenantData) setTenantName(tenantData.name)

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

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, customers(*), vehicles(*), booking_services(service_id, services(*))")
      .eq("tenant_id", tid)
      .eq("booking_date", today)
      .order("booking_time")

    const counts: Record<string, number> = {}
    bookings?.forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1 })
    setTodayCounts(counts)
    setTodayBookings(bookings ?? [])

    let todayRevenue = 0
    let todayPaid = 0
    bookings?.forEach((b: any) => {
      const svcs = b.booking_services
      let total = 0
      if (svcs?.length > 0) {
        total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
      } else {
        total = b.services?.price ?? 0
      }
      todayRevenue += total
      if (b.status === "delivered") todayPaid += total
    })
    setTodayRevenue(todayRevenue)
    setTodayPaid(todayPaid)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { data: monthData } = await supabase
      .from("bookings")
      .select("status, booking_services(service_id, services(price)), services(price)")
      .eq("tenant_id", tid)
      .gte("booking_date", monthStart)

    let revenue = 0
    monthData?.forEach((b: any) => {
      if (b.status === "delivered") {
        if (b.booking_services?.length > 0) {
          revenue += b.booking_services.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
        } else {
          revenue += b.services?.price ?? 0
        }
      }
    })
    setMonthRevenue(revenue)
    setMonthBookings(monthData?.length ?? 0)

    // Previous month revenue
    const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const { data: prevData } = await supabase
      .from("bookings")
      .select("booking_services(service_id, services(price)), services(price)")
      .eq("tenant_id", tid)
      .eq("status", "delivered")
        .gte("booking_date", prevD.toISOString().slice(0, 10))
        .lte("booking_date", new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10))

    let prevRev = 0
    prevData?.forEach((b: any) => {
      if (b.booking_services?.length > 0) {
        prevRev += b.booking_services.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
      } else {
        prevRev += b.services?.price ?? 0
      }
    })
    setPrevMonthRevenue(prevRev)

    const { count: custCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tid)
    setTotalCustomers(custCount ?? 0)

    setLoading(false)
  }

  const timelineSlots = useMemo(() => {
    if (todayBookings.length === 0) return []

    const sorted = [...todayBookings].sort((a, b) => (a.booking_time ?? "08:00").localeCompare(b.booking_time ?? "08:00"))
    const slots: Array<{ type: "booking"; data: any } | { type: "empty"; time: string }> = []
    let prevEndMinutes = -1

    for (const b of sorted) {
      const [h, m] = (b.booking_time ?? "08:00").split(":").map(Number)
      const startMin = h * 60 + m

      if (prevEndMinutes >= 0 && startMin - prevEndMinutes >= 30) {
        const gapH = Math.floor(prevEndMinutes / 60)
        const gapM = prevEndMinutes % 60
        slots.push({ type: "empty" as const, time: `${gapH.toString().padStart(2, "0")}:${gapM.toString().padStart(2, "0")}` })
      }

      slots.push({ type: "booking" as const, data: b })
      const dur = b.booking_services?.reduce((s: number, bs: any) => s + (bs.services?.duration ?? 0), 0) ?? 60
      prevEndMinutes = startMin + Math.max(dur, 30)
    }

    return slots
  }, [todayBookings])

  if (loading) return (
    <div>
      <Skeleton className="h-8 w-56 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />
      <div className="flex gap-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 flex-1 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-6 w-40 mb-4" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full mb-3 rounded-lg" />
      ))}
    </div>
  )

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)] italic font-bold text-foreground">
          Hola, {tenantName.toLowerCase()}
        </h1>
        <p className="text-muted-foreground mt-1">
          {now.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} — Resumen del día
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-bg-superficie border border-border-subtil rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Reservas hoy</p>
          <p className="text-2xl font-bold text-azul-rey">{Object.values(todayCounts).reduce((a, b) => a + b, 0)}</p>
        </div>
        <div className="bg-bg-superficie border border-border-subtil rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">En progreso</p>
          <p className="text-2xl font-bold text-rojo">{todayCounts["in_progress"] || 0}</p>
        </div>
        <div className="bg-bg-superficie border border-border-subtil rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Listos</p>
          <p className="text-2xl font-bold text-green-700">{todayCounts["ready"] || 0}</p>
        </div>
        <div className="bg-bg-superficie border border-border-subtil rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Ingresos hoy</p>
          <p className="text-2xl font-bold text-green-700">${todayRevenue.toLocaleString("es-CL")}</p>
          <p className="text-xs mt-1">
            <span className="text-green-700">✓ ${todayPaid.toLocaleString("es-CL")} cobrado</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-amber-600">⏳ ${(todayRevenue - todayPaid).toLocaleString("es-CL")} pendiente</span>
          </p>
          <a href="/dashboard/reports" className="text-xs text-azul-rey hover:underline mt-1 inline-block">Ver reporte →</a>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-azul-rey" />
        Timeline del día
      </h2>

      {timelineSlots.length === 0 && todayBookings.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border-medio rounded-lg">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Sin reservas para hoy</p>
        </div>
      )}

      <div className="relative space-y-0">
        {timelineSlots.length === 0 && todayBookings.length > 0 && (
          <p className="text-sm text-muted-foreground">Procesando horarios...</p>
        )}
        {timelineSlots.map((slot, i) =>
          slot.type === "empty" ? (
            <div key={`empty-${i}`} className="flex items-start gap-4 py-3 opacity-50">
              <div className="w-14 text-right shrink-0">
                <span className="text-xs font-medium text-muted-foreground">{slot.time}</span>
              </div>
              <div className="flex-1 border border-dashed border-border-medio rounded-lg py-3 px-4">
                <p className="text-xs text-muted-foreground">Disponible</p>
              </div>
            </div>
          ) : (
            <TimelineCard key={slot.data.id} booking={slot.data} currentMinutes={currentMinutes} onViewHistory={() => setHistoryCustomerId(slot.data.customer_id)} onStatusChange={() => loadData()} />
          )
        )}
      </div>

      {/* Monthly metrics */}
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-bg-superficie border border-border-subtil rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Reservas del mes</p>
          <p className="text-xl font-bold">{monthBookings}</p>
        </div>
        <div className="bg-bg-superficie border border-border-subtil rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Ingresos del mes</p>
          <p className="text-xl font-bold">${monthRevenue.toLocaleString("es-CL")}</p>
          {(() => {
            const delta = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : null
            if (delta === null) return null
            return (
              <p className={`text-xs mt-0.5 flex items-center gap-0.5 ${delta >= 0 ? "text-green-700" : "text-rojo"}`}>
                {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(Math.round(delta))}% vs mes ant.
              </p>
            )
          })()}
        </div>
        <div className="bg-bg-superficie border border-border-subtil rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Clientes</p>
          <p className="text-xl font-bold">{totalCustomers}</p>
        </div>
        <div className="bg-bg-superficie border border-border-subtil rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Ticket promedio</p>
          <p className="text-xl font-bold">${monthBookings > 0 ? Math.round(monthRevenue / monthBookings).toLocaleString("es-CL") : "0"}</p>
        </div>
      </div>

      <CustomerHistoryModal customerId={historyCustomerId ?? ""} open={!!historyCustomerId} onClose={() => setHistoryCustomerId(null)} />
    </div>
  )
}

function TimelineCard({ booking, currentMinutes, onViewHistory, onStatusChange }: { booking: any; currentMinutes: number; onViewHistory: () => void; onStatusChange: () => void }) {
  const status = booking.status as BookingStatus
  const [h, m] = (booking.booking_time ?? "08:00").split(":").map(Number)
  const startMinutes = h * 60 + m
  const isPast = startMinutes < currentMinutes
  const isNow = startMinutes <= currentMinutes && currentMinutes < startMinutes + 60

  const servicesList = booking.booking_services?.map((bs: any) => bs.services?.name).filter(Boolean) ?? []

  return (
    <div className={`flex items-start gap-4 py-2 ${isPast ? "opacity-60" : ""} ${isNow ? "opacity-100" : ""}`}>
      <div className="w-14 text-right shrink-0 pt-2">
        <span className={`text-xs font-medium ${isNow ? "text-azul-rey" : "text-muted-foreground"}`}>
          {booking.booking_time?.slice(0, 5)}
        </span>
        {isNow && <div className="h-1.5 w-1.5 rounded-full bg-azul-rey mx-auto mt-1" />}
      </div>
      <div
        className="flex-1 bg-white border border-border-subtil rounded-lg p-3 transition-colors hover:border-border-medio"
        style={{ borderLeft: `3px solid ${STATUS_TEXT_COLORS[status] ?? "#374151"}` }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <button onClick={onViewHistory} className="font-semibold text-sm hover:text-azul-rey transition-colors text-left">
            {booking.customers?.name}
          </button>
          <Badge className={STATUS_BADGE_CLASSES[status]}>{STATUS_LABELS[status]}</Badge>
        </div>
        {booking.vehicles && (
          <p className="text-xs text-muted-foreground mb-1">
            {booking.vehicles.plate}{booking.vehicles.brand ? ` — ${booking.vehicles.brand}` : ""}
          </p>
        )}
        {servicesList.length > 0 && (
          <p className="text-xs text-muted-foreground mb-1">{servicesList.join(", ")}</p>
        )}
        {booking.customers?.phone && (
          <p className="text-xs text-muted-foreground mb-1">{booking.customers.phone}</p>
        )}
        <div className="mt-2">
          <BookingActions bookingId={booking.id} currentStatus={status} onStatusChange={onStatusChange} />
        </div>
      </div>
    </div>
  )
}
