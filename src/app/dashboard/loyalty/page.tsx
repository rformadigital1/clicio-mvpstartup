"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Gift, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog } from "@/components/ui/alert-dialog"
import type { LoyaltyRule, Customer } from "@/lib/types"

export default function LoyaltyPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [rules, setRules] = useState<LoyaltyRule[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

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

    if (profileErr || !profile) { toast({ title: "Error", description: profileErr?.message, variant: "destructive" }); return }
    setTenantId(profile.tenant_id)

    const [rRes, cRes] = await Promise.all([
      supabase.from("loyalty_rules").select("*").eq("tenant_id", profile.tenant_id),
      supabase.from("customers").select("*").eq("tenant_id", profile.tenant_id).order("name"),
    ])

    if (rRes.error) toast({ title: "Error al cargar reglas", variant: "destructive" })
    if (cRes.error) toast({ title: "Error al cargar clientes", variant: "destructive" })
    setRules(rRes.data ?? [])
    setCustomers(cRes.data ?? [])
    setLoading(false)
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

    if (error) { toast({ title: "Error al crear regla", description: error.message, variant: "destructive" }); return }
    toast({ title: "Regla creada" })
    setDialogOpen(false)
    loadData()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("loyalty_rules").delete().eq("id", id)
    if (error) { toast({ title: "Error al eliminar", description: error.message, variant: "destructive" }); return }
    toast({ title: "Regla eliminada" })
    loadData()
  }

  async function handleClaimReward(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const customerId = form.get("customer_id") as string
    const ruleId = form.get("rule_id") as string

    const rule = rules.find((r) => r.id === ruleId)
    const customer = customers.find((c) => c.id === customerId)
    if (!rule || !customer) { toast({ title: "Error", variant: "destructive" }); return }
    if (customer.stamps < rule.required_stamps) { toast({ title: "El cliente no tiene suficientes sellos", variant: "destructive" }); return }

    const { error } = await supabase
      .from("customers")
      .update({ stamps: customer.stamps - rule.required_stamps })
      .eq("id", customerId)

    if (error) { toast({ title: "Error al canjear", description: error.message, variant: "destructive" }); return }
    toast({ title: `Premio canjeado: ${rule.reward_name}` })
    setClaimDialogOpen(false)
    loadData()
  }

  const eligibleCustomers = customers.filter((c) =>
    rules.some((r) => c.stamps >= r.required_stamps)
  )

  if (loading) return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 max-w-lg mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-48" />
          </div>
        ))}
      </div>
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fidelización</h1>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={eligibleCustomers.length === 0}>
                <Gift className="mr-1 h-4 w-4" /> Canjear Premio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Canjear Premio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleClaimReward} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Cliente</Label>
                  <Select name="customer_id" required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.stamps} sellos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule_id">Premio</Label>
                  <Select name="rule_id" required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar premio" /></SelectTrigger>
                    <SelectContent>
                      {rules.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.reward_name} ({r.required_stamps} sellos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Canjear</Button>
              </form>
            </DialogContent>
          </Dialog>

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
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-lg mb-8">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <CardTitle className="text-base">{rule.reward_name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: rule.id, name: rule.reward_name })}>
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
          <div className="col-span-full text-center py-12">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium mb-1">Sin reglas de fidelización</p>
            <p className="text-sm text-muted-foreground mb-2">Crea tu primera regla, ej: 5 sellos = Lavado gratis</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>Crear Regla</Button>
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-4">Clientes con sellos</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {customers.filter((c) => c.stamps > 0).map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.plate}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{c.stamps}</p>
                <p className="text-xs text-muted-foreground">sellos</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {customers.filter((c) => c.stamps > 0).length === 0 && (
          <div className="col-span-full text-center py-8">
            <Star className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Sin sellos entregados aún</p>
            <p className="text-sm text-muted-foreground mt-1">Los sellos se asignan automáticamente al marcar una reserva como "Entregado".</p>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Eliminar regla"
        description={`¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={() => { handleDelete(deleteTarget!.id); setDeleteTarget(null) }}
      />
    </div>
  )
}
