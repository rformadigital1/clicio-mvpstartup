"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Copy, Check } from "lucide-react"
import type { Tenant } from "@/lib/types"

export default function SettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [saving, setSaving] = useState(false)
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const [slugChanged, setSlugChanged] = useState(false)
  const [newSlug, setNewSlug] = useState("")

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

    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .single()

    if (data) {
      setTenant(data)
      setNewSlug(data.slug)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenant) return
    setSaving(true)

    const form = new FormData(e.currentTarget)
    const updateData: Record<string, string> = {
      name: form.get("name") as string,
      address: form.get("address") as string,
      phone: form.get("phone") as string,
      email: form.get("email") as string,
      slug: form.get("slug") as string,
    }

    const { error } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", tenant.id)

    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Cambios guardados" })
      setTenant({ ...tenant, ...updateData })
      setSlugChanged(false)
    }
    setSaving(false)
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
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="slug">URL del sitio público</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="slug"
                    name="slug"
                    value={newSlug}
                    onChange={(e) => { setNewSlug(e.target.value); setSlugChanged(true) }}
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
          <p className="text-xs text-muted-foreground mt-2">
            Si cambias el slug, la URL cambiará inmediatamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
