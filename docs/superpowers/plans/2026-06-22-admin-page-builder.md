# Admin Page Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `/dashboard/appearance` page to customize colors, typography, sections (reorder/hide), and quick-button labels for the public `/[slug]` page.

**Architecture:** Store config as JSONB column `page_config` on `tenants` table. Admin page reads/writes this JSON. Public page reads config, applies CSS variables on root element, renders sections in config order.

**Tech Stack:** Next.js App Router, Supabase (JSONB column), @dnd-kit/core + @dnd-kit/sortable for reorder, shadcn/ui components (Card, Button, Input, Label, Switch, Select, Separator).

## Global Constraints

- All Tailwind color classes replaced by CSS custom properties (`var(--page-*)`)
- `booking-wizard` section always visible (toggle disabled in admin with tooltip)
- Existing tenants auto-populated with default config via column DEFAULT
- Apply `/dashboard/appearance` for doc deprecation to avoid commit conflicts
- Build (`npm run build`) must pass at end of each task

---

### Task 1: Types + Migration + Schema Update

**Files:**
- Modify: `src/lib/types.ts`
- Create: `supabase/migrations/20260622003_add_page_config.sql`
- Modify: `supabase-schema.sql`

**Interfaces:**
- Consumes: `Tenant` interface (adds `page_config`)
- Produces: `PageConfig` type (consumed by Task 2, 3)

- [ ] **Step 1: Define `PageConfig` interface in types.ts**

Add after `StaffInvitation` interface at types.ts:127:

```typescript
export interface PageConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    cardBg: string
    text: string
    buttonBg: string
    buttonText: string
  }
  typography: {
    headingFont: string
    bodyFont: string
  }
  sections: {
    id: "quick-buttons" | "services" | "booking-wizard" | "gallery" | "map"
    visible: boolean
    order: number
  }[]
  buttons: {
    whatsapp: { visible: boolean; label: string }
    instagram: { visible: boolean; label: string }
    servicios: { visible: boolean; label: string }
    agendar: { visible: boolean; label: string }
  }
}
```

- [ ] **Step 2: Add `page_config` field to `Tenant`**

```typescript
export interface Tenant {
  // ...existing fields...
  page_config: PageConfig | null
}
```

- [ ] **Step 3: Create migration file**

File: `supabase/migrations/20260622003_add_page_config.sql`

```sql
ALTER TABLE tenants
  ADD COLUMN page_config jsonb
  NOT NULL DEFAULT '{"colors":{"primary":"#1A3A8A","secondary":"#4A90D9","accent":"#E3242B","background":"#F7F5F3","cardBg":"#FFFFFF","text":"#1A1A1A","buttonBg":"#1A3A8A","buttonText":"#FFFFFF"},"typography":{"headingFont":"var(--font-display)","bodyFont":"Inter"},"sections":[{"id":"quick-buttons","visible":true,"order":0},{"id":"services","visible":true,"order":1},{"id":"booking-wizard","visible":true,"order":2},{"id":"gallery","visible":true,"order":3},{"id":"map","visible":true,"order":4}],"buttons":{"whatsapp":{"visible":true,"label":"WhatsApp"},"instagram":{"visible":true,"label":"Instagram"},"servicios":{"visible":true,"label":"Servicios"},"agendar":{"visible":true,"label":"Agendar Ahora"}}}'::jsonb;
```

- [ ] **Step 4: Apply migration to Supabase**

Run: `execute_sql` with the ALTER TABLE statement on project `mlqzpbtehdaecrdqhdzo`

- [ ] **Step 5: Update `supabase-schema.sql`**

Add `page_config jsonb not null default '<DEFAULT_JSON>'` to the `tenants` table definition after the `instagram` column.

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add src/lib/types.ts supabase/migrations/20260622003_add_page_config.sql supabase-schema.sql
git commit -m "feat: add page_config jsonb column to tenants + types"
```

---

### Task 2: Install @dnd-kit

**Files:**
- Modify: `package.json` (after install)

- [ ] **Step 1: Install dependencies**

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit for drag-and-drop section reorder"
```

---

### Task 3: Admin Appearance Page

**Files:**
- Create: `src/app/dashboard/appearance/page.tsx`
- Create: `src/app/dashboard/appearance/layout.tsx` (if needed)
- Create: `src/components/appearance/color-section.tsx`
- Create: `src/components/appearance/typography-section.tsx`
- Create: `src/components/appearance/sections-section.tsx`
- Create: `src/components/appearance/buttons-section.tsx`

**Interfaces:**
- Consumes: `PageConfig` type from Task 1
- Produces: `UPDATE tenants SET page_config = $1` (consumed by public page in Task 4)

- [ ] **Step 1: Create dashboard layout for appearance route**

`src/app/dashboard/appearance/layout.tsx` — same max-w-lg container pattern as settings page:

```typescript
export default function AppearanceLayout({ children }: { children: React.ReactNode }) {
  return <div className="max-w-lg">{children}</div>
}
```

- [ ] **Step 2: Create `ColorSection` component**

```typescript
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
```

- [ ] **Step 3: Create `TypographySection` component**

```typescript
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
```

- [ ] **Step 4: Create `SectionsSection` component with @dnd-kit**

```typescript
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
```

- [ ] **Step 5: Create `ButtonsSection` component**

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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
```

- [ ] **Step 6: Create main appearance page**

`src/app/dashboard/appearance/page.tsx`:

```typescript
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
```

- [ ] **Step 7: Add link in dashboard navigation**

In the dashboard sidebar/dropdown, add "Apariencia" link pointing to `/dashboard/appearance`. Check existing navigation pattern in layout.

Find the dashboard layout and add link entry after settings:

```typescript
{ label: "Apariencia", href: "/dashboard/appearance" }
```

- [ ] **Step 8: Build + commit**

```bash
npm run build
git add src/app/dashboard/appearance/ src/components/appearance/ && git add -A
git commit -m "feat: admin appearance page with color, typography, section reorder, button customization"
```

---

### Task 4: Apply Config to Public Page

**Files:**
- Modify: `src/app/[slug]/page.tsx`

**Interfaces:**
- Consumes: `PageConfig` from `tenant.page_config`

- [ ] **Step 1: Replace hardcoded colors with CSS variables**

In the root `<div>` of the page, add inline style with CSS custom properties from config:

```typescript
const config = tenant.page_config ?? DEFAULT_CONFIG
const pageStyle = {
  "--page-primary": config.colors.primary,
  "--page-secondary": config.colors.secondary,
  "--page-accent": config.colors.accent,
  "--page-bg": config.colors.background,
  "--page-card-bg": config.colors.cardBg,
  "--page-text": config.colors.text,
  "--page-btn-bg": config.colors.buttonBg,
  "--page-btn-text": config.colors.buttonText,
  "--page-heading-font": config.colors.headingFont,
  "--page-body-font": config.colors.bodyFont,
} as React.CSSProperties

return (
  <div className="min-h-screen bg-bg-concreto" style={pageStyle}>
```

Replace hardcoded Tailwind classes:
- `bg-bg-concreto` → `bg-[var(--page-bg)]`
- `bg-azul-rey` → `bg-[var(--page-btn-bg)]`
- `text-azul-rey` → `text-[var(--page-primary)]`
- `bg-white` (cards) → `bg-[var(--page-card-bg)]`
- `text-white` (on colored buttons) → `text-[var(--page-btn-text)]`
- `font-[family-name:var(--font-display)]` → `font-[var(--page-heading-font)]`
- `from-azul-rey to-celeste-cielo` → `from-[var(--page-primary)] to-[var(--page-secondary)]`
- `border-azul-rey` → `border-[var(--page-primary)]`
- `hover:border-azul-rey/40` → `hover:border-[var(--page-primary)]/40`
- `hover:bg-azul-rey/90` → `hover:bg-[var(--page-btn-bg)]/90`

- [ ] **Step 2: Render sections dynamically**

```typescript
const sectionsMap: Record<string, React.ReactNode> = {
  "quick-buttons": <QuickButtonsSection ... />,
  "services": services.length > 0 ? <ServicesSection ... /> : null,
  "booking-wizard": <BookingWizardSection ... />,
  "gallery": gallery.length > 0 ? <GallerySection ... /> : null,
  "map": tenant.address ? <MapSection ... /> : null,
}

const sortedSections = [...config.sections]
  .sort((a, b) => a.order - b.order)

{sortedSections.map(section => {
  if (!section.visible) return null
  return <div key={section.id}>{sectionsMap[section.id]}</div>
})}
```

- [ ] **Step 3: Use button labels from config**

Replace hardcoded labels in quick buttons section:

```typescript
{config.buttons.whatsapp.visible && cleanPhone && (
  <a ...>{config.buttons.whatsapp.label}</a>
)}
{config.buttons.instagram.visible && tenant.instagram && (
  <a ...>{config.buttons.instagram.label}</a>
)}
{config.buttons.servicios.visible && (
  <button ...>{config.buttons.servicios.label}</button>
)}
{config.buttons.agendar.visible && (
  <button ...>{config.buttons.agendar.label}</button>
)}
```

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add src/app/\[slug\]/page.tsx
git commit -m "feat: public page reads page_config for colors, sections, button labels"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

- [ ] **Step 2: Push**

```bash
git push
```
