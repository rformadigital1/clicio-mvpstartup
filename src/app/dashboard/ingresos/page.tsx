"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { DollarSign, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { BookingStatus } from "@/lib/types"
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from "@/lib/booking-constants"

export default function IngresosPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [bookings, setBookings] = useState<any[]>([])

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  useEffect(() => { loadTenant() }, [])

  useEffect(() => { if (tenantId) loadBookings() }, [month, year, tenantId])

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

  async function loadBookings() {
    if (!tenantId) return
    setLoading(true)
    const { data, error } = await supabase
      .from("bookings")
      .select("*, customers(*), vehicles(*), booking_services(service_id, services(*))")
      .eq("tenant_id", tenantId)
      .gte("booking_date", monthStart())
      .lte("booking_date", monthEnd())
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false })
    if (error) { toast({ title: "Error al cargar datos", variant: "destructive" }); setLoading(false); return }
    setBookings(data ?? [])
    setLoading(false)
  }

  async function markPaid(bookingId: string) {
    const { error } = await supabase.from("bookings").update({ status: "delivered" }).eq("id", bookingId)
    if (error) { toast({ title: "Error al actualizar", variant: "destructive" }); return }
    toast({ title: "Marcado como pagado" })
    loadBookings()
  }

  const totals = bookings.reduce(
    (acc, b) => {
      let total = 0
      const svcs = b.booking_services
      if (svcs?.length > 0) {
        total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
      }
      acc.total += total
      if (b.status === "delivered") acc.paid += total
      else if (b.status === "cancelled") acc.cancelled += total
      else acc.pending += total
      return acc
    },
    { total: 0, paid: 0, pending: 0, cancelled: 0 }
  )

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter)

  const years = [year - 1, year, year + 1]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Ingresos">
        <div className="flex items-center gap-2 flex-wrap">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <p className="text-xl font-bold mt-1">${totals.total.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Cobrado</p>
            <p className="text-xl font-bold mt-1 text-green-700">${totals.paid.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Pendiente</p>
            <p className="text-xl font-bold mt-1 text-amber-600">${totals.pending.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Cancelado</p>
            <p className="text-xl font-bold mt-1 text-red-600">${totals.cancelled.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { value: "all", label: "Todos" },
          { value: "delivered", label: "Pagados" },
          { value: "reserved", label: "Pendientes" },
          { value: "cancelled", label: "Anulados" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-azul-rey text-white"
                : "bg-bg-superficie text-muted-foreground hover:bg-border-subtil"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">Sin movimientos</p>
          <p className="text-sm text-muted-foreground mt-1">No hay ingresos registrados este mes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b: any) => {
            const svcs = b.booking_services
            const svcNames = svcs?.length > 0 ? svcs.map((bs: any) => bs.services?.name).filter(Boolean).join(", ") : ""
            let total = 0
            if (svcs?.length > 0) {
              total = svcs.reduce((sum: number, bs: any) => sum + (bs.services?.price ?? 0), 0)
            }
            return (
              <div key={b.id} className="bg-card border border-border-subtil rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="sm:w-28 shrink-0">
                  <p className="text-sm font-medium">{b.booking_date?.slice(0, 10)}</p>
                  <p className="text-xs text-muted-foreground">{b.booking_time?.slice(0, 5)} hrs</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{b.customers?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.vehicles?.plate}{b.vehicles?.brand ? ` — ${b.vehicles.brand}` : ""}</p>
                  <p className="text-xs text-muted-foreground truncate">{svcNames}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className={STATUS_BADGE_CLASSES[b.status as BookingStatus]}>
                    {STATUS_LABELS[b.status as BookingStatus]}
                  </Badge>
                  <span className="text-sm font-bold whitespace-nowrap">${total.toLocaleString("es-CL")}</span>
                  {b.status === "reserved" && (
                    <Button size="sm" variant="outline" onClick={() => markPaid(b.id)} className="text-xs h-8">
                      <CheckCircle className="h-3 w-3 mr-1" /> Pagar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
