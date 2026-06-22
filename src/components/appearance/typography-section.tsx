"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const FONT_OPTIONS = [
  { value: "var(--font-display)", label: "Cursiva BMW" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
]

interface TypographySectionProps {
  headingFont: string
  bodyFont: string
  onChange: (field: "headingFont" | "bodyFont", value: string) => void
}

export default function TypographySection({ headingFont, bodyFont, onChange }: TypographySectionProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Tipografía</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Fuente de títulos</Label>
          <Select value={headingFont} onValueChange={(v) => onChange("headingFont", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fuente de texto</Label>
          <Select value={bodyFont} onValueChange={(v) => onChange("bodyFont", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
