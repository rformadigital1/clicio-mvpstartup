"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useRole } from "@/app/dashboard/layout"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Trash2, Car, Plus, ExternalLink } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import type { Customer, Vehicle } from "@/lib/types"
import Link from "next/link"

export default function CustomersPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const roleInfo = useRole()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [vehicleCustomerId, setVehicleCustomerId] = useState<string | null>(null)
  const [vehPlate, setVehPlate] = useState("")
  const [vehBrand, setVehBrand] = useState("")
  const [vehModel, setVehModel] = useState("")
  const [vehYear, setVehYear] = useState("")

  useEffect(() => { loadCustomers() }, [])

  async function loadCustomers() {
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) { toast({ title: "Error de autenticación", variant: "destructive" }); return }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()
    if (profileErr || !profile) { toast({ title: "Error al cargar perfil", description: profileErr?.message, variant: "destructive" }); return }
    setTenantId(profile.tenant_id)

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })

    if (error) toast({ title: "Error al cargar clientes", description: error.message, variant: "destructive" })
    setCustomers(data ?? [])

    const { data: vehData } = await supabase
      .from("vehicles")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
    setVehicles(vehData ?? [])
    setLoading(false)
  }

  async function handleAddCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId) { toast({ title: "Error", description: "Tenant no encontrado", variant: "destructive" }); return }

    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from("customers").insert({
      tenant_id: tenantId,
      name: form.get("name") as string,
      phone: form.get("phone") as string,
      plate: form.get("plate") as string,
      vehicle: form.get("vehicle") as string,
    })

    if (error) { toast({ title: "Error al crear cliente", description: error.message, variant: "destructive" }); return }
    toast({ title: "Cliente creado" })
    setDialogOpen(false)
    loadCustomers()
  }

  function resetVehicleForm() {
    setVehPlate(""); setVehBrand(""); setVehModel(""); setVehYear("")
  }

  async function handleAddVehicle() {
    if (!tenantId || !vehicleCustomerId || !vehPlate.trim()) {
      toast({ title: "Error", description: "La patente es obligatoria", variant: "destructive" })
      return
    }
    const { error } = await supabase.from("vehicles").insert({
      tenant_id: tenantId,
      customer_id: vehicleCustomerId,
      plate: vehPlate.trim().toUpperCase(),
      brand: vehBrand.trim() || null,
      model: vehModel.trim() || null,
      year: vehYear ? parseInt(vehYear) : null,
    })
    if (error) { toast({ title: "Error al agregar vehículo", description: error.message, variant: "destructive" }); return }
    toast({ title: "Vehículo agregado" })
    setVehicleDialogOpen(false)
    resetVehicleForm()
    loadCustomers()
  }

  async function handleDeleteVehicle(vehId: string) {
    const { error } = await supabase.from("vehicles").delete().eq("id", vehId)
    if (error) { toast({ title: "Error al eliminar vehículo", description: error.message, variant: "destructive" }); return }
    toast({ title: "Vehículo eliminado" })
    loadCustomers()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("customers").delete().eq("id", id)
    if (error) { toast({ title: "Error al eliminar", description: error.message, variant: "destructive" }); return }
    toast({ title: "Cliente eliminado" })
    loadCustomers()
  }

  const filteredCustomers = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone?.toLowerCase() ?? "").includes(q) ||
      (c.plate?.toLowerCase() ?? "").includes(q)
    )
  }, [customers, search])

  if (loading) return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="Clientes">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Cliente</Button>
          </DialogTrigger>
          <DialogContent size="sm">
            <DialogHeader><DialogTitle>Nuevo Cliente</DialogTitle></DialogHeader>
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
      </PageHeader>

      {/* Search */}
      <div className="max-w-sm mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o patente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Results */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium mb-1">No hay clientes</p>
          <p className="text-sm text-muted-foreground mb-4">
            {customers.length === 0
              ? "Registra tu primer cliente para comenzar."
              : "Ningún cliente coincide con la búsqueda."}
          </p>
          {customers.length === 0 && (
            <Button onClick={() => setDialogOpen(true)}>Nuevo Cliente</Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">{filteredCustomers.length} clientes</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-base">{customer.name}</CardTitle>
                  {roleInfo?.isOwner && (
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: customer.id, name: customer.name })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Vehículos</span>
                    <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => { setVehicleCustomerId(customer.id); setVehicleDialogOpen(true) }}>
                      <Plus className="h-3 w-3 mr-1" /> Agregar
                    </Button>
                  </div>
                  {vehicles.filter(v => v.customer_id === customer.id).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sin vehículos registrados</p>
                  ) : (
                    <div className="space-y-1">
                      {vehicles.filter(v => v.customer_id === customer.id).map(v => (
                        <div key={v.id} className="flex items-center justify-between group">
                          <Link href={`/dashboard/vehicles/${v.id}`} className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors">
                            <Car className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{v.plate}</span>
                            {v.brand && <span className="text-muted-foreground">{v.brand}</span>}
                            {v.model && <span className="text-muted-foreground">{v.model}</span>}
                            {v.year && <span className="text-muted-foreground">({v.year})</span>}
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          {roleInfo?.isOwner && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteVehicle(v.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Eliminar cliente"
        description={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={() => { handleDelete(deleteTarget!.id); setDeleteTarget(null) }}
      />

      <Dialog open={vehicleDialogOpen} onOpenChange={(open) => { setVehicleDialogOpen(open); if (!open) resetVehicleForm() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar vehículo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patente *</Label>
              <Input value={vehPlate} onChange={(e) => setVehPlate(e.target.value)} placeholder="Ej: ABC123" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={vehBrand} onChange={(e) => setVehBrand(e.target.value)} placeholder="Ej: Toyota" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input value={vehModel} onChange={(e) => setVehModel(e.target.value)} placeholder="Ej: Corolla" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Input value={vehYear} onChange={(e) => setVehYear(e.target.value)} type="number" placeholder="Ej: 2020" />
            </div>
            <Button onClick={handleAddVehicle} className="w-full">Guardar vehículo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
