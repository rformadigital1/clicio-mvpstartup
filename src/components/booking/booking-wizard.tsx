"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { checkAvailability } from "@/lib/availability"
import { getCalendarGrid, getAvailableSlots } from "@/lib/calendar-utils"
import { WizardProgress } from "@/components/booking/wizard-progress"
import { ChevronLeft, ChevronRight, Loader2, Calendar, Clock, CheckCircle, Sparkles } from "lucide-react"
import { WhatsAppIcon } from "@/components/icons/whatsapp"
import type { Tenant, Service, BusinessHour } from "@/lib/types"

interface BookingWizardProps {
  tenant: Tenant
  services: Service[]
  businessHours: BusinessHour[]
}

function isSlotOccupied(slotTime: string, bookings: any[]): boolean {
  const [slotH, slotM] = slotTime.split(":").map(Number)
  const slotStart = slotH * 60 + slotM
  const slotEnd = slotStart + 30
  for (const b of bookings) {
    if (!b.booking_time) continue
    const [bH, bM] = b.booking_time.split(":").map(Number)
    const bStart = bH * 60 + bM
    let bDuration = 60
    if (b.booking_services?.length > 0) {
      bDuration = b.booking_services.reduce((sum: number, bs: any) => sum + (bs.services?.duration ?? 30), 0)
    }
    if (slotStart < bStart + bDuration && slotEnd > bStart) return true
  }
  return false
}

export function BookingWizard({ tenant, services, businessHours }: BookingWizardProps) {
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [monthBookings, setMonthBookings] = useState<any[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [plate, setPlate] = useState("")
  const [vehBrand, setVehBrand] = useState("")
  const [vehModel, setVehModel] = useState("")
  const [existingCustomer, setExistingCustomer] = useState<any>(null)
  const [customerVehicles, setCustomerVehicles] = useState<any[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState("new")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [loadingMonth, setLoadingMonth] = useState(true)

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  useEffect(() => {
    loadBlockedAndBookings()
  }, [year, month])

  async function loadBlockedAndBookings() {
    setLoadingMonth(true)
    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`
    const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10)

    const [blockedRes, bookingsRes] = await Promise.all([
      supabase.from("blocked_dates").select("date").eq("tenant_id", tenant.id),
      supabase
        .from("bookings")
        .select("booking_date, booking_time, booking_services(service_id, services(duration))")
        .eq("tenant_id", tenant.id)
        .gte("booking_date", monthStart)
        .lte("booking_date", monthEnd)
        .neq("status", "cancelled"),
    ])
    setBlockedDates((blockedRes.data ?? []).map((b: any) => b.date))
    setMonthBookings(bookingsRes.data ?? [])
    setLoadingMonth(false)
  }

  const dayBookings = useMemo(() => {
    if (!selectedDate) return []
    return monthBookings.filter((b: any) => b.booking_date === selectedDate)
  }, [selectedDate, monthBookings])

  const availableSlots = useMemo(() => {
    if (!selectedDate) return []
    const slots = getAvailableSlots(selectedDate, businessHours, blockedDates)
    return slots.filter((slot) => !isSlotOccupied(slot, dayBookings))
  }, [selectedDate, businessHours, blockedDates, dayBookings])

  const calendarDays = useMemo(() => {
    const grid = getCalendarGrid(year, month)
    return grid.map((day) => {
      if (!day.isCurrentMonth || day.isPast) return day
      const [yr, mo, dy] = day.date.split("-").map(Number)
      const dow = new Date(yr, mo - 1, dy).getDay()
      const hasHours = businessHours.some((h) => h.day_of_week === dow && h.is_open)
      const isBlocked = blockedDates.includes(day.date)
      const dayBks = monthBookings.filter((b: any) => b.booking_date === day.date)
      const slots = hasHours && !isBlocked ? getAvailableSlots(day.date, businessHours, blockedDates) : []
      const hasFreeSlots = slots.some((slot) => !isSlotOccupied(slot, dayBks))
      return { ...day, isAvailable: hasFreeSlots }
    })
  }, [year, month, businessHours, blockedDates, monthBookings])

  function toggleService(s: Service) {
    setSelectedServiceIds((prev) => {
      if (prev.includes(s.id)) {
        setTotalPrice((p) => p - (s.price ?? 0))
        setTotalDuration((d) => d - (s.duration ?? 0))
        return prev.filter((id) => id !== s.id)
      }
      setTotalPrice((p) => p + (s.price ?? 0))
      setTotalDuration((d) => d + (s.duration ?? 0))
      return [...prev, s.id]
    })
  }

  async function handlePhoneBlur(val: string) {
    if (val.length < 6) return
    const { data } = await supabase
      .from("customers")
      .select("*, vehicles(*)")
      .eq("tenant_id", tenant.id)
      .eq("phone", val)
      .maybeSingle()
    if (data) {
      setExistingCustomer(data)
      setCustomerVehicles(data.vehicles || [])
      if (data.vehicles?.length > 0) {
        setSelectedVehicleId(data.vehicles[0].id)
      } else {
        setSelectedVehicleId("new")
      }
    } else {
      setExistingCustomer(null)
      setCustomerVehicles([])
      setSelectedVehicleId("new")
    }
  }

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return !!selectedDate && !!selectedTime
      case 2: return selectedServiceIds.length > 0
      case 3: return !!name && !!phone && !!plate
      default: return true
    }
  }, [step, selectedDate, selectedTime, selectedServiceIds, name, phone, plate])

  async function handleConfirm() {
    setError("")
    setSubmitting(true)

    try {
      const svcDuration = selectedServiceIds.reduce((sum, sid) => {
        const svc = services.find((s) => s.id === sid)
        return sum + (svc?.duration ?? 30)
      }, 0)
      const [selH, selM] = selectedTime.split(":").map(Number)
      const selStart = selH * 60 + selM
      const selEnd = selStart + svcDuration
      for (const b of dayBookings) {
        if (!b.booking_time) continue
        const [bH, bM] = b.booking_time.split(":").map(Number)
        const bStart = bH * 60 + bM
        let bDuration = 60
        if (b.booking_services?.length > 0) {
          bDuration = b.booking_services.reduce((sum: number, bs: any) => sum + (bs.services?.duration ?? 30), 0)
        }
        const bEnd = bStart + bDuration
        if (selStart < bEnd && selEnd > bStart) {
          setError("El horario seleccionado se solapa con otra reserva. Elige otro horario.")
          setSubmitting(false)
          return
        }
      }

      const avail = await checkAvailability(tenant.id, selectedDate, selectedTime, selectedServiceIds)
      if (!avail.available) {
        setError(avail.reason ?? "Horario no disponible")
        setSubmitting(false)
        return
      }

      let customerId: string
      let vehicleId: string | null = null

      if (existingCustomer) {
        customerId = existingCustomer.id
        if (selectedVehicleId === "new") {
          const { data: newV, error: vehErr } = await supabase
            .from("vehicles")
            .insert({ tenant_id: tenant.id, customer_id: customerId, plate: plate.toUpperCase(), brand: vehBrand.trim() || null, model: vehModel.trim() || null })
            .select()
            .single()
          if (vehErr || !newV) { setError("Error al crear vehículo"); setSubmitting(false); return }
          vehicleId = newV.id
        } else {
          vehicleId = selectedVehicleId
        }
      } else {
        const { data: customer, error: customerErr } = await supabase
          .from("customers")
          .insert({ tenant_id: tenant.id, name, phone })
          .select()
          .single()
        if (customerErr || !customer) { setError("Error al crear cliente"); setSubmitting(false); return }
        customerId = customer.id

        const { data: newV, error: vehErr } = await supabase
          .from("vehicles")
          .insert({ tenant_id: tenant.id, customer_id: customerId, plate: plate.toUpperCase(), brand: vehBrand.trim() || null, model: vehModel.trim() || null })
          .select()
          .single()
        if (vehErr || !newV) { setError("Error al crear vehículo"); setSubmitting(false); return }
        vehicleId = newV.id
      }

      const { data: newBooking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({ tenant_id: tenant.id, customer_id: customerId, vehicle_id: vehicleId, booking_date: selectedDate, booking_time: selectedTime, status: "reserved" })
        .select()
        .single()
      if (bookingErr || !newBooking) { setError("Error al crear reserva"); setSubmitting(false); return }

      const { error: bsErr } = await supabase.from("booking_services").insert(
        selectedServiceIds.map((sid) => ({ booking_id: newBooking.id, service_id: sid }))
      )
      if (bsErr) { setError("Error al guardar servicios"); setSubmitting(false); return }

      setSuccess(true)
    } catch {
      setError("Error inesperado. Intenta de nuevo.")
    }
    setSubmitting(false)
  }

  if (success) {
    const selServices = services.filter((s) => selectedServiceIds.includes(s.id))
    return (
      <div className="bg-white rounded-xl border border-border-subtil shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 sm:p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-4 animate-bounce">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold">¡Reserva confirmada!</h3>
          <p className="text-white/80 mt-1">Te enviaremos un recordatorio antes de tu visita.</p>
        </div>
        <div className="p-5 sm:p-8 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha</span>
            <span className="font-medium">{formatDateDisplay(selectedDate)} — {selectedTime} hrs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Servicios</span>
            <span className="font-medium">{selServices.map((s) => s.name).join(", ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-azul-rey">${totalPrice.toLocaleString("es-CL")}</span>
          </div>
          {tenant.deposit_enabled && (
            <div className="bg-azul-rey/5 rounded-lg p-3 mt-2 text-center">
              <p className="font-medium text-azul-rey">
                {tenant.deposit_type === "percent"
                  ? `Abono: ${tenant.deposit_value}% = $${Math.round(totalPrice * (tenant.deposit_value ?? 0) / 100).toLocaleString("es-CL")}`
                  : `Abono: $${(tenant.deposit_value ?? 0).toLocaleString("es-CL")}`}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  function formatDateDisplay(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number)
    return new Date(y, m - 1, d).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })
  }

  return (
    <div className="bg-white rounded-xl border border-border-subtil shadow-sm p-5 sm:p-8">
      <WizardProgress currentStep={step} />

      {error && <p className="text-sm text-destructive mb-4 text-center">{error}</p>}

      {/* Steps content */}
      <div key={step} className="animate-fade-in-up">
      {step === 1 && (
        <div>
          {loadingMonth ? (
            <div className="space-y-3 py-4">
              <div className="h-5 w-48 bg-bg-superficie rounded animate-pulse mx-auto" />
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-bg-superficie animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => { if (month > 0 || year > 2024) { const ny = month === 0 ? year - 1 : year; setMonth(month === 0 ? 11 : month - 1); setYear(ny) } }}
                  className="p-1.5 rounded-lg hover:bg-bg-superficie transition-colors"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-semibold text-sm">
                  {new Date(year, month).toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={() => { const ny = month === 11 ? year + 1 : year; setMonth(month === 11 ? 0 : month + 1); setYear(ny) }}
                  className="p-1.5 rounded-lg hover:bg-bg-superficie transition-colors"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
                  <span key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const isSelected = day.date === selectedDate
                  const clickable = day.isCurrentMonth && day.isAvailable && !day.isPast
                  return (
                    <button
                      key={i}
                      disabled={!clickable}
                      onClick={() => {
                        if (clickable) {
                          setSelectedDate(day.date)
                          setSelectedTime("")
                        }
                      }}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                        isSelected
                          ? "bg-azul-rey text-white"
                          : clickable
                            ? "hover:bg-azul-rey/10 cursor-pointer text-foreground"
                            : "text-muted-foreground/40 cursor-default"
                      } ${day.isToday && !isSelected ? "ring-1 ring-azul-rey/30" : ""}`}
                    >
                      {day.dayOfMonth}
                    </button>
                  )
                })}
              </div>

              {selectedDate && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-azul-rey" />
                    Horas disponibles — {formatDateDisplay(selectedDate)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin horas disponibles este día</p>
                    ) : (
                      availableSlots.map((slot) => {
                        const isSlotSelected = slot === selectedTime
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              isSlotSelected
                                ? "border-azul-rey bg-azul-rey/10 text-azul-rey"
                                : "border-border-subtil hover:border-azul-rey/40 text-foreground"
                            }`}
                          >
                            {slot}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div>
          <p className="text-sm font-medium mb-4">Selecciona los servicios que necesitas</p>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {services.map((s) => {
              const checked = selectedServiceIds.includes(s.id)
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked ? "border-azul-rey/40 bg-azul-rey/5" : "border-border-subtil hover:border-border-medio"
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleService(s)} className="h-4 w-4 accent-azul-rey" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{s.name}</span>
                    {s.duration && <span className="text-xs text-muted-foreground ml-2">{s.duration} min</span>}
                  </div>
                  {s.price && <span className="text-sm font-semibold whitespace-nowrap text-azul-rey">${s.price.toLocaleString("es-CL")}</span>}
                </label>
              )
            })}
          </div>
          {selectedServiceIds.length > 0 && (
            <div className="flex justify-between text-sm font-medium pt-3 mt-3 border-t border-border-subtil text-muted-foreground">
              <span>{totalDuration > 0 && `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}min`}</span>
              <span className="text-foreground">Total: <span className="text-azul-rey font-bold">${totalPrice.toLocaleString("es-CL")}</span></span>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Customer Data */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="wiz-name">Nombre *</Label>
            <Input id="wiz-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="wiz-phone">Teléfono *</Label>
            <Input id="wiz-phone" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => handlePhoneBlur(phone)} placeholder="+56 9 XXXX XXXX" type="tel" required className="mt-1" />
          </div>
          {existingCustomer && customerVehicles.length > 0 && (
            <div>
              <Label>Vehículo</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {customerVehicles.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate}{v.brand ? ` — ${v.brand}` : ""}{v.model ? ` ${v.model}` : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Agregar otro vehículo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {(selectedVehicleId === "new" || !existingCustomer) && (
            <div>
              <Label>Patente *</Label>
              <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Ej: ABC123" required className="mt-1" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input value={vehBrand} onChange={(e) => setVehBrand(e.target.value)} placeholder="Marca (opcional)" />
                <Input value={vehModel} onChange={(e) => setVehModel(e.target.value)} placeholder="Modelo (opcional)" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div>
          <div className="bg-bg-concreto rounded-lg p-4 space-y-2 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium">{formatDateDisplay(selectedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora</span>
              <span className="font-medium">{selectedTime} hrs</span>
            </div>
            <div className="border-t border-border-subtil pt-2 mt-2">
              <p className="text-muted-foreground mb-1">Servicios ({selectedServiceIds.length})</p>
              {services.filter((s) => selectedServiceIds.includes(s.id)).map((s) => (
                <div key={s.id} className="flex justify-between text-xs ml-2">
                  <span>{s.name}</span>
                  {s.price && <span>${s.price.toLocaleString("es-CL")}</span>}
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold border-t border-border-subtil pt-2">
              <span>Total</span>
              <span className="text-azul-rey">${totalPrice.toLocaleString("es-CL")}</span>
            </div>
            <div className="border-t border-border-subtil pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehículo</span>
                <span className="font-medium">{plate.toUpperCase()}{vehBrand ? ` — ${vehBrand}` : ""}</span>
              </div>
            </div>
          </div>

          {tenant.deposit_enabled && (
            <div className="bg-azul-rey/5 border border-azul-rey/20 rounded-lg p-4 mb-5">
              <p className="text-sm font-semibold text-azul-rey mb-1">Abono requerido</p>
              <p className="text-sm text-muted-foreground">
                {tenant.deposit_type === "percent"
                  ? `${tenant.deposit_value}% del total = $${Math.round(totalPrice * (tenant.deposit_value ?? 0) / 100).toLocaleString("es-CL")}`
                  : `$${(tenant.deposit_value ?? 0).toLocaleString("es-CL")}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">El pago se coordina con el taller.</p>
            </div>
          )}
        </div>
      )}

      {step === 4 && tenant.phone && (
        <a
          href={`https://wa.me/${tenant.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
            `Hola, quiero confirmar mi hora en ${tenant.name} del ${selectedDate} a las ${selectedTime} para ${services.filter((s) => selectedServiceIds.includes(s.id)).map((s) => s.name).join(", ")}.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-green-600 text-green-700 font-medium text-sm hover:bg-green-50 transition-colors"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Confirmar por WhatsApp
        </a>
      )}

      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t border-border-subtil">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="text-sm">
          ← Atrás
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="text-sm bg-azul-rey hover:bg-celeste-cielo transition-colors">
            Siguiente →
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={submitting} className={`text-sm bg-azul-rey hover:bg-celeste-cielo transition-colors ${submitting ? "pointer-events-none" : ""}`}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Reservando...</> : "✓ Confirmar Reserva"}
          </Button>
        )}
      </div>
    </div>
  )
}
