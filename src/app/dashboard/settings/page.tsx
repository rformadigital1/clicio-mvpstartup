"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { StaffSection } from "./staff-section"
import { GallerySection } from "./gallery-section"
import { Copy, Check, Plus, X, Upload, Trash2 } from "lucide-react"
import type { Tenant, BusinessHour, BlockedDate } from "@/lib/types"

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export default function SettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [hours, setHours] = useState<BusinessHour[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [saving, setSaving] = useState(false)
  const [savingHours, setSavingHours] = useState(false)
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const [newSlug, setNewSlug] = useState("")
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
    loadTenant()
  }, [])

  async function loadTenant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile) return

    const { data: tData } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .single()

    if (tData) {
      setTenant(tData)
      setNewSlug(tData.slug)
    }

    const [hRes, bRes] = await Promise.all([
      supabase.from("business_hours").select("*").eq("tenant_id", profile.tenant_id).order("day_of_week"),
      supabase.from("blocked_dates").select("*").eq("tenant_id", profile.tenant_id).order("date"),
    ])

    if (hRes.data) {
      if (hRes.data.length === 0) {
        setHours(DAY_NAMES.map((_, i) => ({
          id: "",
          tenant_id: profile.tenant_id,
          day_of_week: i,
          open_time: "09:00",
          close_time: "18:00",
          is_open: i !== 0,
        })))
      } else {
        setHours(hRes.data)
      }
    }
    if (bRes.data) setBlockedDates(bRes.data)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenant) return
    setSaving(true)

    const form = new FormData(e.currentTarget)
    const { error } = await supabase
      .from("tenants")
      .update({
        name: form.get("name") as string,
        address: form.get("address") as string,
        phone: form.get("phone") as string,
        email: form.get("email") as string,
        slug: form.get("slug") as string,
      })
      .eq("id", tenant.id)

    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Cambios guardados" })
      setTenant({ ...tenant, name: form.get("name") as string, slug: form.get("slug") as string })
    }
    setSaving(false)
  }

  async function handleSaveHours() {
    if (!tenant) return
    setSavingHours(true)
    for (const h of hours) {
      await supabase.from("business_hours").upsert({
        id: h.id || undefined,
        tenant_id: tenant.id,
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
        is_open: h.is_open,
      }).select()
    }
    toast({ title: "Horarios guardados" })
    setSavingHours(false)
  }

  async function handleAddBlockedDate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenant) return
    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from("blocked_dates").insert({
      tenant_id: tenant.id,
      date: form.get("date") as string,
      reason: form.get("reason") as string,
    })
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    setBlockDialogOpen(false)
    toast({ title: "Fecha bloqueada" })
    loadTenant()
  }

  async function handleRemoveBlockedDate(id: string) {
    await supabase.from("blocked_dates").delete().eq("id", id)
    loadTenant()
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!tenant || !e.target.files?.[0]) return
    setUploadingLogo(true)
    const file = e.target.files[0]
    const ext = file.name.split(".").pop()
    const filePath = `${tenant.id}/logo.${ext}`

    const { error: uploadErr } = await supabase.storage.from("logos").upload(filePath, file, { upsert: true })
    if (uploadErr) {
      toast({ title: "Error al subir logo", description: uploadErr.message, variant: "destructive" })
      setUploadingLogo(false)
      return
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath)
    const logoUrl = urlData.publicUrl

    if (!logoUrl.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
      toast({ title: "Error", description: "URL de logo inválida", variant: "destructive" })
      setUploadingLogo(false)
      return
    }

    const { error: updateErr } = await supabase.from("tenants").update({ logo_url: logoUrl }).eq("id", tenant.id)
    if (updateErr) {
      toast({ title: "Error al guardar logo", description: updateErr.message, variant: "destructive" })
    } else {
      setTenant({ ...tenant, logo_url: logoUrl })
      toast({ title: "Logo actualizado" })
    }
    setUploadingLogo(false)
  }

  async function handleRemoveLogo() {
    if (!tenant || !tenant.logo_url) return
    await supabase.from("tenants").update({ logo_url: null }).eq("id", tenant.id)
    setTenant({ ...tenant, logo_url: null })
    toast({ title: "Logo eliminado" })
  }

  async function copyUrl() {
    if (!tenant) return
    const url = `${origin}/${tenant.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Error al copiar", variant: "destructive" })
    }
  }

  function updateHour(dow: number, field: keyof BusinessHour, value: BusinessHour[keyof BusinessHour]) {
    setHours(hours.map((h) => h.day_of_week === dow ? { ...h, [field]: value } : h))
  }

  if (!tenant) return null

  const publicUrl = `${origin}/${tenant.slug}`

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Configuración del Taller</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información del Taller</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del taller</Label>
              <Input id="name" name="name" defaultValue={tenant.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={tenant.address ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={tenant.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={tenant.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Logo del taller</Label>
              <div className="flex items-center gap-4">
                {tenant.logo_url ? (
                  <>
                    <img src={tenant.logo_url} alt="Logo" className="h-16 w-16 object-contain rounded border" />
                    <Button type="button" variant="ghost" size="icon" onClick={handleRemoveLogo}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="h-16 w-16 rounded border border-dashed flex items-center justify-center text-muted-foreground text-xs">
                    Sin logo
                  </div>
                )}
                <div>
                  <Button type="button" variant="outline" size="sm" disabled={uploadingLogo} asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-1" />
                      {uploadingLogo ? "Subiendo..." : "Subir logo"}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG o WebP. Máx 2MB.</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="slug">URL del sitio público</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="slug"
                    name="slug"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    required
                    pattern="[a-z0-9-]+"
                    title="Solo letras minúsculas, números y guiones"
                  />
                </div>
                <Button type="button" variant="outline" size="icon" onClick={copyUrl} title="Copiar URL">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{publicUrl}</p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Horarios de Atención</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hours.map((h) => (
            <div key={h.day_of_week} className="flex items-center gap-3">
              <Switch
                checked={h.is_open}
                onCheckedChange={(v) => updateHour(h.day_of_week, "is_open", v)}
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
          <Button onClick={handleSaveHours} disabled={savingHours}>
            {savingHours ? "Guardando..." : "Guardar horarios"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fechas Bloqueadas</CardTitle>
          <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Bloquear fecha</DialogTitle></DialogHeader>
              <form onSubmit={handleAddBlockedDate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label>Motivo (opcional)</Label>
                  <Input name="reason" placeholder="Ej: Feriado" />
                </div>
                <Button type="submit" className="w-full">Bloquear</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay fechas bloqueadas</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((bd) => (
                <div key={bd.id} className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-sm font-medium">{bd.date}</span>
                    {bd.reason && <span className="text-sm text-muted-foreground ml-2">— {bd.reason}</span>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveBlockedDate(bd.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tu sitio público</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Comparte este enlace para que tus clientes agenden online:
          </p>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-sm break-all">{publicUrl}</code>
            <Button variant="ghost" size="icon" onClick={copyUrl}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <GallerySection />

      <StaffSection />
    </div>
  )
}
