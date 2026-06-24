"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChevronUp, ChevronDown } from "lucide-react"
import type { PageSection } from "@/lib/types"

const SECTION_NAMES: Record<string, string> = {
  "quick-buttons": "Botones rápidos",
  "services": "Servicios",
  "booking-wizard": "Agendamiento",
  "gallery": "Galería",
  "map": "Mapa",
}

interface SectionsSectionProps {
  sections: PageSection[]
  onChange: (sections: PageSection[]) => void
}

export default function SectionsSection({ sections, onChange }: SectionsSectionProps) {
  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const updated = [...sections]
    ;[updated[index], updated[target]] = [updated[target], updated[index]]
    onChange(updated.map((s, i) => ({ ...s, order: i })))
  }

  function handleToggle(id: string, visible: boolean) {
    onChange(sections.map((s) => s.id === id ? { ...s, visible } : s))
  }

  return (
    <Card>
      <CardHeader><CardTitle>Secciones</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {sections.map((s, i) => (
          <SectionRow
            key={s.id}
            label={SECTION_NAMES[s.id] ?? s.id}
            visible={s.visible}
            disabled={s.id === "booking-wizard"}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            onMoveUp={() => handleMove(i, -1)}
            onMoveDown={() => handleMove(i, 1)}
            onToggle={(v) => handleToggle(s.id, v)}
          />
        ))}
        <p className="text-xs text-muted-foreground mt-3">
          Ordena secciones con flechas. Agendamiento siempre visible.
        </p>
      </CardContent>
    </Card>
  )
}

function SectionRow({
  label, visible, disabled, isFirst, isLast, onMoveUp, onMoveDown, onToggle,
}: {
  label: string; visible: boolean; disabled?: boolean
  isFirst: boolean; isLast: boolean
  onMoveUp: () => void; onMoveDown: () => void; onToggle: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg border border-border-subtil bg-card">
      <button
        onClick={onMoveUp}
        disabled={isFirst}
        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Mover arriba"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        onClick={onMoveDown}
        disabled={isLast}
        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Mover abajo"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm ml-1">{label}</span>
      <Switch checked={visible} onCheckedChange={onToggle} disabled={disabled} />
    </div>
  )
}
