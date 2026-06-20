"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Car, Pencil, ImageIcon } from "lucide-react"
import { AlertDialog } from "@/components/ui/alert-dialog"
import type { Service } from "@/lib/types"

const STORAGE_BUCKET = "service-images"

export default function ServicesPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

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
  }

  async function uploadImage(serviceId: string, file: File): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `${tenantId}/${serviceId}.${ext}`
    const { error: uploadErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })
    if (uploadErr) { toast({ title: "Error al subir imagen", description: uploadErr.message, variant: "destructive" }); return null }
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    return urlData?.publicUrl ?? null
  }

  async function handleAddService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId) { toast({ title: "Error", description: "Tenant no encontrado", variant: "destructive" }); return }

    const form = new FormData(e.currentTarget)
    const { data: newService, error } = await supabase.from("services").insert({
      tenant_id: tenantId,
      name: form.get("name") as string,
      price: parseInt(form.get("price") as string) || null,
      duration: parseInt(form.get("duration") as string) || null,
    }).select().single()

    if (error || !newService) { toast({ title: "Error al crear servicio", description: error?.message, variant: "destructive" }); return }

    if (imageFile) {
      const url = await uploadImage(newService.id, imageFile)
      if (url) {
        await supabase.from("services").update({ image_url: url }).eq("id", newService.id)
      }
    }

    toast({ title: "Servicio creado" })
    setDialogOpen(false)
    setImageFile(null)
    setImagePreview(null)
    loadServices()
  }

  async function handleEditService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return

    const form = new FormData(e.currentTarget)
    const updates: Record<string, any> = {
      name: form.get("name") as string,
      price: parseInt(form.get("price") as string) || null,
      duration: parseInt(form.get("duration") as string) || null,
    }

    if (imageFile) {
      const url = await uploadImage(editTarget.id, imageFile)
      if (url) updates.image_url = url
    }

    const { error } = await supabase.from("services").update(updates).eq("id", editTarget.id)
    if (error) { toast({ title: "Error al actualizar", description: error.message, variant: "destructive" }); return }

    toast({ title: "Servicio actualizado" })
    setEditDialogOpen(false)
    setEditTarget(null)
    setImageFile(null)
    setImagePreview(null)
    loadServices()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("services").delete().eq("id", id)
    if (error) { toast({ title: "Error al eliminar", description: error.message, variant: "destructive" }); return }
    toast({ title: "Servicio eliminado" })
    loadServices()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Servicio</Button>
          </DialogTrigger>
          <Dialog open={editDialogOpen} onOpenChange={(v) => { setEditDialogOpen(v); if (!v) { setEditTarget(null); setImageFile(null); setImagePreview(null) } }}>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar Servicio</DialogTitle></DialogHeader>
              <form onSubmit={handleEditService} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input id="edit-name" name="name" required defaultValue={editTarget?.name ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Precio ($)</Label>
                  <Input id="edit-price" name="price" type="number" defaultValue={editTarget?.price ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duración (minutos)</Label>
                  <Input id="edit-duration" name="duration" type="number" defaultValue={editTarget?.duration ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>Imagen</Label>
                  {(imagePreview || editTarget?.image_url) && (
                    <img src={imagePreview ?? editTarget?.image_url ?? ""} alt="Preview" className="w-32 h-32 object-cover rounded mb-2" />
                  )}
                  <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
                  }} />
                </div>
                <Button type="submit" className="w-full">Guardar</Button>
              </form>
            </DialogContent>
          </Dialog>
          <DialogContent>
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
              <div className="space-y-2">
                <Label>Imagen</Label>
                <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
                }} />
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" />}
              </div>
              <Button type="submit" className="w-full">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {service.image_url
                  ? <img src={service.image_url} alt={service.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                  : <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                }
                <CardTitle className="text-base truncate">{service.name}</CardTitle>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => { setEditTarget(service); setEditDialogOpen(true); setImageFile(null); setImagePreview(null) }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: service.id, name: service.name })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
        title="Eliminar servicio"
        description={`¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={() => { handleDelete(deleteTarget!.id); setDeleteTarget(null) }}
      />
    </div>
  )
}
