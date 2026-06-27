"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Car } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/ui/page-header"
import type { Service } from "@/lib/types"

export default function ServicesPage() {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; refCount: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
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
      .from("services")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at")

    if (error) toast({ title: "Error al cargar servicios", description: error.message, variant: "destructive" })
    setServices(data ?? [])
    setLoading(false)
  }

  async function handleAddService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId) { toast({ title: "Error", description: "Tenant no encontrado", variant: "destructive" }); return }

    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from("services").insert({
      tenant_id: tenantId,
      name: form.get("name") as string,
      price: parseInt(form.get("price") as string) || null,
      duration: parseInt(form.get("duration") as string) || null,
    })

    if (error) { toast({ title: "Error al crear servicio", description: error.message, variant: "destructive" }); return }
    toast({ title: "Servicio creado" })
    setDialogOpen(false)
    loadServices()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("services").delete().eq("id", id)
    if (error) { toast({ title: "Error al eliminar", description: error.message, variant: "destructive" }); return }
    toast({ title: "Servicio eliminado" })
    loadServices()
  }

  async function promptDelete(id: string, name: string) {
    const { count } = await supabase
      .from("booking_services")
      .select("*", { count: "exact", head: true })
      .eq("service_id", id)
    setDeleteTarget({ id, name, refCount: count ?? 0 })
  }

  if (loading) return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="Servicios">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Servicio</Button>
          </DialogTrigger>

          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Nuevo Servicio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddService} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" required placeholder="Ej: Cambio de aceite" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio ($)</Label>
                <Input id="price" name="price" type="number" placeholder="Ej: 29990" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input id="duration" name="duration" type="number" placeholder="Ej: 60" />
              </div>
              <Button type="submit" className="w-full">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <CardTitle className="text-base">{service.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => promptDelete(service.id, service.name)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {service.price && <p className="text-muted-foreground">$ {service.price.toLocaleString("es-CL")}</p>}
              {service.duration && <p className="text-muted-foreground">{service.duration} min</p>}
            </CardContent>
          </Card>
        ))}
        {services.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium mb-1">No hay servicios</p>
            <p className="text-sm text-muted-foreground mb-4">Configura tu primer servicio para comenzar a recibir reservas.</p>
            <Button onClick={() => setDialogOpen(true)}>Crear Servicio</Button>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={deleteTarget?.refCount ? "Advertencia" : "Eliminar servicio"}
        description={
          deleteTarget?.refCount
            ? `"${deleteTarget.name}" aparece en ${deleteTarget.refCount} reserva(s). El historial perderá la referencia a este servicio. ¿Eliminar de todas formas?`
            : `¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`
        }
        confirmText={deleteTarget?.refCount ? "Eliminar de todas formas" : "Eliminar"}
        onConfirm={() => { if (deleteTarget) { handleDelete(deleteTarget.id); setDeleteTarget(null) } }}
      />
    </div>
  )
}
