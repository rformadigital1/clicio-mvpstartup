"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import type { Booking, BookingStatus, Customer, Service } from "@/lib/types"

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
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

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

    const [bRes, cRes, sRes] = await Promise.all([
      supabase.from("bookings").select("*, customers(*), services(*)").eq("tenant_id", profile.tenant_id).order("booking_date").order("booking_time"),
      supabase.from("customers").select("*").eq("tenant_id", profile.tenant_id).order("name"),
      supabase.from("services").select("*").eq("tenant_id", profile.tenant_id).order("name"),
    ])

    if (bRes.error) toast({ title: "Error al cargar reservas", description: bRes.error.message, variant: "destructive" })
    if (cRes.error) toast({ title: "Error al cargar clientes", description: cRes.error.message, variant: "destructive" })
    if (sRes.error) toast({ title: "Error al cargar servicios", description: sRes.error.message, variant: "destructive" })

    setBookings(bRes.data ?? [])
    setCustomers(cRes.data ?? [])
    setServices(sRes.data ?? [])
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
    const { error } = await supabase.from("bookings").insert({
      tenant_id: tenantId,
      customer_id: form.get("customer_id") as string,
      service_id: form.get("service_id") as string,
      booking_date: form.get("booking_date") as string,
      booking_time: form.get("booking_time") as string,
      status: "reserved",
    })

    if (error) { toast({ title: "Error al crear reserva", description: error.message, variant: "destructive" }); return }
    toast({ title: "Reserva creada" })
    setDialogOpen(false)
    loadData()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Nueva Reserva</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Reserva</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBooking} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Cliente</Label>
                <Select name="customer_id" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} {c.plate ? `- ${c.plate}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

      <div className="space-y-3">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="text-right min-w-[60px]">
                <p className="font-medium">{booking.booking_time?.slice(0, 5)}</p>
                <p className="text-xs text-muted-foreground">{booking.booking_date}</p>
              </div>
              <div className="flex-1">
                <p className="font-medium">{booking.customers?.name}</p>
                <p className="text-sm text-muted-foreground">{booking.customers?.plate} - {booking.services?.name}</p>
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
        ))}
        {bookings.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No hay reservas</p>
        )}
      </div>
    </div>
  )
}
