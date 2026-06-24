"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TemplateId } from "@/lib/templates"
import { TEMPLATES } from "@/lib/templates"

interface TemplateSelectorProps {
  value: TemplateId
  onChange: (template: TemplateId) => void
}

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const entries = Object.values(TEMPLATES)

  return (
    <Card>
      <CardHeader><CardTitle>Plantilla</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {entries.map((t) => {
            const selected = t.id === value
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selected
                    ? "border-foreground ring-2 ring-foreground/20"
                    : "border-border-subtil hover:border-foreground/20"
                }`}
              >
                <div className="flex gap-1 mb-3">
                  {t.swatches.map((color, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
