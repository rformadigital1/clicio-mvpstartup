"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Tenant, PageConfig, PageColors } from "@/lib/types"
import type { TemplateId } from "@/lib/templates"
import { TEMPLATES, derivePalette } from "@/lib/templates"
import TemplateSelector from "@/components/appearance/template-selector"
import PrimaryColorPicker from "@/components/appearance/primary-color-picker"
import FontPresetSelector from "@/components/appearance/font-preset-selector"
import SectionsSection from "@/components/appearance/sections-section"
import ButtonsSection from "@/components/appearance/buttons-section"

const DEFAULT_CONFIG: PageConfig = {
  template: "classic",
  primaryColor: TEMPLATES.classic.basePalette.primary,
  fontPreset: TEMPLATES.classic.fontPresets[0].id,
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

  function migrateOldConfig(old: any): PageConfig {
    if (old.template) return old as PageConfig
    return {
      template: "classic" as TemplateId,
      primaryColor: old.colors?.primary ?? DEFAULT_CONFIG.primaryColor,
      fontPreset: DEFAULT_CONFIG.fontPreset,
      sections: old.sections ?? DEFAULT_CONFIG.sections,
      buttons: old.buttons ?? DEFAULT_CONFIG.buttons,
    }
  }

  async function loadTenant() {
    try {
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
        const parsed = tData.page_config ?? {}
        setConfig(migrateOldConfig(parsed))
      }
    } catch {
      toast({ title: "Error al cargar", description: "No se pudo cargar la configuración", variant: "destructive" })
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
      setTenant({ ...tenant, page_config: config })
    }
    setSaving(false)
  }

  function resetDefaults() {
    setConfig(DEFAULT_CONFIG)
    toast({ title: "Defaults restaurados" })
  }

  if (loading) return <div className="animate-pulse text-sm text-muted-foreground py-8 text-center">Cargando...</div>
  if (!tenant) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Apariencia</h1>
      </div>

      <div className="space-y-6">
        <TemplateSelector
          value={config.template}
          onChange={(template) => {
            const t = TEMPLATES[template]
            setConfig({
              ...config,
              template,
              primaryColor: t.basePalette.primary,
              fontPreset: t.fontPresets[0].id,
            })
          }}
        />

        <PrimaryColorPicker
          template={config.template}
          value={config.primaryColor}
          onChange={(primaryColor) => setConfig({ ...config, primaryColor })}
        />

        <FontPresetSelector
          template={config.template}
          value={config.fontPreset}
          onChange={(fontPreset) => setConfig({ ...config, fontPreset })}
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
