"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { PageButtons } from "@/lib/types"

const BUTTON_KEYS: { key: keyof PageButtons; label: string }[] = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
  { key: "servicios", label: "Servicios" },
  { key: "agendar", label: "Agendar Ahora" },
]

interface ButtonsSectionProps {
  buttons: PageButtons
  onChange: (buttons: PageButtons) => void
}

export default function ButtonsSection({ buttons, onChange }: ButtonsSectionProps) {
  function update(key: keyof PageButtons, field: "visible" | "label", value: boolean | string) {
    onChange({ ...buttons, [key]: { ...buttons[key], [field]: value } })
  }

  return (
    <Card>
      <CardHeader><CardTitle>Botones rápidos</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {BUTTON_KEYS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <Switch checked={buttons[key].visible} onCheckedChange={(v) => update(key, "visible", v)} />
            <Label className="w-28 text-sm">{label}</Label>
            <Input
              value={buttons[key].label}
              onChange={(e) => update(key, "label", e.target.value)}
              className="text-sm h-9"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
