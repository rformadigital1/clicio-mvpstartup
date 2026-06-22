"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Tenant, PageConfig } from "@/lib/types"
import ColorSection from "@/components/appearance/color-section"
import TypographySection from "@/components/appearance/typography-section"
import SectionsSection from "@/components/appearance/sections-section"
import ButtonsSection from "@/components/appearance/buttons-section"

const DEFAULT_CONFIG: PageConfig = {
  colors: { primary: "#1A3A8A", secondary: "#4A90D9", accent: "#E3242B", background: "#F7F5F3", cardBg: "#FFFFFF", text: "#1A1A1A", buttonBg: "#1A3A8A", buttonText: "#FFFFFF" },
  typography: { headingFont: "var(--font-display)", bodyFont: "Inter" },
  sections: [
    { id: "quick-buttons", visible: true, order: 0 },
    { id: "services", visible: true, order: 1 },
    { id: "booking-wizard", visible: true, order: 2 },
    { id: "gallery", visible: true, order: 3 },
    { id: "map", visible: true, order: 4 },
  ],
  buttons: {
    whatsapp: { visible: true, label: "WhatsApp" },
    instagram: { visible: true, label: "Instagram" },
    servicios: { visible: true, label: "Servicios" },
    agendar: { visible: true, label: "Agendar Ahora" },
  },
}

export default function AppearancePage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [config, setConfig] = useState<PageConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTenant()
  }, [])

  async function loadTenant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile) { setLoading(false); return }

    const { data: tData } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .single()

    if (tData) {
      setTenant(tData)
      setConfig(tData.page_config ?? DEFAULT_CONFIG)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!tenant) return
    setSaving(true)
    const { error } = await supabase
      .from("tenants")
      .update({ page_config: config })
      .eq("id", tenant.id)

    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Cambios guardados" })
      setTenant({ ...tenant, page_config: config as any })
    }
    setSaving(false)
  }

  function resetDefaults() {
    setConfig(DEFAULT_CONFIG)
  }

  if (loading) return <div className="animate-pulse text-sm text-muted-foreground py-8 text-center">Cargando...</div>
  if (!tenant) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Apariencia</h1>
      </div>

      <div className="space-y-6">
        <ColorSection
          colors={config.colors}
          onChange={(colors) => setConfig({ ...config, colors })}
        />

        <TypographySection
          headingFont={config.typography.headingFont}
          bodyFont={config.typography.bodyFont}
          onChange={(field, value) =>
            setConfig({ ...config, typography: { ...config.typography, [field]: value } })
          }
        />

        <SectionsSection
          sections={config.sections}
          onChange={(sections) => setConfig({ ...config, sections })}
        />

        <ButtonsSection
          buttons={config.buttons}
          onChange={(buttons) => setConfig({ ...config, buttons })}
        />

        <div className="flex gap-3 pt-2 pb-8">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button variant="outline" onClick={resetDefaults}>
            Restaurar defaults
          </Button>
        </div>
      </div>
    </div>
  )
}
