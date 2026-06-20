"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import type { LoyaltyRule } from "@/lib/types"

export default function LoyaltyPage() {
  const supabase = createClient()
  const [rules, setRules] = useState<LoyaltyRule[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  async function loadRules() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile) return
    setTenantId(profile.tenant_id)

    const { data } = await supabase
      .from("loyalty_rules")
      .select("*")
      .eq("tenant_id", profile.tenant_id)

    setRules(data ?? [])
  }

  async function handleAddRule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId) return

    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from("loyalty_rules").insert({
      tenant_id: tenantId,
      required_stamps: parseInt(form.get("stamps") as string),
      reward_name: form.get("reward") as string,
    })

    if (!error) {
      setDialogOpen(false)
      loadRules()
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("loyalty_rules").delete().eq("id", id)
    loadRules()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fidelización</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nueva Regla</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Regla de Fidelización</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stamps">Sellos requeridos</Label>
                <Input id="stamps" name="stamps" type="number" required defaultValue={5} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward">Premio</Label>
                <Input id="reward" name="reward" required placeholder="Ej: Lavado gratis" />
              </div>
              <Button type="submit" className="w-full">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-lg">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <CardTitle className="text-base">{rule.reward_name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{rule.required_stamps} sellos requeridos</p>
              <p className="mt-2 text-2xl">
                {Array.from({ length: rule.required_stamps }).map((_, i) => "⭐").join("")}
              </p>
            </CardContent>
          </Card>
        ))}
        {rules.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Sin reglas de fidelización configuradas</p>
            <p className="text-sm text-muted-foreground mt-1">Ej: 5 sellos = Lavado gratis</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Cómo funciona</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>1. Cada servicio completado suma 1 sello al cliente.</p>
          <p>2. Cuando el cliente alcanza los sellos requeridos, canjea su premio.</p>
          <p>3. Los sellos se reinician al canjear.</p>
        </div>
      </div>
    </div>
  )
}
