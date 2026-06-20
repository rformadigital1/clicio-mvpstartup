"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { checkAvailability } from "@/lib/availability"
import { Plus, Search, Calendar as CalendarIcon } from "lucide-react"
import type { Booking, BookingStatus, Customer, Service, Vehicle } from "@/lib/types"
import Link from "next/link"

const statusColors: Record<BookingStatus, string> = {
  reserved: "bg-blue-100 text-blue-800",
  waiting: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-800",
}

const statusLabels: Record<BookingStatus, string> = {
  reserved: "Reservado",
  waiting: "Esperando",
  in_progress: "En progreso",
  ready: "Listo",
  delivered: "Entregado",
}

export default function BookingsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newBookingCustomerId, setNewBookingCustomerId] = useState("")

  // Filters
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) { toast({ title: "Error de autenticación", variant: "destructive" }); return }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()
    if (profileErr || !profile) { toast({ title: "Error al cargar perfil", description: profileErr?.message, variant: "destructive" }); return }
    setTenantId(profile.tenant_id)

    const [bRes, cRes, sRes, vRes] = await Promise.all([
      supabase.from("bookings").select("*, customers(*), services(*), vehicles(*)").eq("tenant_id", profile.tenant_id).order("booking_date", { ascending: false }).order("booking_time"),
      supabase.from("customers").select("*").eq("tenant_id", profile.tenant_id).order("name"),
      supabase.from("services").select("*").eq("tenant_id", profile.tenant_id).order("name"),
      supabase.from("vehicles").select("*, customers(*)").eq("tenant_id", profile.tenant_id).order("plate"),
    ])

    if (bRes.error) toast({ title: "Error al cargar reservas", description: bRes.error.message, variant: "destructive" })
    if (cRes.error) toast({ title: "Error al cargar clientes", description: cRes.error.message, variant: "destructive" })
    if (sRes.error) toast({ title: "Error al cargar servicios", description: sRes.error.message, variant: "destructive" })
    if (vRes.error) toast({ title: "Error al cargar vehículos", description: vRes.error.message, variant: "destructive" })

    setBookings(bRes.data ?? [])
    setCustomers(cRes.data ?? [])
    setServices(sRes.data ?? [])
    setVehicles(vRes.data ?? [])
  }

  async function updateStatus(bookingId: string, status: BookingStatus) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId)
    if (error) { toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" }); return }
    loadData()
  }

  async function handleAddBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId) { toast({ title: "Error", description: "Tenant no encontrado", variant: "destructive" }); return }

    const form = new FormData(e.currentTarget)

    const check = await checkAvailability(tenantId, form.get("booking_date") as string, form.get("booking_time") as string)
    if (!check.available) { toast({ title: "Horario no disponible", description: check.reason, variant: "destructive" }); return }

    const vehId = form.get("vehicle_id") as string
    const payload: Record<string, any> = {
      tenant_id: tenantId,
      customer_id: form.get("customer_id") as string,
      service_id: form.get("service_id") as string,
      booking_date: form.get("booking_date") as string,
      booking_time: form.get("booking_time") as string,
      status: "reserved",
    }
    if (vehId && vehId !== "__none__") payload.vehicle_id = vehId

    const { error } = await supabase.from("bookings").insert(payload)

    if (error) { toast({ title: "Error al crear reserva", description: error.message, variant: "destructive" }); return }
    toast({ title: "Reserva creada" })
    setDialogOpen(false)
    setNewBookingCustomerId("")
    loadData()
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search by customer name, plate, or vehicle plate
      if (search) {
        const q = search.toLowerCase()
        const name = b.customers?.name?.toLowerCase() ?? ""
        const custPlate = b.customers?.plate?.toLowerCase() ?? ""
        const vehPlate = b.vehicles?.plate?.toLowerCase() ?? ""
        if (!name.includes(q) && !custPlate.includes(q) && !vehPlate.includes(q)) return false
      }
      // Status filter
      if (filterStatus !== "all" && b.status !== filterStatus) return false
      // Date from
      if (filterDateFrom && b.booking_date < filterDateFrom) return false
      // Date to
      if (filterDateTo && b.booking_date > filterDateTo) return false
      return true
    })
  }, [bookings, search, filterStatus, filterDateFrom, filterDateTo])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Nueva Reserva</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Reserva</DialogTitle></DialogHeader>
            <form onSubmit={handleAddBooking} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Cliente</Label>
                <Select name="customer_id" required value={newBookingCustomerId} onValueChange={setNewBookingCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newBookingCustomerId && (
                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">Vehículo</Label>
                  <Select name="vehicle_id">
                    <SelectTrigger><SelectValue placeholder="Sin vehículo (opcional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin vehículo</SelectItem>
                      {vehicles.filter(v => v.customer_id === newBookingCustomerId).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate} {v.brand ? `- ${v.brand}` : ""} {v.model ?? ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="service_id">Servicio</Label>
                <Select name="service_id" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="booking_date">Fecha</Label>
                  <Input id="booking_date" name="booking_date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking_time">Hora</Label>
                  <Input id="booking_time" name="booking_time" type="time" required />
                </div>
              </div>
              <Button type="submit" className="w-full">Crear Reserva</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs mb-1 block">Buscar cliente/patente</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Estado</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Desde</Label>
          <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-36" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Hasta</Label>
          <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-36" />
        </div>
        {(search || filterStatus !== "all" || filterDateFrom || filterDateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterDateFrom(""); setFilterDateTo("") }}>
            Limpiar
          </Button>
        )}
      </div>

      {/* Bookings count */}
      <p className="text-sm text-muted-foreground mb-3">
        {filteredBookings.length} de {bookings.length} reservas
      </p>

      {/* Results */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium mb-1">No hay reservas</p>
            <p className="text-sm text-muted-foreground mb-4">
              {bookings.length === 0
                ? "Comienza agendando tu primer servicio."
                : "Ninguna reserva coincide con los filtros."}
            </p>
            {bookings.length === 0 && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Nueva Reserva
              </Button>
            )}
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="text-right min-w-[60px]">
                  <p className="font-medium">{booking.booking_time?.slice(0, 5)}</p>
                  <p className="text-xs text-muted-foreground">{booking.booking_date}</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{booking.customers?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.vehicles ? (
                      <Link href={`/dashboard/vehicles/${booking.vehicles.id}`} className="hover:underline">
                        {booking.vehicles.plate}
                      </Link>
                    ) : booking.customers?.plate ? (
                      booking.customers.plate
                    ) : null}
                    {booking.vehicles?.brand && <span> - {booking.vehicles.brand}</span>}
                    {booking.services?.name && <span> — {booking.services.name}</span>}
                  </p>
                </div>
                <Badge className={statusColors[booking.status as BookingStatus]}>
                  {statusLabels[booking.status as BookingStatus]}
                </Badge>
                <Select
                  value={booking.status}
                  onValueChange={(val: BookingStatus) => updateStatus(booking.id, val)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
