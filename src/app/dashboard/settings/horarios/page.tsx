"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, X } from "lucide-react"
import type { BusinessHour, BlockedDate } from "@/lib/types"

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export default function HorariosPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [hours, setHours] = useState<BusinessHour[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [savingHours, setSavingHours] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return
    setTenantId(profile.tenant_id)

    const [hRes, bRes] = await Promise.all([
      supabase.from("business_hours").select("*").eq("tenant_id", profile.tenant_id).order("day_of_week"),
      supabase.from("blocked_dates").select("*").eq("tenant_id", profile.tenant_id).order("date"),
    ])
    if (hRes.data) {
      if (hRes.data.length === 0) {
        setHours(DAY_NAMES.map((_, i) => ({
          id: "", tenant_id: profile.tenant_id, day_of_week: i, open_time: "09:00", close_time: "18:00", is_open: i !== 0,
        })))
      } else {
        setHours(hRes.data)
      }
    }
    if (bRes.data) setBlockedDates(bRes.data)
  }

  async function handleSaveHours() {
    if (!tenantId) return
    setSavingHours(true)
    for (const h of hours) {
      await supabase.from("business_hours").upsert({
        id: h.id || undefined, tenant_id: tenantId, day_of_week: h.day_of_week,
        open_time: h.open_time, close_time: h.close_time, is_open: h.is_open,
      }).select()
    }
    toast({ title: "Horarios guardados" })
    setSavingHours(false)
  }

  async function handleAddBlockedDate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tenantId) return
    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from("blocked_dates").insert({
      tenant_id: tenantId, date: form.get("date") as string, reason: form.get("reason") as string,
    })
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    setBlockDialogOpen(false)
    toast({ title: "Fecha bloqueada" })
    loadData()
  }

  async function handleRemoveBlockedDate(id: string) {
    await supabase.from("blocked_dates").delete().eq("id", id)
    loadData()
  }

  function updateHour(dow: number, field: keyof BusinessHour, value: BusinessHour[keyof BusinessHour]) {
    setHours(hours.map((h) => h.day_of_week === dow ? { ...h, [field]: value } : h))
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Horarios y Fechas Bloqueadas</h1>

      <Card>
        <CardHeader><CardTitle>Horarios de Atención</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {hours.map((h) => (
            <div key={h.day_of_week} className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Switch checked={h.is_open} onCheckedChange={(v) => updateHour(h.day_of_week, "is_open", v)} />
              <span className={`w-20 sm:w-24 text-sm ${!h.is_open ? "line-through text-muted-foreground" : ""}`}>
                {DAY_NAMES[h.day_of_week]}
              </span>
              <Input type="time" value={h.open_time} onChange={(e) => updateHour(h.day_of_week, "open_time", e.target.value)} disabled={!h.is_open} className="w-28 sm:w-32" />
              <span className="text-muted-foreground">a</span>
              <Input type="time" value={h.close_time} onChange={(e) => updateHour(h.day_of_week, "close_time", e.target.value)} disabled={!h.is_open} className="w-28 sm:w-32" />
            </div>
          ))}
          <Button onClick={handleSaveHours} disabled={savingHours}>
            {savingHours ? "Guardando..." : "Guardar horarios"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fechas Bloqueadas</CardTitle>
          <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Bloquear fecha</DialogTitle></DialogHeader>
              <form onSubmit={handleAddBlockedDate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label>Motivo (opcional)</Label>
                  <Input name="reason" placeholder="Ej: Feriado" />
                </div>
                <Button type="submit" className="w-full">Bloquear</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay fechas bloqueadas</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((bd) => (
                <div key={bd.id} className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-sm font-medium">{bd.date}</span>
                    {bd.reason && <span className="text-sm text-muted-foreground ml-2">— {bd.reason}</span>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveBlockedDate(bd.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
