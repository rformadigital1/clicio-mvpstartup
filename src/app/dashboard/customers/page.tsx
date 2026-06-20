"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Customer } from "@/lib/types"

export default function CustomersPage() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
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
      .from("customers")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })

    setCustomers(data ?? [])
  }

  async function handleAddCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId) return

    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from("customers").insert({
      tenant_id: tenantId,
      name: form.get("name") as string,
      phone: form.get("phone") as string,
      plate: form.get("plate") as string,
      vehicle: form.get("vehicle") as string,
    })

    if (!error) {
      setDialogOpen(false)
      loadCustomers()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plate">Patente</Label>
                <Input id="plate" name="plate" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehículo</Label>
                <Input id="vehicle" name="vehicle" />
              </div>
              <Button type="submit" className="w-full">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <CardTitle className="text-base">{customer.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
              {customer.plate && <p className="text-muted-foreground">Patente: {customer.plate}</p>}
              {customer.vehicle && <p className="text-muted-foreground">Vehículo: {customer.vehicle}</p>}
              <p className="font-medium mt-2">Sellos: {customer.stamps} ⭐</p>
            </CardContent>
          </Card>
        ))}
        {customers.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">No hay clientes registrados</p>
        )}
      </div>
    </div>
  )
}
