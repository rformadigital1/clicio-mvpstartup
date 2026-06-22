"use client"

import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { GripVertical } from "lucide-react"
import type { PageSection } from "@/lib/types"

const SECTION_NAMES: Record<string, string> = {
  "quick-buttons": "Botones rápidos",
  "services": "Servicios",
  "booking-wizard": "Agendamiento",
  "gallery": "Galería",
  "map": "Mapa",
}

function SortableItem({ id, label, visible, disabled, onToggle }: {
  id: string; label: string; visible: boolean; disabled?: boolean; onToggle: (v: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 py-2 px-1 rounded border border-border-subtil bg-white">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm">{label}</span>
      <Switch checked={visible} onCheckedChange={onToggle} disabled={disabled} />
    </div>
  )
}

interface SectionsSectionProps {
  sections: PageSection[]
  onChange: (sections: PageSection[]) => void
}

export default function SectionsSection({ sections, onChange }: SectionsSectionProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }))
    onChange(reordered)
  }

  function handleToggle(id: string, visible: boolean) {
    onChange(sections.map((s) => s.id === id ? { ...s, visible } : s))
  }

  return (
    <Card>
      <CardHeader><CardTitle>Secciones</CardTitle></CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.map((s) => (
                <SortableItem
                  key={s.id}
                  id={s.id}
                  label={SECTION_NAMES[s.id] ?? s.id}
                  visible={s.visible}
                  disabled={s.id === "booking-wizard"}
                  onToggle={(v) => handleToggle(s.id, v)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <p className="text-xs text-muted-foreground mt-3">Arrastra para reordenar. El agendamiento no puede ocultarse.</p>
      </CardContent>
    </Card>
  )
}
