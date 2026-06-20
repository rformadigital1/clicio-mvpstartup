"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { checkAvailability } from "@/lib/availability"
import { ChevronLeft, ChevronRight, Plus, Clock, User, Car } from "lucide-react"
import type { Booking, BookingStatus, Customer, Service, Vehicle } from "@/lib/types"

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const STATUS_COLORS: Record<BookingStatus, string> = {
  reserved: "#dbeafe",
  waiting: "#fef3c7",
  in_progress: "#fed7aa",
  ready: "#bbf7d0",
  delivered: "#e5e7eb",
}
const STATUS_TEXT_COLORS: Record<BookingStatus, string> = {
  reserved: "#1e40af",
  waiting: "#92400e",
  in_progress: "#9a3412",
  ready: "#166534",
  delivered: "#374151",
}
const STATUS_LABELS: Record<BookingStatus, string> = {
  reserved: "Reservado",
  waiting: "Esperando",
  in_progress: "En progreso",
  ready: "Listo",
  delivered: "Entregado",
}
const HOUR_HEIGHT = 56
const START_HOUR = 8
const END_HOUR = 20

function getWeekStart(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
}

export default function CalendarPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [bookings, setBookings] = useState<any[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  // New booking modal
  const [newOpen, setNewOpen] = useState(false)
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [newCustId, setNewCustId] = useState("")
  const [newVehId, setNewVehId] = useState("__none__")
  const [newServiceIds, setNewServiceIds] = useState<string[]>([])

  // Detail modal
  const [detailBooking, setDetailBooking] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadWeek() }, [weekStart, tenantId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return
    setTenantId(profile.tenant_id)

    const [sRes, cRes, vRes] = await Promise.all([
      supabase.from("services").select("*").eq("tenant_id", profile.tenant_id).order("name"),
      supabase.from("customers").select("*").eq("tenant_id", profile.tenant_id).order("name"),
      supabase.from("vehicles").select("*, customers(*)").eq("tenant_id", profile.tenant_id).order("plate"),
    ])
    if (sRes.error) toast({ title: "Error", description: sRes.error.message, variant: "destructive" })
    if (cRes.error) toast({ title: "Error", description: cRes.error.message, variant: "destructive" })
    if (vRes.error) toast({ title: "Error", description: vRes.error.message, variant: "destructive" })
    setServices(sRes.data ?? [])
    setCustomers(cRes.data ?? [])
    setVehicles(vRes.data ?? [])
  }

  async function loadWeek() {
    if (!tenantId) return
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const { data } = await supabase
      .from("bookings")
      .select("*, customers(*), vehicles(*), booking_services(service_id, services(*))")
      .eq("tenant_id", tenantId)
      .gte("booking_date", fmtDate(weekStart))
      .lte("booking_date", fmtDate(weekEnd))
      .order("booking_time")

    setBookings(data ?? [])
  }

  function totalDuration(booking: any): number {
    if (booking.booking_services?.length > 0) {
      return booking.booking_services.reduce((sum: number, bs: any) => sum + (bs.services?.duration ?? 0), 0)
    }
    return booking.services?.duration ?? 60
  }

  function getTopAndHeight(booking: any): { top: number; height: number } {
    const [h, m] = (booking.booking_time ?? "08:00").split(":").map(Number)
    const startMinutes = h * 60 + m
    const totalMinutes = (END_HOUR - START_HOUR) * 60
    const dur = Math.max(totalDuration(booking), 30)
    const top = ((startMinutes - START_HOUR * 60) / totalMinutes) * 100
    const height = Math.min((dur / totalMinutes) * 100, 100 - top)
    return { top, height }
  }

  function getGridInfo(booking: any): { col: number; topPx: number; heightPx: number } {
    const dateStr = booking.booking_date
    const dayIndex = days.findIndex(d => fmtDate(d) === dateStr)
    if (dayIndex < 0) return { col: 1, topPx: 0, heightPx: HOUR_HEIGHT }

    const [h, m] = (booking.booking_time ?? "08:00").split(":").map(Number)
    const startMinutes = h * 60 + m
    const dur = Math.max(totalDuration(booking), 30)
    const topPx = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
    const heightPx = (dur / 60) * HOUR_HEIGHT

    return { col: dayIndex + 1, topPx, heightPx }
  }

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  const hours = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  }, [])

  const todayStr = fmtDate(new Date())

  // Group bookings by day for quick lookup
  const bookingsByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const b of bookings) {
      const d = b.booking_date
      if (!map[d]) map[d] = []
      map[d].push(b)
    }
    return map
  }, [bookings])

  function navPrev() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  function navNext() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  function navToday() {
    setWeekStart(getWeekStart(new Date()))
  }

  function handleSlotClick(date: string, time: string) {
    setNewDate(date)
    setNewTime(time)
    setNewCustId("")
    setNewVehId("__none__")
    setNewServiceIds([])
    setNewOpen(true)
  }

  async function handleNewBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId) return
    if (newServiceIds.length === 0) { toast({ title: "Selecciona al menos un servicio", variant: "destructive" }); return }

    const check = await checkAvailability(tenantId, newDate, newTime, newServiceIds)
    if (!check.available) { toast({ title: "Horario no disponible", description: check.reason, variant: "destructive" }); return }

    const { data: booking, error } = await supabase.from("bookings").insert({
      tenant_id: tenantId,
      customer_id: newCustId,
      vehicle_id: newVehId && newVehId !== "__none__" ? newVehId : null,
      booking_date: newDate,
      booking_time: newTime,
      status: "reserved",
    }).select().single()

    if (error || !booking) { toast({ title: "Error al crear reserva", description: error?.message, variant: "destructive" }); return }

    const { error: bsErr } = await supabase.from("booking_services").insert(
      newServiceIds.map(sid => ({ booking_id: booking.id, service_id: sid }))
    )
    if (bsErr) { toast({ title: "Error al guardar servicios", description: bsErr.message, variant: "destructive" }); return }

    toast({ title: "Reserva creada" })
    setNewOpen(false)
    loadWeek()
  }

  async function handleStatusChange(bookingId: string, status: BookingStatus) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Estado actualizado" })
    setDetailOpen(false)
    loadWeek()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Calendario</h1>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={navPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={navToday}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={navNext}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {days[0].toLocaleDateString("es-CL", { day: "numeric", month: "long" })} — {days[6].toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <Button onClick={() => {
          const now = new Date()
          setNewDate(fmtDate(now))
          setNewTime(`${now.getHours().toString().padStart(2, "0")}:00`)
          setNewCustId("")
          setNewVehId("__none__")
          setNewServiceIds([])
          setNewOpen(true)
        }}>
          <Plus className="mr-1 h-4 w-4" /> Nueva Reserva
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS[key as BookingStatus] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto border rounded-lg bg-background">
        <div className="min-w-[700px]">
          {/* Header row: time label + day columns */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
            <div className="p-2 text-xs text-muted-foreground text-center">Hora</div>
            {days.map((d, i) => {
              const ds = fmtDate(d)
              const isToday = ds === todayStr
              return (
                <div key={i} className={`p-2 text-center text-xs font-medium border-l ${isToday ? "bg-primary/5" : ""}`}>
                  <div>{DAY_LABELS[d.getDay()]}</div>
                  <div className={`text-lg ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                </div>
              )
            })}
          </div>

          {/* Hour rows */}
          <div className="relative">
            {hours.map((h, rowIdx) => (
              <div
                key={h}
                className="grid grid-cols-[60px_repeat(7,1fr)] border-b hover:bg-muted/20"
                style={{ height: HOUR_HEIGHT }}
              >
                <div className="p-1 text-xs text-muted-foreground text-right pr-2 border-r">
                  {`${h.toString().padStart(2, "0")}:00`}
                </div>
                {days.map((d, colIdx) => {
                  const ds = fmtDate(d)
                  return (
                    <div
                      key={colIdx}
                      className="border-l relative cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => handleSlotClick(ds, `${h.toString().padStart(2, "0")}:00`)}
                    />
                  )
                })}
              </div>
            ))}

            {/* Booking blocks */}
            {bookings.map((booking) => {
              const { col, topPx, heightPx } = getGridInfo(booking)
              const status = booking.status as BookingStatus
              const servicesList = booking.booking_services?.map((bs: any) => bs.services?.name).filter(Boolean) ?? []
              const serviceName = servicesList.length > 0 ? servicesList.join(", ") : booking.services?.name ?? ""

              return (
                <div
                  key={booking.id}
                  className="absolute left-0 right-0 mx-1 rounded px-2 py-1 text-xs overflow-hidden cursor-pointer border hover:opacity-80 transition-opacity z-20"
                  style={{
                    top: topPx,
                    height: Math.max(heightPx, 24),
                    left: `calc(60px + ${col - 1} * (100% - 60px) / 7 + 4px)`,
                    width: `calc((100% - 60px) / 7 - 8px)`,
                    backgroundColor: STATUS_COLORS[status] ?? "#e5e7eb",
                    color: STATUS_TEXT_COLORS[status] ?? "#374151",
                    borderColor: STATUS_TEXT_COLORS[status] ?? "#374151",
                  }}
                  onClick={(e) => { e.stopPropagation(); setDetailBooking(booking); setDetailOpen(true) }}
                >
                  <div className="font-medium truncate">
                    {booking.booking_time?.slice(0, 5)} — {booking.customers?.name}
                  </div>
                  {heightPx > 32 && (
                    <div className="truncate opacity-75">{serviceName}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* New Booking Modal */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Reserva</DialogTitle></DialogHeader>
          <form onSubmit={handleNewBooking} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cal-date">Fecha</Label>
                <Input id="cal-date" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-time">Hora</Label>
                <Input id="cal-time" type="time" value={newTime} onChange={e => setNewTime(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-customer">Cliente</Label>
              <Select value={newCustId} onValueChange={setNewCustId} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newCustId && (
              <div className="space-y-2">
                <Label>Vehículo (opcional)</Label>
                <Select value={newVehId} onValueChange={setNewVehId}>
                  <SelectTrigger><SelectValue placeholder="Sin vehículo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin vehículo</SelectItem>
                    {vehicles.filter(v => v.customer_id === newCustId).map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.plate}{v.brand ? ` - ${v.brand}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Servicios</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                {services.map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                    <input type="checkbox" checked={newServiceIds.includes(s.id)} onChange={() =>
                      setNewServiceIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])
                    } className="h-4 w-4" />
                    <span className="text-sm font-medium">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">Crear Reserva</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalle de Reserva</DialogTitle></DialogHeader>
          {detailBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{detailBooking.booking_date} — {detailBooking.booking_time?.slice(0, 5)}</span>
                <Badge className={detailBooking.status === "reserved" ? "bg-blue-100 text-blue-800" : detailBooking.status === "waiting" ? "bg-yellow-100 text-yellow-800" : detailBooking.status === "in_progress" ? "bg-orange-100 text-orange-800" : detailBooking.status === "ready" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {STATUS_LABELS[detailBooking.status as BookingStatus]}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{detailBooking.customers?.name}</span>
                {detailBooking.customers?.phone && <span className="text-sm text-muted-foreground">({detailBooking.customers.phone})</span>}
              </div>
              {detailBooking.vehicles && (
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span>{detailBooking.vehicles.plate}{detailBooking.vehicles.brand ? ` - ${detailBooking.vehicles.brand}` : ""}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-1">Servicios</p>
                {detailBooking.booking_services?.length > 0 ? (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {detailBooking.booking_services.map((bs: any) => (
                      <li key={bs.id}>• {bs.services?.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{detailBooking.services?.name}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(STATUS_LABELS) as [BookingStatus, string][]).map(([key, label]) => (
                    <Button key={key} size="sm" variant={detailBooking.status === key ? "default" : "outline"}
                      onClick={() => handleStatusChange(detailBooking.id, key)}>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
