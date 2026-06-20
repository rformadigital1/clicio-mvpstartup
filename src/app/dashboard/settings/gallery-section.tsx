"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, ImageIcon } from "lucide-react"
import type { GalleryImage } from "@/lib/types"

const STORAGE_BUCKET = "gallery"

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export function GallerySection() {
  const supabase = createClient()
  const { toast } = useToast()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadGallery() }, [])

  async function loadGallery() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return
    setTenantId(profile.tenant_id)

    const { data } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })

    setImages(data ?? [])
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!tenantId || !e.target.files?.[0]) return
    setUploading(true)
    const file = e.target.files[0]
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `${tenantId}/${genId()}.${ext}`

    const { error: uploadErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file)
    if (uploadErr) {
      toast({ title: "Error al subir", description: uploadErr.message, variant: "destructive" })
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    const imageUrl = urlData?.publicUrl
    if (!imageUrl) { setUploading(false); return }

    const { error: dbErr } = await supabase.from("gallery_images").insert({
      tenant_id: tenantId,
      image_url: imageUrl,
    })

    if (dbErr) {
      toast({ title: "Error al guardar", description: dbErr.message, variant: "destructive" })
    } else {
      toast({ title: "Imagen agregada" })
      loadGallery()
    }
    setUploading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("gallery_images").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Imagen eliminada" })
    loadGallery()
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Galería de Trabajos</CardTitle>
        <div>
          <Button variant="outline" size="sm" disabled={uploading} asChild>
            <label className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1" />
              {uploading ? "Subiendo..." : "Agregar foto"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} />
            </label>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Sube fotos de trabajos realizados para mostrar en tu sitio público.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group aspect-square">
                <img src={img.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
