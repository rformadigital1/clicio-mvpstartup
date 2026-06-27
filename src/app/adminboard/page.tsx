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
}

const statusColors: Record<string, string> = {
  trial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function loadTenants() {
    const res = await fetch("/api/admin/tenants")
    if (res.status === 401) {
      router.push("/adminboard/login")
      return
    }
    const data = await res.json()
    setTenants(data)
    setLoading(false)
  }

  useEffect(() => { loadTenants() }, [])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/tenants/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    await loadTenants()
  }

  async function updateNotes(id: string, notes: string) {
    await fetch(`/api/admin/tenants/${id}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    })
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/adminboard/login")
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
            <button
              onClick={() => router.push("/adminboard/settings")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cambiar contraseña
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Cerrar sesión
            </button>
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
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Días restantes</th>
                <th className="text-left px-4 py-3 font-medium">Notas</th>
                <th className="text-left px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{t.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status] || ""}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.days_remaining !== null ? `${t.days_remaining} días` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      defaultValue={t.notes || ""}
                      onBlur={(e) => updateNotes(t.id, e.target.value)}
                      className="w-32 rounded border border-border bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Nota..."
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {t.status !== "active" && (
                        <button
                          onClick={() => updateStatus(t.id, "active")}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                        >
                          Activar
                        </button>
                      )}
                      {t.status !== "paused" && t.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(t.id, "paused")}
                          className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
                        >
                          Pausar
                        </button>
                      )}
                      {t.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(t.id, "cancelled")}
                          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
