"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TemplateId } from "@/lib/templates"
import { TEMPLATES, derivePalette } from "@/lib/templates"

interface PrimaryColorPickerProps {
  template: TemplateId
  value: string
  onChange: (color: string) => void
}

export default function PrimaryColorPicker({ template, value, onChange }: PrimaryColorPickerProps) {
  const derived = derivePalette(template, value)

  return (
    <Card>
      <CardHeader><CardTitle>Color principal</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-9 rounded cursor-pointer border border-border-subtil"
          />
          <Label className="text-sm">Color principal</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-xs h-9 w-32"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Vista previa de la paleta:</p>
          <div className="flex gap-1.5 flex-wrap">
            {Object.values(derived).map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-md border border-black/10"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
