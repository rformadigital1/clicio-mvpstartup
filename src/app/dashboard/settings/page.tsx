"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Tenant } from "@/lib/types"

export default function SettingsPage() {
  const supabase = createClient()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
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

    setTenant(data)
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
      })
      .eq("id", tenant.id)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (!tenant) return null

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
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>URL del sitio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tu sitio web público:
          </p>
          <p className="mt-1 font-mono text-sm">
            taller.clicio.cl/{tenant.slug}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
