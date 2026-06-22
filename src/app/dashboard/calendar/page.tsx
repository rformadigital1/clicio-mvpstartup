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
import { ChevronLeft, ChevronRight, Plus, Clock, User, Car, Pencil, Search, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Booking, BookingStatus, Customer, Service, Vehicle, BusinessHour } from "@/lib/types"
import { STATUS_LABELS, STATUS_COLORS, STATUS_TEXT_COLORS, STATUS_BADGE_CLASSES } from "@/lib/booking-constants"

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const HOUR_HEIGHT = 56

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
  const [bizHours, setBizHours] = useState<BusinessHour[]>([])
  const [loading, setLoading] = useState(true)

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

  // Edit modal
  const [editBooking, setEditBooking] = useState<any>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editCustId, setEditCustId] = useState("")
  const [editVehId, setEditVehId] = useState("__none__")
  const [editServiceIds, setEditServiceIds] = useState<string[]>([])

  // List view state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadWeek() }, [weekStart, tenantId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return
    setTenantId(profile.tenant_id)

    const [sRes, cRes, vRes, hRes] = await Promise.all([
      supabase.from("services").select("*").eq("tenant_id", profile.tenant_id).order("name"),
      supabase.from("customers").select("*").eq("tenant_id", profile.tenant_id).order("name"),
      supabase.from("vehicles").select("*, customers(*)").eq("tenant_id", profile.tenant_id).order("plate"),
      supabase.from("business_hours").select("*").eq("tenant_id", profile.tenant_id).order("day_of_week"),
    ])
    if (sRes.error) toast({ title: "Error", description: sRes.error.message, variant: "destructive" })
    if (cRes.error) toast({ title: "Error", description: cRes.error.message, variant: "destructive" })
    if (vRes.error) toast({ title: "Error", description: vRes.error.message, variant: "destructive" })
    if (hRes.error) toast({ title: "Error", description: hRes.error.message, variant: "destructive" })
    setServices(sRes.data ?? [])
    setCustomers(cRes.data ?? [])
    setVehicles(vRes.data ?? [])
    setBizHours(hRes.data ?? [])
    setLoading(false)
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
    const totalMinutes = (endHour - startHour) * 60
    const dur = Math.max(totalDuration(booking), 30)
    const top = ((startMinutes - startHour * 60) / totalMinutes) * 100
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
    const topPx = ((startMinutes - startHour * 60) / 60) * HOUR_HEIGHT
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

  const { startHour, endHour } = useMemo(() => {
    const openDays = bizHours.filter(h => h.is_open)
    if (openDays.length === 0) return { startHour: 8, endHour: 20 }
    const mins = openDays.map(h => {
      const [ho, mo] = h.open_time.split(":").map(Number)
      return ho * 60 + mo
    })
    const maxMins = openDays.map(h => {
      const [hc, mc] = h.close_time.split(":").map(Number)
      return hc * 60 + mc
    })
    return { startHour: Math.min(...mins) / 60, endHour: Math.max(...maxMins) / 60 }
  }, [bizHours])

  const hours = useMemo(() => {
    return Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  }, [startHour, endHour])

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

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const name = b.customers?.name?.toLowerCase() ?? ""
      const plate = b.vehicles?.plate?.toLowerCase() ?? ""
      const services = b.booking_services?.map((bs: any) => bs.services?.name).join(" ").toLowerCase() ?? ""
      return name.includes(q) || plate.includes(q) || services.includes(q)
    })
  }, [bookings, searchQuery, statusFilter])

  function exportCSV() {
    const rows = filteredBookings.map(b => {
      const servicesStr = b.booking_services?.map((bs: any) => bs.services?.name).filter(Boolean).join(", ") ?? ""
      return [
        b.booking_date,
        b.booking_time?.slice(0, 5),
        `"${(b.customers?.name ?? "").replace(/"/g, '""')}"`,
        `"${(b.customers?.phone ?? "").replace(/"/g, '""')}"`,
        `"${(b.vehicles?.plate ?? "").replace(/"/g, '""')}"`,
        `"${servicesStr.replace(/"/g, '""')}"`,
        STATUS_LABELS[b.status as BookingStatus] ?? "",
      ].join(",")
    })
    const csv = ["Fecha,Hora,Cliente,Teléfono,Vehículo,Servicios,Estado", ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reservas-${fmtDate(weekStart)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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

  function openEdit(booking: any) {
    setEditBooking(booking)
    setEditDate(booking.booking_date)
    setEditTime(booking.booking_time?.slice(0, 5) ?? "08:00")
    setEditCustId(booking.customer_id ?? "")
    setEditVehId(booking.vehicle_id ?? "__none__")
    setEditServiceIds(booking.booking_services?.map((bs: any) => bs.service_id) ?? [])
    setEditOpen(true)
    setDetailOpen(false)
  }

  async function handleEditBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId || !editBooking) return
    if (editServiceIds.length === 0) { toast({ title: "Selecciona al menos un servicio", variant: "destructive" }); return }

    const check = await checkAvailability(tenantId, editDate, editTime, editServiceIds, editBooking.id)
    if (!check.available) { toast({ title: "Horario no disponible", description: check.reason, variant: "destructive" }); return }

    const { error } = await supabase.from("bookings").update({
      customer_id: editCustId,
      vehicle_id: editVehId && editVehId !== "__none__" ? editVehId : null,
      booking_date: editDate,
      booking_time: editTime,
    }).eq("id", editBooking.id)
    if (error) { toast({ title: "Error al actualizar", description: error.message, variant: "destructive" }); return }

    await supabase.from("booking_services").delete().eq("booking_id", editBooking.id)
    await supabase.from("booking_services").insert(
      editServiceIds.map(sid => ({ booking_id: editBooking.id, service_id: sid }))
    )

    toast({ title: "Reserva actualizada" })
    setEditOpen(false)
    loadWeek()
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

  if (loading) return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="rounded-xl border">
        <div className="flex gap-4 p-4 border-b">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 flex-1" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b">
            {Array.from({ length: 8 }).map((_, j) => (
              <Skeleton key={j} className="h-6 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl sm:text-2xl font-bold">Calendario</h1>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={navPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={navToday}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={navNext}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {days[0].toLocaleDateString("es-CL", { day: "numeric" })} — {days[6].toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
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
                <div key={i} className={`p-1 sm:p-2 text-center text-[10px] sm:text-xs font-medium border-l ${isToday ? "bg-primary/5" : ""}`}>
                  <div className="hidden sm:block">{DAY_LABELS[d.getDay()]}</div>
                  <div className="sm:hidden">{DAY_LABELS[d.getDay()].slice(0, 2)}</div>
                  <div className={`text-sm sm:text-lg ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
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
                  className="absolute left-0 right-0 mx-1 rounded px-1 sm:px-2 py-1 text-[10px] sm:text-xs overflow-hidden cursor-pointer border hover:opacity-80 transition-opacity z-20"
                  title={`${booking.booking_time?.slice(0, 5)} — ${booking.customers?.name}${serviceName ? ` (${serviceName})` : ""}`}
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
                  <div className="font-medium truncate leading-tight">
                    {booking.booking_time?.slice(0, 5)} {booking.customers?.name}
                  </div>
                  {heightPx > 32 && (
                    <div className="truncate opacity-75 leading-tight mt-0.5">{serviceName}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* List View */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente, patente o servicio..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Filtrar estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-1 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Fecha</th>
                <th className="text-left p-3 font-medium">Hora</th>
                <th className="text-left p-3 font-medium">Cliente</th>
                <th className="text-left p-3 font-medium">Teléfono</th>
                <th className="text-left p-3 font-medium">Vehículo</th>
                <th className="text-left p-3 font-medium">Servicios</th>
                <th className="text-left p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sin resultados</td></tr>
              ) : (
                filteredBookings.map(b => (
                  <tr
                    key={b.id}
                    className="border-b hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => { setDetailBooking(b); setDetailOpen(true) }}
                  >
                    <td className="p-3">{b.booking_date}</td>
                    <td className="p-3">{b.booking_time?.slice(0, 5)}</td>
                    <td className="p-3">{b.customers?.name}</td>
                    <td className="p-3">{b.customers?.phone}</td>
                    <td className="p-3">{b.vehicles?.plate}</td>
                    <td className="p-3">{b.booking_services?.map((bs: any) => bs.services?.name).filter(Boolean).join(", ")}</td>
                    <td className="p-3">
                      <Badge className={STATUS_BADGE_CLASSES[b.status as BookingStatus]}>
                        {STATUS_LABELS[b.status as BookingStatus]}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <Badge className={STATUS_BADGE_CLASSES[detailBooking.status as BookingStatus]}>
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
              <Button variant="outline" className="w-full" onClick={() => openEdit(detailBooking)}>
                <Pencil className="mr-1 h-4 w-4" /> Editar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Reserva</DialogTitle></DialogHeader>
          {editBooking && (
            <form onSubmit={handleEditBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Fecha</Label>
                  <Input id="edit-date" type="date" value={editDate} onChange={e => setEditDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Hora</Label>
                  <Input id="edit-time" type="time" value={editTime} onChange={e => setEditTime(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-customer">Cliente</Label>
                <Select value={editCustId} onValueChange={setEditCustId} required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editCustId && (
                <div className="space-y-2">
                  <Label>Vehículo (opcional)</Label>
                  <Select value={editVehId} onValueChange={setEditVehId}>
                    <SelectTrigger><SelectValue placeholder="Sin vehículo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin vehículo</SelectItem>
                      {vehicles.filter(v => v.customer_id === editCustId).map(v => (
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
                      <input type="checkbox" checked={editServiceIds.includes(s.id)} onChange={() =>
                        setEditServiceIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])
                      } className="h-4 w-4" />
                      <span className="text-sm font-medium">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">Guardar Cambios</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
