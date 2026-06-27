"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Tenant {
  id: string
  name: string
  slug: string
  email: string | null
  status: string
  trial_ends_at: string | null
  notes: string | null
  created_at: string | null
  days_remaining: number | null
  planned_at: string | null
}

interface LogEntry {
  from_status: string | null
  to_status: string
  changed_by: string
  created_at: string
}

const statusColors: Record<string, string> = {
  trial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" })
}

function getPlanLabel(t: Tenant): string {
  switch (t.status) {
    case "trial":
      return t.days_remaining !== null ? `Prueba: ${t.days_remaining} días` : "Prueba"
    case "active":
      return t.planned_at ? `Plan pagado desde ${formatDate(t.planned_at)}` : "Plan pagado"
    case "paused":
      return "Pausada"
    case "cancelled":
      return "Cancelada"
    default:
      return t.status
  }
}

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [historyTenant, setHistoryTenant] = useState<Tenant | null>(null)
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const router = useRouter()

  async function loadTenants() {
    const res = await fetch("/api/admin/tenants")
    if (res.status === 401) { router.push("/controlroot/login"); return }
    setTenants(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadTenants() }, [])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/tenants/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setOpenDropdown(null)
    await loadTenants()
  }

  async function updateNotes(id: string, notes: string) {
    await fetch(`/api/admin/tenants/${id}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    })
  }

  async function openHistory(t: Tenant) {
    setHistoryTenant(t)
    setHistoryOpen(true)
    setOpenDropdown(null)
    const res = await fetch(`/api/admin/tenants/${t.id}/logs`)
    setHistoryLogs(await res.json())
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/controlroot/login")
  }

  const statusLabel: Record<string, string> = {
    trial: "Prueba",
    active: "Activo",
    paused: "Pausado",
    cancelled: "Cancelado",
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="animate-pulse space-y-4 max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">CLICIO Admin</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/controlroot/settings")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cambiar contraseña</button>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 transition-colors">Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground">{tenants.length} cuenta{tenants.length !== 1 ? "s" : ""}</p>

        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Taller</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Notas</th>
                <th className="text-left px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getPlanLabel(t)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status] || ""}`}>
                      {statusLabel[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      defaultValue={t.notes || ""}
                      onBlur={(e) => updateNotes(t.id, e.target.value)}
                      className="w-32 rounded border border-border bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Nota..."
                    />
                  </td>
                  <td className="px-4 py-3 relative">
                    {t.status !== "cancelled" ? (
                      <>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === t.id ? null : t.id)}
                          className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          Acciones ▾
                        </button>
                        {openDropdown === t.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-border bg-background shadow-lg py-1">
                              {t.status === "trial" && (
                                <button onClick={() => updateStatus(t.id, "active")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Activar plan pagado</button>
                              )}
                              {t.status === "paused" && (
                                <button onClick={() => updateStatus(t.id, "active")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Activar plan pagado</button>
                              )}
                              {t.status !== "paused" && (
                                <button onClick={() => updateStatus(t.id, "paused")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Pausar</button>
                              )}
                              <button onClick={() => updateStatus(t.id, "cancelled")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Cancelar</button>
                              <hr className="my-1 border-border" />
                              <button onClick={() => openHistory(t)} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors">Ver historial</button>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <button onClick={() => openHistory(t)} className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors">Historial</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {historyOpen && historyTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setHistoryOpen(false)}>
          <div className="bg-background rounded-xl shadow-2xl border border-border max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="font-semibold">{historyTenant.name}</h2>
              <button onClick={() => setHistoryOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              {historyLogs.length === 0 && <p className="text-sm text-muted-foreground">Sin historial</p>}
              {historyLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm">
                      {log.from_status ? `${capitalize(log.from_status)} → ${capitalize(log.to_status)}` : capitalize(log.to_status)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("es-CL")} · {log.changed_by === "admin" ? "Admin" : log.changed_by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function capitalize(s: string) {
  const map: Record<string, string> = { trial: "Prueba", active: "Activo", paused: "Pausado", cancelled: "Cancelado" }
  return map[s] || s
}
