"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TemplateId } from "@/lib/templates"
import { TEMPLATES } from "@/lib/templates"

interface FontPresetSelectorProps {
  template: TemplateId
  value: string
  onChange: (presetId: string) => void
}

export default function FontPresetSelector({ template, value, onChange }: FontPresetSelectorProps) {
  const presets = TEMPLATES[template].fontPresets

  return (
    <Card>
      <CardHeader><CardTitle>Tipografía</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {presets.map((preset) => (
            <label
              key={preset.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                value === preset.id
                  ? "border-foreground bg-accent/5"
                  : "border-border-subtil hover:border-foreground/30"
              }`}
            >
              <input
                type="radio"
                name="fontPreset"
                value={preset.id}
                checked={value === preset.id}
                onChange={() => onChange(preset.id)}
                className="accent-foreground"
              />
              <div>
                <div className="text-sm font-medium">{preset.name}</div>
                <div className="text-xs text-muted-foreground">
                  Títulos: {preset.headingFont.split(",")[0]} · Cuerpo: {preset.bodyFont.split(",")[0]}
                </div>
              </div>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
