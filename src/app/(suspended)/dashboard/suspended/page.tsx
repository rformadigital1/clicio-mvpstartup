"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function SuspendedPage() {
  const [reason, setReason] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/signin"); return }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

      if (!profile) return

      const { data: tenant } = await supabase
        .from("tenants")
        .select("status")
        .eq("id", profile.tenant_id)
        .single()

      if (tenant) setReason(tenant.status)
    })
  }, [])

  const messages: Record<string, { title: string; desc: string }> = {
    paused: {
      title: "Cuenta en pausa",
      desc: "Tu cuenta está temporalmente en pausa. Contacta a tu asesor para reactivar tu plan.",
    },
    cancelled: {
      title: "Cuenta cancelada",
      desc: "Tu cuenta ha sido cancelada. Si deseas volver, contacta a tu asesor.",
    },
  }

  const m = messages[reason || ""] || {
    title: "Acceso temporalmente suspendido",
    desc: "Tu período de prueba gratuita terminó. Para seguir usando CLICIO, contacta a tu asesor y regulariza tu situación.",
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <span className="text-2xl">⏸</span>
        </div>
        <h1 className="text-2xl font-bold">{m.title}</h1>
        <p className="text-muted-foreground leading-relaxed">{m.desc}</p>
        <a
          href="https://wa.me/56912345678"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Contactar por WhatsApp
        </a>
        <p className="text-xs text-muted-foreground">
          Tus datos están seguros. Nada se elimina. Al activar tu plan, todo vuelve a estar disponible.
        </p>
      </div>
    </div>
  )
}
