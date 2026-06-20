"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRole } from "@/app/dashboard/layout"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Copy, Check, Plus, Trash2 } from "lucide-react"
import type { StaffInvitation, Profile } from "@/lib/types"

export function StaffSection() {
  const supabase = createClient()
  const { toast } = useToast()
  const roleInfo = useRole()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<StaffInvitation[]>([])
  const [showCode, setShowCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => { setOrigin(window.location.origin); loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return

    const [pRes, iRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("tenant_id", profile.tenant_id).order("created_at"),
      supabase.from("staff_invitations").select("*").eq("tenant_id", profile.tenant_id).eq("used", false).order("created_at"),
    ])
    if (pRes.data) setProfiles(pRes.data)
    if (iRes.data) setInvitations(iRes.data)
  }

  async function handleGenerate() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return

    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    const { error } = await supabase.from("staff_invitations").insert({
      tenant_id: profile.tenant_id,
      code,
    })
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    setShowCode(code)
    loadData()
  }

  async function handleRemoveStaff(id: string) {
    const { error } = await supabase.from("profiles").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Miembro eliminado" })
    setDeleteTarget(null)
    loadData()
  }

  async function copyCode() {
    if (!showCode) return
    try {
      await navigator.clipboard.writeText(`${origin}/join?code=${showCode}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (!roleInfo?.isOwner) return null

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Equipo</CardTitle>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            <Plus className="h-4 w-4 mr-1" /> Generar código
          </Button>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin miembros</p>
          ) : (
            <div className="space-y-3">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{p.email}</p>
                    <Badge variant={p.role === "owner" ? "default" : "secondary"} className="mt-1">
                      {p.role === "owner" ? "Dueño" : "Staff"}
                    </Badge>
                  </div>
                  {p.role === "staff" && (
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: p.id, email: p.email })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCode && (
        <Card className="mt-4 border-primary">
          <CardHeader>
            <CardTitle className="text-primary">Código generado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Comparte este link con el empleado:</p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm break-all">{origin}/join?code={showCode}</code>
              <Button variant="ghost" size="icon" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCode(null)}>
              Cerrar
            </Button>
          </CardContent>
        </Card>
      )}

      {invitations.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Invitaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Código: {inv.code}</span>
                  <span className="text-xs text-muted-foreground">Expira: {new Date(inv.expires_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Eliminar miembro"
        description={`¿Eliminar a "${deleteTarget?.email}"? Perderá acceso al taller.`}
        confirmText="Eliminar"
        onConfirm={() => { if (deleteTarget) handleRemoveStaff(deleteTarget.id) }}
      />
    </>
  )
}
