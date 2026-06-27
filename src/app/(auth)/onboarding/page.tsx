"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToastProvider, useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Check, ChevronRight, Car, Clock, Settings } from "lucide-react"
import Link from "next/link"

const STEPS = [
  { id: 1, label: "Tu taller", icon: Settings },
  { id: 2, label: "Servicios", icon: Car },
  { id: 3, label: "Horarios", icon: Clock },
]

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export default function OnboardingPage() {
  return <ToastProvider><OnboardingWizard /><Toaster /></ToastProvider>
}

function OnboardingWizard() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [addingService, setAddingService] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Step 1 - Shop info
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [slug, setSlug] = useState("")

  // Step 2 - Services
  const [services, setServices] = useState<any[]>([])
  const [svcName, setSvcName] = useState("")
  const [svcPrice, setSvcPrice] = useState("")
  const [svcDuration, setSvcDuration] = useState("")

  // Step 3 - Hours
  const [hours, setHours] = useState<any[]>([])

  useEffect(() => { loadTenant() }, [])

  async function loadTenant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/signin"); return }
    const { data: profile } = await supabase.from("profiles").select("tenant_id, role").eq("id", user.id).single()
    if (!profile) { router.push("/signin"); return }
    if (profile.role !== "owner") { router.push("/dashboard"); return }
    setTenantId(profile.tenant_id)

    const { data: t } = await supabase.from("tenants").select("*").eq("id", profile.tenant_id).single()
    if (t) { setName(t.name); setAddress(t.address ?? ""); setPhone(t.phone ?? ""); setEmail(t.email ?? ""); setSlug(t.slug) }

    // Load existing services (if any) and hours
    const [svcRes, hrsRes] = await Promise.all([
      supabase.from("services").select("*").eq("tenant_id", profile.tenant_id).order("name"),
      supabase.from("business_hours").select("*").eq("tenant_id", profile.tenant_id).order("day_of_week"),
    ])
    if (svcRes.data) setServices(svcRes.data)
    if (hrsRes.data && hrsRes.data.length > 0) {
      setHours(hrsRes.data)
    } else {
      setHours(DAY_NAMES.map((_, i) => ({
        id: "", day_of_week: i, open_time: "09:00", close_time: "18:00", is_open: i !== 0,
      })))
    }
  }

  async function handleSaveStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) return
    setLoading(true)
    const { error } = await supabase.from("tenants").update({ name, address, phone, email, slug }).eq("id", tenantId)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setLoading(false); return }
    toast({ title: "Taller actualizado" })
    setLoading(false)
    setStep(2)
  }

  async function handleAddService() {
    if (!tenantId || !svcName.trim() || addingService) return
    setAddingService(true)
    const { error } = await supabase.from("services").insert({
      tenant_id: tenantId, name: svcName, price: parseInt(svcPrice) || null, duration: parseInt(svcDuration) || null,
    })
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setAddingService(false); return }
    setSvcName(""); setSvcPrice(""); setSvcDuration("")
    setAddingService(false)
    const { data } = await supabase.from("services").select("*").eq("tenant_id", tenantId).order("name")
    setServices(data ?? [])
  }

  async function handleSaveStep3() {
    if (!tenantId) return
    setLoading(true)
    for (const h of hours) {
      await supabase.from("business_hours").upsert({
        id: h.id || undefined, tenant_id: tenantId, day_of_week: h.day_of_week,
        open_time: h.open_time, close_time: h.close_time, is_open: h.is_open,
      })
    }
    toast({ title: "Configuración completa" })
    setLoading(false)
    router.push("/dashboard")
  }

  function updateHour(dow: number, field: string, value: any) {
    setHours(hours.map((h) => h.day_of_week === dow ? { ...h, [field]: value } : h))
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold">CLICIO</Link>
          <h1 className="text-2xl font-bold mt-4">Configura tu taller</h1>
          <p className="text-muted-foreground mt-1">Completa estos pasos para empezar a recibir reservas.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                step === s.id ? "bg-primary text-primary-foreground" :
                step > s.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
                {step > s.id && <Check className="h-3.5 w-3.5" />}
              </div>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Shop Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Información del taller</CardTitle>
              <CardDescription>Tus clientes verán estos datos en tu sitio público.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del taller</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL del taller</Label>
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} pattern="[a-z0-9-]+" />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}><ChevronRight className="mr-1 h-4 w-4" /> Continuar</Button>
                  <Button type="button" variant="ghost" onClick={() => router.push("/dashboard")}>Saltar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Services */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Servicios</CardTitle>
              <CardDescription>Agrega los servicios que ofreces a tus clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Servicio</Label>
                  <Input placeholder="Cambio de aceite" value={svcName} onChange={(e) => setSvcName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Precio $</Label>
                  <Input type="number" placeholder="29990" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duración min</Label>
                  <Input type="number" placeholder="60" value={svcDuration} onChange={(e) => setSvcDuration(e.target.value)} />
                </div>
              </div>
              <Button variant="outline" onClick={handleAddService} disabled={!svcName.trim() || addingService} className="w-full">
                Agregar Servicio
              </Button>

              {services.length > 0 && (
                <div className="divide-y">
                  {services.map((s: any) => (
                    <div key={s.id} className="flex justify-between py-2 text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">
                        {s.price ? `$${s.price.toLocaleString("es-CL")}` : ""}
                        {s.duration ? ` · ${s.duration}min` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setStep(3)}>
                  {services.length > 0 ? <><ChevronRight className="mr-1 h-4 w-4" /> Continuar</> : "Omitir y continuar"}
                </Button>
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>Saltar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Hours */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Horarios de atención</CardTitle>
              <CardDescription>Configura los días y horarios en que atiendes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hours.map((h: any) => (
                <div key={h.day_of_week} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={h.is_open}
                    onChange={(e) => updateHour(h.day_of_week, "is_open", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className={`w-24 text-sm ${!h.is_open ? "line-through text-muted-foreground" : ""}`}>
                    {DAY_NAMES[h.day_of_week]}
                  </span>
                  <Input
                    type="time"
                    value={h.open_time}
                    onChange={(e) => updateHour(h.day_of_week, "open_time", e.target.value)}
                    disabled={!h.is_open}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">a</span>
                  <Input
                    type="time"
                    value={h.close_time}
                    onChange={(e) => updateHour(h.day_of_week, "close_time", e.target.value)}
                    disabled={!h.is_open}
                    className="w-32"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSaveStep3} disabled={loading}>
                  {loading ? "Guardando..." : "Finalizar configuración"}
                </Button>
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>Saltar</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
