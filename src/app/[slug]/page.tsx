"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Tenant, Service } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function TenantSitePage() {
  const { slug } = useParams<{ slug: string }>()
  const supabase = createClient()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    if (!slug) return
    loadTenant()
  }, [slug])

  async function loadTenant() {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)

    if (tenants && tenants.length > 0) {
      setTenant(tenants[0])
      const { data: svcs } = await supabase
        .from("services")
        .select("*")
        .eq("tenant_id", tenants[0].id)
      setServices(svcs ?? [])
    }
  }

  async function handleBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenant) return

    const form = new FormData(e.currentTarget)

    const { data: customer, error: customerErr } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenant.id,
        name: form.get("name") as string,
        phone: form.get("phone") as string,
        plate: form.get("plate") as string,
      })
      .select()
      .single()

    if (customerErr || !customer) return

    const { error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        tenant_id: tenant.id,
        customer_id: customer.id,
        service_id: form.get("service") as string,
        booking_date: form.get("date") as string,
        booking_time: form.get("time") as string,
        status: "reserved",
      })

    if (!bookingErr) {
      setBookingSuccess(true)
    }
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Taller no encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <h1 className="text-xl font-bold">{tenant.name}</h1>
        </div>
      </header>

      <main>
        <section className="container py-20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold">Tu taller de confianza</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
            Agenda tu hora con nosotros. Rápido, fácil y sin esperas.
          </p>
          <Button size="lg" className="mt-8" onClick={() => setBookingOpen(true)}>
            Agendar Ahora
          </Button>
        </section>

        <section className="border-t py-16">
          <div className="container">
            <h3 className="text-2xl font-bold text-center mb-8">Servicios</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {services.map((s) => (
                <Card key={s.id}>
                  <CardHeader>
                    <CardTitle>{s.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {s.price && <p className="text-lg font-bold">$ {s.price.toLocaleString("es-CL")}</p>}
                    {s.duration && <p className="text-sm text-muted-foreground">{s.duration} min</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-16 bg-muted/50">
          <div className="container text-center">
            <h3 className="text-2xl font-bold">Beneficios</h3>
            <div className="grid md:grid-cols-3 gap-6 mt-8 max-w-2xl mx-auto">
              {["Atención rápida", "Técnicos especializados", "Garantía"].map((b) => (
                <div key={b} className="font-semibold">{b}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="container text-center">
            <h3 className="text-2xl font-bold mb-4">Ubicación</h3>
            {tenant.address && <p className="text-muted-foreground mb-4">{tenant.address}</p>}
            {tenant.address && (
              <div className="aspect-video max-w-xl mx-auto bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                Mapa - {tenant.address}
              </div>
            )}
          </div>
        </section>

        <section className="border-t py-16 text-center">
          <div className="container">
            <h3 className="text-2xl font-bold mb-4">Agenda tu hora</h3>
            <Button size="lg" onClick={() => setBookingOpen(true)}>
              Agendar Ahora
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container">{tenant.name} - {tenant.phone && <span>{tenant.phone}</span>}</div>
      </footer>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          {bookingSuccess ? (
            <div className="text-center py-8">
              <DialogTitle className="mb-2">¡Reserva confirmada!</DialogTitle>
              <DialogDescription>
                Te enviaremos un recordatorio antes de tu visita.
              </DialogDescription>
              <Button className="mt-4" onClick={() => { setBookingOpen(false); setBookingSuccess(false) }}>
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Agendar hora</DialogTitle>
                <DialogDescription>Completa los datos para agendar tu visita.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBooking} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" type="tel" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plate">Patente</Label>
                  <Input id="plate" name="plate" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Servicio</Label>
                  <Select name="service" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.price ? `- $${s.price.toLocaleString("es-CL")}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input id="time" name="time" type="time" required />
                </div>
                <Button type="submit" className="w-full">Reservar</Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {tenant.phone && (
        <a
          href={`https://wa.me/${tenant.phone.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 text-white rounded-full p-4 shadow-lg hover:bg-green-600 transition-colors"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  )
}
