"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PageColors } from "@/lib/types"

interface ColorSectionProps {
  colors: PageColors
  onChange: (colors: PageColors) => void
}

const COLOR_FIELDS: { key: keyof PageColors; label: string }[] = [
  { key: "primary", label: "Primario" },
  { key: "secondary", label: "Secundario" },
  { key: "accent", label: "Acento" },
  { key: "background", label: "Fondo" },
  { key: "cardBg", label: "Tarjetas" },
  { key: "text", label: "Texto" },
  { key: "buttonBg", label: "Botón fondo" },
  { key: "buttonText", label: "Botón texto" },
]

export default function ColorSection({ colors, onChange }: ColorSectionProps) {
  const update = (key: keyof PageColors, value: string) => {
    onChange({ ...colors, [key]: value })
  }

  return (
    <Card>
      <CardHeader><CardTitle>Colores</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <input
              type="color"
              value={colors[key]}
              onChange={(e) => update(key, e.target.value)}
              className="h-9 w-9 rounded cursor-pointer border border-border-subtil"
            />
            <Label className="w-28 text-sm">{label}</Label>
            <Input
              value={colors[key]}
              onChange={(e) => update(key, e.target.value)}
              className="font-mono text-xs h-9"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
