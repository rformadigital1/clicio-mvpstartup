"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Tenant, Service, BusinessHour, Vehicle, GalleryImage } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { checkAvailability } from "@/lib/availability"

export default function TenantSitePage() {
  const { slug } = useParams<{ slug: string }>()
  const supabase = createClient()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [hours, setHours] = useState<BusinessHour[]>([])
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [bookError, setBookError] = useState("")
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [existingCustomer, setExistingCustomer] = useState<any>(null)
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState("new")
  const [vehPlate, setVehPlate] = useState("")
  const [vehBrand, setVehBrand] = useState("")
  const [vehModel, setVehModel] = useState("")
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)

  function toggleService(s: Service) {
    setSelectedServiceIds(prev => {
      if (prev.includes(s.id)) {
        setTotalPrice(p => p - (s.price ?? 0))
        setTotalDuration(d => d - (s.duration ?? 0))
        return prev.filter(id => id !== s.id)
      } else {
        setTotalPrice(p => p + (s.price ?? 0))
        setTotalDuration(d => d + (s.duration ?? 0))
        return [...prev, s.id]
      }
    })
  }

  useEffect(() => {
    if (!slug) return
    loadTenant()
  }, [slug])

  async function loadTenant() {
    setLoading(true)
    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)

    if (error || !tenants || tenants.length === 0) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setTenant(tenants[0])
    const [svcRes, hoursRes, galRes] = await Promise.all([
      supabase.from("services").select("*").eq("tenant_id", tenants[0].id),
      supabase.from("business_hours").select("*").eq("tenant_id", tenants[0].id).order("day_of_week"),
      supabase.from("gallery_images").select("*").eq("tenant_id", tenants[0].id).order("created_at", { ascending: false }),
    ])
    setServices(svcRes.data ?? [])
    setHours(hoursRes.data ?? [])
    setGallery(galRes.data ?? [])
    setLoading(false)
  }

  async function handlePhoneBlur(phone: string) {
    if (!tenant || phone.length < 6) return
    const { data } = await supabase
      .from("customers")
      .select("*, vehicles(*)")
      .eq("tenant_id", tenant.id)
      .eq("phone", phone)
      .maybeSingle()
    if (data) {
      setExistingCustomer(data)
      setCustomerVehicles(data.vehicles || [])
      if (data.vehicles?.length > 0) {
        setSelectedVehicleId(data.vehicles[0].id)
        setVehPlate("")
      } else {
        setSelectedVehicleId("new")
      }
    } else {
      setExistingCustomer(null)
      setCustomerVehicles([])
      setSelectedVehicleId("new")
    }
  }

  function resetBookingForm() {
    setExistingCustomer(null)
    setCustomerVehicles([])
    setSelectedVehicleId("new")
    setVehPlate("")
    setVehBrand("")
    setVehModel("")
    setSelectedServiceIds([])
    setTotalPrice(0)
    setTotalDuration(0)
    setBookError("")
    setBookingSuccess(false)
  }

  async function handleBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenant) return
    setBookError("")

    const form = new FormData(e.currentTarget)

    if (selectedServiceIds.length === 0) { setBookError("Selecciona al menos un servicio"); return }

    const check = await checkAvailability(tenant.id, form.get("date") as string, form.get("time") as string, selectedServiceIds)
    if (!check.available) { setBookError(check.reason ?? "Horario no disponible"); return }

    let customerId: string
    let vehicleId: string | null = null

    if (existingCustomer) {
      customerId = existingCustomer.id
      if (selectedVehicleId === "new") {
        const plate = vehPlate.trim().toUpperCase()
        if (!plate) { setBookError("Ingresa la patente del vehículo"); return }
        const { data: newV, error: vehErr } = await supabase.from("vehicles").insert({
          tenant_id: tenant.id,
          customer_id: customerId,
          plate,
          brand: vehBrand.trim() || null,
          model: vehModel.trim() || null,
        }).select().single()
        if (vehErr || !newV) { setBookError("Error al crear vehículo"); return }
        vehicleId = newV.id
      } else {
        vehicleId = selectedVehicleId
      }
    } else {
      const { data: customer, error: customerErr } = await supabase
        .from("customers")
        .insert({
          tenant_id: tenant.id,
          name: form.get("name") as string,
          phone: form.get("phone") as string,
        })
        .select()
        .single()

      if (customerErr || !customer) { setBookError("Error al crear cliente"); return }
      customerId = customer.id

      const plate = vehPlate.trim().toUpperCase()
      if (!plate) { setBookError("Ingresa la patente del vehículo"); return }
      const { data: newV, error: vehErr } = await supabase.from("vehicles").insert({
        tenant_id: tenant.id,
        customer_id: customerId,
        plate,
        brand: vehBrand.trim() || null,
        model: vehModel.trim() || null,
      }).select().single()
      if (vehErr || !newV) { setBookError("Error al crear vehículo"); return }
      vehicleId = newV.id
    }

    const payload: Record<string, any> = {
      tenant_id: tenant.id,
      customer_id: customerId,
      vehicle_id: vehicleId,
      booking_date: form.get("date") as string,
      booking_time: form.get("time") as string,
      status: "reserved",
    }

    const { data: newBooking, error: bookingErr } = await supabase
      .from("bookings")
      .insert(payload)
      .select()
      .single()

    if (bookingErr || !newBooking) {
      setBookError("Error al crear reserva. Intenta de nuevo.")
      return
    }

    // Insert booking_services
    const { error: bsErr } = await supabase.from("booking_services").insert(
      selectedServiceIds.map(sid => ({ booking_id: newBooking.id, service_id: sid }))
    )
    if (bsErr) {
      setBookError("Error al guardar servicios. Intenta de nuevo.")
      return
    }

    setBookingSuccess(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-concreto flex items-center justify-center">
        <div className="text-center animate-pulse">
          <p className="text-azul-rey font-[family-name:var(--font-display)] italic text-xl">Cargando...</p>
        </div>
      </div>
    )
  }

  if (notFound || !tenant) {
    return (
      <div className="min-h-screen bg-bg-concreto flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔧</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Taller no encontrado</h1>
          <p className="text-muted-foreground">El taller que buscas no existe o la URL es incorrecta.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-concreto">
      {/* Header */}
      <header className="bg-white border-b border-border-subtil">
        <div className="container flex h-16 items-center">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-auto max-w-[120px] object-contain" />
          ) : (
            <h1 className="text-lg font-[family-name:var(--font-display)] italic font-bold text-azul-rey">{tenant.name}</h1>
          )}
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-azul-rey to-celeste-cielo text-white py-12 md:py-20">
          <div className="container text-center">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              {tenant.name}
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-md mx-auto">
              {tenant.address ? `${tenant.address} — ` : ""}Agenda tu hora. Rápido, fácil y sin esperas.
            </p>
            <Button size="lg" className="mt-8 bg-white text-azul-rey hover:bg-white/90 font-semibold" onClick={() => setBookingOpen(true)}>
              Agendar Ahora
            </Button>
          </div>
        </section>

        {/* Services */}
        {services.length > 0 && (
          <section className="py-16 md:py-20">
            <div className="container">
              <h3 className="text-2xl font-bold text-center mb-10">Servicios</h3>
              <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
                {services.map((s) => (
                  <div key={s.id} className="bg-white rounded-lg p-5 border border-border-subtil hover:border-azul-rey/30 transition-colors" style={{ borderLeft: "3px solid #1A3A8A" }}>
                    <h4 className="font-semibold mb-1">{s.name}</h4>
                    {s.price && <p className="text-lg font-bold text-azul-rey">$ {s.price.toLocaleString("es-CL")}</p>}
                    {s.duration && <p className="text-sm text-muted-foreground">{s.duration} min</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <section className="bg-white border-y border-border-subtil py-16 md:py-20">
            <div className="container">
              <h3 className="text-2xl font-bold text-center mb-10">Trabajos Realizados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
                {gallery.map((img) => (
                  <button key={img.id} onClick={() => setLightboxUrl(img.image_url)} className="aspect-square overflow-hidden rounded-lg border border-border-subtil group">
                    <img src={img.image_url} alt={`Trabajo realizado por ${tenant.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Lightbox */}
        {lightboxUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightboxUrl(null)}>
            <img src={lightboxUrl} alt="Trabajo realizado" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        )}

        {/* Hours */}
        {hours.length > 0 && (
          <section className="py-16 md:py-20">
            <div className="container max-w-lg">
              <h3 className="text-2xl font-bold text-center mb-10">Horarios</h3>
              <div className="bg-white rounded-lg border border-border-subtil p-5">
                {hours.filter(h => h.is_open).length > 0 ? (
                  <div className="space-y-3">
                    {hours.map((h) => (
                      <div key={h.day_of_week} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{[ "Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb" ][h.day_of_week]}</span>
                        {h.is_open ? (
                          <span className="text-muted-foreground">{h.open_time.slice(0, 5)} — {h.close_time.slice(0, 5)}</span>
                        ) : (
                          <span className="text-rojo/70">Cerrado</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">Sin horario disponible</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Benefits */}
        <section className="bg-white border-y border-border-subtil py-16 md:py-20">
          <div className="container text-center">
            <h3 className="text-2xl font-bold">Beneficios</h3>
            <div className="grid md:grid-cols-3 gap-8 mt-10 max-w-2xl mx-auto">
              <div className="flex flex-col items-center gap-2">
                <svg className="h-8 w-8 text-azul-rey" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                <p className="font-semibold">Atención rápida</p>
                <p className="text-sm text-muted-foreground">Sin largas esperas</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <svg className="h-8 w-8 text-azul-rey" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>
                <p className="font-semibold">Técnicos certificados</p>
                <p className="text-sm text-muted-foreground">Expertos en tu vehículo</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <svg className="h-8 w-8 text-azul-rey" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                <p className="font-semibold">Garantía</p>
                <p className="text-sm text-muted-foreground">Trabajo garantizado</p>
              </div>
            </div>
          </div>
        </section>

        {/* Location */}
        {tenant.address && (
          <section className="py-16 md:py-20">
            <div className="container text-center">
              <h3 className="text-2xl font-bold mb-4">Ubicación</h3>
              <p className="text-muted-foreground mb-6">{tenant.address}</p>
              <div className="aspect-video max-w-2xl mx-auto bg-bg-superficie rounded-lg flex items-center justify-center text-muted-foreground border border-border-subtil">
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                  {tenant.address}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-gradient-to-br from-azul-rey to-celeste-cielo text-white py-16 text-center">
          <div className="container">
            <h3 className="text-2xl font-bold mb-4">¿Listo para agendar?</h3>
            <Button size="lg" className="bg-white text-azul-rey hover:bg-white/90 font-semibold" onClick={() => setBookingOpen(true)}>
              Agendar Ahora
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtil py-8 text-center text-sm text-muted-foreground">
        <div className="container">{tenant.name}{tenant.phone ? ` · ${tenant.phone}` : ""}</div>
      </footer>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={(open) => { setBookingOpen(open); if (!open) resetBookingForm() }}>
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
                  <Input id="phone" name="phone" type="tel" required onBlur={(e) => handlePhoneBlur(e.target.value)} />
                </div>
                {existingCustomer && customerVehicles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Vehículo</Label>
                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vehículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerVehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.plate} {v.brand ? `- ${v.brand}` : ""} {v.model ?? ""}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">+ Agregar otro vehículo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(selectedVehicleId === "new" || !existingCustomer) && (
                  <div className="space-y-2">
                    <Label>Patente *</Label>
                    <Input value={vehPlate} onChange={(e) => setVehPlate(e.target.value)} placeholder="Ej: ABC123" required />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={vehBrand} onChange={(e) => setVehBrand(e.target.value)} placeholder="Marca (opcional)" />
                      <Input value={vehModel} onChange={(e) => setVehModel(e.target.value)} placeholder="Modelo (opcional)" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Servicios</Label>
                  <div className="space-y-1 max-h-60 overflow-y-auto border rounded-lg p-2">
                    {services.map((s) => (
                      <label key={s.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServiceIds.includes(s.id)}
                          onChange={() => toggleService(s)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{s.name}</span>
                          {s.duration && <span className="text-xs text-muted-foreground ml-2">{s.duration} min</span>}
                        </div>
                        {s.price && <span className="text-sm font-medium whitespace-nowrap">${s.price.toLocaleString("es-CL")}</span>}
                      </label>
                    ))}
                  </div>
                  {selectedServiceIds.length > 0 && (
                    <div className="flex justify-between text-sm font-medium pt-1 border-t text-muted-foreground">
                      <span>{totalDuration > 0 && `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}min`}</span>
                      <span>Total: ${totalPrice.toLocaleString("es-CL")}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input id="time" name="time" type="time" required />
                </div>
                {bookError && <p className="text-sm text-destructive">{bookError}</p>}
                <Button type="submit" className="w-full">Reservar</Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp FAB */}
      {tenant.phone && (
        <a
          href={`https://wa.me/${tenant.phone.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-green-500 text-white rounded-full p-3.5 md:p-4 shadow-lg hover:bg-green-600 transition-colors"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  )
}
