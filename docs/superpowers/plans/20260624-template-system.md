# Template System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task.

**Goal:** Replace 8-color granular customization with 4 curated templates + single primary color + font presets

**Architecture:** Templates defined as constants in `src/lib/templates.ts`. `derivePalette()` maps template + primaryColor → 8 colors at render time. New components built for template/picker/font selection. Sections section replaces broken dnd-kit with simple ↑↓ buttons.

**Tech Stack:** Next.js 15, React, Tailwind, Supabase (JSONB page_config column)

## Global Constraints

- No new npm dependencies — only remove `@dnd-kit/*`
- All colors use CSS custom properties, never inline hex
- Booking-wizard section always visible, toggle disabled
- Build must pass after each commit

---

### Task 1: Template library + types update

**Files:**
- Create: `src/lib/templates.ts`
- Modify: `src/lib/types.ts` (PageConfig type)

**Interfaces:**
- Consumes: none
- Produces: `TEMPLATES` constant, `derivePalette()` function, `TemplateId` type, updated `PageConfig` type

- [ ] **Step 1: Define template types and data**

Write `src/lib/templates.ts`:

```typescript
import type { PageColors } from "./types"

export type TemplateId = "classic" | "modern" | "natural" | "industrial"

export interface FontPreset {
  id: string
  name: string
  headingFont: string
  bodyFont: string
}

export interface TemplateDefinition {
  id: TemplateId
  name: string
  description: string
  swatches: string[]
  basePalette: PageColors
  fontPresets: FontPreset[]
}

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  classic: {
    id: "classic",
    name: "Clásico",
    description: "Profesional, de confianza, tradicional",
    swatches: ["#0B2B5C", "#C5A55A", "#8B4513", "#F5F3EE"],
    basePalette: {
      primary: "#0B2B5C",
      secondary: "#C5A55A",
      accent: "#8B4513",
      background: "#F5F3EE",
      cardBg: "#FFFFFF",
      text: "#1A1A1A",
      buttonBg: "#0B2B5C",
      buttonText: "#FFFFFF",
    },
    fontPresets: [
      { id: "elegante", name: "Elegante", headingFont: "Playfair Display, serif", bodyFont: "Inter, sans-serif" },
      { id: "tradicional", name: "Tradicional", headingFont: "Georgia, serif", bodyFont: "Georgia, serif" },
    ],
  },
  modern: {
    id: "modern",
    name: "Moderno",
    description: "Rápido, audaz, aspiracional",
    swatches: ["#0D0D0D", "#E30613", "#F8F8F8", "#1A1A1A"],
    basePalette: {
      primary: "#0D0D0D",
      secondary: "#1A1A1A",
      accent: "#E30613",
      background: "#F8F8F8",
      cardBg: "#FFFFFF",
      text: "#0D0D0D",
      buttonBg: "#0D0D0D",
      buttonText: "#FFFFFF",
    },
    fontPresets: [
      { id: "bold", name: "Bold", headingFont: "Oswald, sans-serif", bodyFont: "Inter, sans-serif" },
      { id: "minimal", name: "Minimal", headingFont: "Inter, sans-serif", bodyFont: "Inter, sans-serif" },
    ],
  },
  natural: {
    id: "natural",
    name: "Natural",
    description: "Cercano, transparente, acogedor",
    swatches: ["#5B7B5E", "#8B6F4C", "#D4A373", "#F9F6F0"],
    basePalette: {
      primary: "#5B7B5E",
      secondary: "#8B6F4C",
      accent: "#D4A373",
      background: "#F9F6F0",
      cardBg: "#FFFFFF",
      text: "#2C2C2C",
      buttonBg: "#5B7B5E",
      buttonText: "#FFFFFF",
    },
    fontPresets: [
      { id: "suave", name: "Suave", headingFont: "Lora, serif", bodyFont: "DM Sans, sans-serif" },
      { id: "limpio", name: "Limpio", headingFont: "DM Sans, sans-serif", bodyFont: "DM Sans, sans-serif" },
    ],
  },
  industrial: {
    id: "industrial",
    name: "Industrial",
    description: "Honesto, directo, sin vueltas",
    swatches: ["#E85D04", "#2D2D2D", "#A8A8A8", "#F0EFED"],
    basePalette: {
      primary: "#E85D04",
      secondary: "#2D2D2D",
      accent: "#A8A8A8",
      background: "#F0EFED",
      cardBg: "#FFFFFF",
      text: "#1C1C1C",
      buttonBg: "#E85D04",
      buttonText: "#FFFFFF",
    },
    fontPresets: [
      { id: "industrial", name: "Industrial", headingFont: "Space Grotesk, sans-serif", bodyFont: "DM Sans, sans-serif" },
      { id: "tecnico", name: "Técnico", headingFont: "Space Grotesk, sans-serif", bodyFont: "JetBrains Mono, monospace" },
    ],
  },
}

export function derivePalette(templateId: TemplateId, primaryColor: string): PageColors {
  const template = TEMPLATES[templateId]
  const base = template.basePalette
  return {
    ...base,
    primary: primaryColor,
    buttonBg: primaryColor,
    buttonText: "#FFFFFF",
  }
}
```

- [ ] **Step 2: Update PageConfig type**

In `src/lib/types.ts`, replace:

```typescript
export interface PageConfig {
  colors: PageColors
  typography: {
    headingFont: string
    bodyFont: string
  }
  sections: PageSection[]
  buttons: PageButtons
}
```

With:

```typescript
export interface PageConfig {
  template: "classic" | "modern" | "natural" | "industrial"
  primaryColor: string
  fontPreset: string
  sections: PageSection[]
  buttons: PageButtons
}
```

Keep `PageColors` type — still used internally.

- [ ] **Step 3: Build test**

Run: `npm run build` — expect warning about appearance/page.tsx using old config structure (we'll fix next tasks). That's expected.

- [ ] **Step 4: Commit**

```bash
git add src/lib/templates.ts src/lib/types.ts
git commit -m "feat: add template definitions and derivePalette, update PageConfig type"
```

---

### Task 2: Sections section — replace dnd-kit with ↑↓ arrows + buttons warning

**Files:**
- Rewrite: `src/components/appearance/sections-section.tsx`
- Modify: `src/components/appearance/buttons-section.tsx`

**Interfaces:**
- Consumes: `PageSection` type from types.ts
- Produces: new `SectionsSection` (same props signature), buttons warning

- [ ] **Step 1: Rewrite sections-section.tsx**

Replace entire file:

```typescript
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
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg border border-border-subtil bg-white">
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
```

- [ ] **Step 2: Add warning to buttons-section.tsx**

Read the file first, then add after the CardHeader:

```typescript
import { AlertTriangle } from "lucide-react"

// Add inside CardContent, before the button fields:
{
  /* In the return, after CardHeader and inside CardContent, add: */
}
<div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-4">
  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
  <p>Los botones individuales solo se ven si la sección <strong>Botones rápidos</strong> está activa en la pestaña Secciones.</p>
</div>
```

Add `AlertTriangle` to the lucide-react import.

- [ ] **Step 3: Build test**

Run: `npm run build` — should pass

- [ ] **Step 4: Commit**

```bash
git add src/components/appearance/sections-section.tsx src/components/appearance/buttons-section.tsx
git commit -m "refactor: replace dnd-kit with arrow reorder, add button visibility warning"
```

---

### Task 3: Template selector, color picker, font preset components

**Files:**
- Create: `src/components/appearance/template-selector.tsx`
- Create: `src/components/appearance/primary-color-picker.tsx`
- Create: `src/components/appearance/font-preset-selector.tsx`

**Interfaces:**
- Consumes: `TemplateId`, `TEMPLATES`, `derivePalette()` from templates.ts; `PageConfig` from types.ts
- Produces: three components with explicit props

- [ ] **Step 1: Create template-selector.tsx**

```typescript
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
```

- [ ] **Step 2: Create primary-color-picker.tsx**

```typescript
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
```

- [ ] **Step 3: Create font-preset-selector.tsx**

```typescript
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
```

- [ ] **Step 4: Build test**

Run: `npm run build` — should pass

- [ ] **Step 5: Commit**

```bash
git add src/components/appearance/template-selector.tsx src/components/appearance/primary-color-picker.tsx src/components/appearance/font-preset-selector.tsx
git commit -m "feat: add template selector, color picker, and font preset components"
```

---

### Task 4: Wire up appearance page + migration logic

**Files:**
- Rewrite: `src/app/dashboard/appearance/page.tsx`

**Interfaces:**
- Consumes: all 3 new components, TEMPLATES/derivePalette, PageConfig type

- [ ] **Step 1: Rewrite appearance/page.tsx**

```typescript
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
```

- [ ] **Step 2: Build test**

Run: `npm run build` — should pass

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/appearance/page.tsx
git commit -m "feat: wire up new template system in appearance page"
```

---

### Task 5: Update public page to use derivePalette

**Files:**
- Modify: `src/app/[slug]/page.tsx`

- [ ] **Step 1: Update imports and style computation**

In `[slug]/page.tsx`:

Add import:
```typescript
import { derivePalette, TEMPLATES } from "@/lib/templates"
```

Replace the `DEFAULT_CONFIG` with:

```typescript
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
```

Replace the `config` line and `pageStyle` block:

```typescript
const config: PageConfig = tenant.page_config ?? DEFAULT_CONFIG

const templateId = (config as any).template || "classic"
const primaryColor = (config as any).primaryColor || config.colors?.primary || TEMPLATES.classic.basePalette.primary
const fontPresetId = (config as any).fontPreset || TEMPLATES.classic.fontPresets[0].id

const colors = (config as any).template
  ? derivePalette(templateId, primaryColor)
  : (config as any).colors

const headingFont = (config as any).template
  ? TEMPLATES[templateId as keyof typeof TEMPLATES].fontPresets.find((f: any) => f.id === fontPresetId)?.headingFont ?? TEMPLATES.classic.fontPresets[0].headingFont
  : (config as any).typography?.headingFont ?? TEMPLATES.classic.fontPresets[0].headingFont

const bodyFont = (config as any).template
  ? TEMPLATES[templateId as keyof typeof TEMPLATES].fontPresets.find((f: any) => f.id === fontPresetId)?.bodyFont ?? TEMPLATES.classic.fontPresets[0].bodyFont
  : (config as any).typography?.bodyFont ?? TEMPLATES.classic.fontPresets[0].bodyFont

const pageStyle = {
  "--page-primary": colors.primary,
  "--page-secondary": colors.secondary,
  "--page-accent": colors.accent,
  "--page-bg": colors.background,
  "--page-card-bg": colors.cardBg,
  "--page-text": colors.text,
  "--page-btn-bg": colors.buttonBg,
  "--page-btn-text": colors.buttonText,
  "--page-heading-font": headingFont,
  "--page-body-font": bodyFont,
} as React.CSSProperties
```

Also update `const sortedSections = ...` line to use the same pattern:

```typescript
const sections = (config as any).template ? config.sections : (config as any).sections ?? DEFAULT_CONFIG.sections
const sortedSections = [...sections].sort((a: any, b: any) => a.order - b.order)
```

And update button labels access similarly:

```typescript
const buttons = (config as any).template ? config.buttons : (config as any).buttons ?? DEFAULT_CONFIG.buttons
```

Then replace all `config.buttons` references with `buttons` and `config.sections` with `sections`.

- [ ] **Step 2: Build test**

Run: `npm run build` — should pass

- [ ] **Step 3: Commit**

```bash
git add src/app/\[slug\]/page.tsx
git commit -m "feat: use derivePalette for public page colors and fonts"
```

---

### Task 6: Remove dnd-kit + build verification

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove dnd-kit packages**

Run:
```bash
npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Full build test**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove @dnd-kit dependencies, replaced with native arrow reorder"
```
