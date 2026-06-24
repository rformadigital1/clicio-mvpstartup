"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Copy, Check, Upload, Trash2 } from "lucide-react"
import type { Tenant } from "@/lib/types"

export default function TallerPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [saving, setSaving] = useState(false)
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const [newSlug, setNewSlug] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
    loadTenant()
  }, [])

  async function loadTenant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return
    const { data: tData } = await supabase.from("tenants").select("*").eq("id", profile.tenant_id).single()
    if (tData) { setTenant(tData); setNewSlug(tData.slug) }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenant) return
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from("tenants").update({
      name: form.get("name") as string,
      address: form.get("address") as string,
      phone: form.get("phone") as string,
      email: form.get("email") as string,
      instagram: form.get("instagram") as string,
      slug: form.get("slug") as string,
    }).eq("id", tenant.id)
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Cambios guardados" })
      setTenant({ ...tenant, name: form.get("name") as string, slug: form.get("slug") as string })
    }
    setSaving(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!tenant || !e.target.files?.[0]) return
    const file = e.target.files[0]
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "El logo debe pesar máximo 2MB", variant: "destructive" })
      e.target.value = ""; return
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast({ title: "Formato no soportado", description: "Usa PNG, JPG o WebP", variant: "destructive" })
      e.target.value = ""; return
    }
    setUploadingLogo(true)
    const ext = file.name.split(".").pop()
    const filePath = `${tenant.id}/logo.${ext}`
    const { error: uploadErr } = await supabase.storage.from("logos").upload(filePath, file, { contentType: file.type, upsert: true })
    if (uploadErr) { toast({ title: "Error al subir logo", description: uploadErr.message, variant: "destructive" }); setUploadingLogo(false); return }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath)
    const logoUrl = urlData.publicUrl
    const { error: updateErr } = await supabase.from("tenants").update({ logo_url: logoUrl }).eq("id", tenant.id)
    if (updateErr) { toast({ title: "Error al guardar logo", description: updateErr.message, variant: "destructive" }) }
    else { setTenant({ ...tenant, logo_url: logoUrl }); toast({ title: "Logo actualizado" }) }
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
    try {
      await navigator.clipboard.writeText(`${origin}/${tenant.slug}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { toast({ title: "Error al copiar", variant: "destructive" }) }
  }

  if (!tenant) return null
  const publicUrl = `${origin}/${tenant.slug}`

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Información del Taller</h1>

      <Card>
        <CardHeader><CardTitle>Datos del taller</CardTitle></CardHeader>
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
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" name="instagram" defaultValue={tenant.instagram ?? ""} placeholder="https://instagram.com/tucuenta" />
            </div>
            <div className="space-y-2">
              <Label>Logo del taller</Label>
              <div className="flex items-center gap-4">
                {tenant.logo_url ? (
                  <>
                    <img src={tenant.logo_url} alt="Logo" className="h-16 w-16 object-contain rounded border" />
                    <Button type="button" variant="ghost" size="icon" onClick={handleRemoveLogo}><Trash2 className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <div className="h-16 w-16 rounded border border-dashed flex items-center justify-center text-muted-foreground text-xs">Sin logo</div>
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
                <Input id="slug" name="slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required pattern="[a-z0-9-]+" title="Solo letras minúsculas, números y guiones" className="flex-1" />
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
    </div>
  )
}
