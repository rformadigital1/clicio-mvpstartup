# Template System Design — CLICIO Public Page

**Date:** 2026-06-24
**Status:** Draft

## Overview

Replace granular color/typography customization (8 color pickers + raw CSS font values) with 4 curated design templates. User selects template + primary color + font preset. All other visual properties are derived automatically, eliminating ugly combinations and UX friction.

### Current Problems

- 8 independent color pickers → any combination possible, most look bad
- Typography asks for CSS variable names (`var(--font-display)`) — incomprehensible to shop owners
- Layout is generic Linktree clone — no visual identity per business type
- Drag & drop section reorder broken (dnd-kit activation constraint + fragile pointer events)
- Button visibility has double toggle confusion (section-level + per-button)

## Domain Analysis (from interface-design)

**Domain concepts:** torque, chassis, detailing, garage bay, tool chest, polish, grease, alignment, overol, lift, dyno

**Color world:** aceite negro, gris metal, rojo herramienta, azul overol, blanco taller, cobre freno, naranja seguridad, plata cromado, verde área servicio

**Signature element:** The booking wizard embedded in the page + gallery as proof-of-work — CLICIO's functional differentiator

**Defaults rejected:**
- Generic card with icon+label → content-specific cards (service with price tag, gallery as grid)
- Flat design with no texture → subtle material quality per template
- Equal-weight links → hierarchy based on action importance (primary CTA vs secondary link)

## Data Model

### New PageConfig structure

```typescript
type TemplateId = "classic" | "modern" | "natural" | "industrial"
type FontPresetId = string // template-specific, maps to headingFont + bodyFont

interface PageConfig {
  template: TemplateId
  primaryColor: string       // hex, user-editable
  fontPreset: FontPresetId   // selected font combo
  sections: PageSection[]    // same structure as current
  buttons: PageButtons       // same structure as current
}
```

### Derived colors (computed at render time, not stored)

The 8 current color fields are derived from `template` + `primaryColor` using a deterministic function:

```
colors = derivePalette(template, primaryColor)
  → primary (same as primaryColor)
  → secondary (template-specific tint/shade of primary)
  → accent (template-specific complementary or contrasting)
  → background (template-specific base)
  → cardBg (template-specific surface)
  → text (template-specific foreground)
  → buttonBg (derived from primary)
  → buttonText (contrasting to buttonBg)
```

### Migration

Existing tenants keep their current `page_config` as-is. On first visit to `/dashboard/appearance`, detect legacy format and auto-migrate:
- `template: "classic"` (safe default for existing data)
- `primaryColor: colors.primary` from existing config
- `fontPreset: derived from existing typography values`

A migration SQL can batch-set `template = 'classic'` for all null/legacy page_config:

```sql
UPDATE tenants
SET page_config = jsonb_set(
  COALESCE(page_config, '{}'::jsonb),
  '{template}',
  '"classic"'
)
WHERE page_config IS NULL
   OR page_config->>'template' IS NULL;
```

## The 4 Templates

### CLÁSICO — "Confianza"
- **Vibe:** Establecido, profesional, tradicional
- **Primary:** `#0B2B5C` (navy profundo)
- **Secondary:** `#C5A55A` (dorado suave)
- **Accent:** `#8B4513` (bronce)
- **Background:** `#F5F3EE` (blanco roto)
- **CardBg:** `#FFFFFF` con borde `#E5DDD3`
- **Text:** `#1A1A1A`
- **Heading:** Playfair Display (serif)
- **Body:** Inter
- **Button radius:** 8px, filled primary
- **Card radius:** 8px, subtle shadow
- **Best for:** Taller mecánico tradicional, dueño veterano, clientela de barrio

### MODERNO — "Performance"
- **Vibe:** Rápido, preciso, aspiracional
- **Primary:** `#0D0D0D` (casi negro)
- **Secondary:** `#1A1A1A` (carbón)
- **Accent:** `#E30613` (rojo racing)
- **Background:** `#F8F8F8`
- **CardBg:** `#FFFFFF`, no border, shadow-md
- **Text:** `#0D0D0D`
- **Heading:** Oswald (bold comprimido)
- **Body:** Inter
- **Button radius:** 0px, full-width, high contrast
- **Card radius:** 0px
- **Best for:** Detailing studio, tunning, lavado premium

### NATURAL — "Cercano"
- **Vibe:** Amigable, transparente, acogedor
- **Primary:** `#5B7B5E` (verde salvia)
- **Secondary:** `#8B6F4C` (cuero)
- **Accent:** `#D4A373` (ocre)
- **Background:** `#F9F6F0` (crema)
- **CardBg:** `#FFFFFF`, border `#E8E0D0`
- **Text:** `#2C2C2C`
- **Heading:** Lora (serif suave)
- **Body:** DM Sans
- **Button radius:** 12px, rounded, earth tones
- **Card radius:** 10px
- **Best for:** Detailing ecológico, taller familiar, emprendedor joven

### INDUSTRIAL — "Duro"
- **Vibe:** Honesto, rudo, sin vueltas
- **Primary:** `#E85D04` (naranja seguridad)
- **Secondary:** `#2D2D2D` (carbón)
- **Accent:** `#A8A8A8` (hormigón)
- **Background:** `#F0EFED` (concreto claro)
- **CardBg:** `#FFFFFF`, border `#D0D0D0`
- **Text:** `#1C1C1C`
- **Heading:** Space Grotesk (geométrico)
- **Body:** DM Sans
- **Button radius:** 4px, outline 2px
- **Card radius:** 4px, no shadow
- **Best for:** Taller independiente, mecánica pesada, dueño directo

### Font Presets per Template

Each template offers 2-3 font combos:

| Template | Presets |
|---|---|
| Clásico | Elegante (Playfair Display + Inter), Tradicional (serif + serif) |
| Moderno | Bold (Oswald + Inter), Minimal (Inter + Inter) |
| Natural | Suave (Lora + DM Sans), Limpio (DM Sans + DM Sans) |
| Industrial | Industrial (Space Grotesk + DM Sans), Técnico (Space Grotesk + JetBrains Mono) |

## Component Architecture

### `/dashboard/appearance/page.tsx` — Reworked

```
┌─────────────────────────────────────┐
│ TemplateSelector                     │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│ │CLÁSIC│ │MODERN│ │NATURA│ │INDUST││
│ └──────┘ └──────┘ └──────┘ └──────┘│
├─────────────────────────────────────┤
│ PrimaryColorPicker                    │
│ [■ #0B2B5C]   (1 input + swatch)     │
├─────────────────────────────────────┤
│ FontPresetSelector                    │
│ ○ Elegante (Playfair + Inter)        │
│ ● Tradicional (serif both)           │
├─────────────────────────────────────┤
│ SectionsSection (↑↓ arrows + switch)  │
│   Botones rápidos  [↑][↓] [🔘]      │
│   Servicios        [↑][↓] [🔘]      │
│   Agendamiento     [↑][↓] [🔘 locked]│
│   Galería          [↑][↓] [🔘]      │
│   Mapa             [↑][↓] [🔘]      │
├─────────────────────────────────────┤
│ ButtonsSection (labels + visibility)  │
│   WhatsApp: [Agendar por WhatsApp]   │
│   Instagram: [Instagram]             │
│   Servicios: [Ver Servicios]         │
│   Agendar: [Agendar Ahora]           │
├─────────────────────────────────────┤
│ [Guardar cambios] [Restaurar]        │
└─────────────────────────────────────┘
```

### New components

1. **`template-selector.tsx`** — 4-card grid, each shows name + color swatches + description. Selected has highlight border. Uses `useOptimistic` for instant feedback.

2. **`primary-color-picker.tsx`** — Single color input + text field. Changing it triggers live preview of derived palette in a small swatch strip below.

3. **`font-preset-selector.tsx`** — Radio group, each option shows font names. Options depend on selected template.

4. **`sections-section.tsx`** — Replaces dnd-kit with simple ↑↓ arrow buttons. Each section row:
   - Section name
   - ↑ (disabled if first)
   - ↓ (disabled if last)
   - Switch toggle for visibility
   - Agendamiento: switch disabled, shows lock icon

### Helper: `derivePalette(template, primaryColor)`

Pure function, no side effects. Maps template + primary → complete 8-color palette. Implements template-specific color math (lighter tints, complementary hues, saturation shifts).

```typescript
function derivePalette(template: TemplateId, primary: string): PageColors {
  switch (template) {
    case "classic":
      return {
        primary,
        secondary: lighten(primary, 40),     // lighter navy
        accent: complement(primary),           // warm gold
        background: "#F5F3EE",
        cardBg: "#FFFFFF",
        text: "#1A1A1A",
        buttonBg: primary,
        buttonText: "#FFFFFF",
      }
    case "modern":
      // high contrast, dark primary
    case "natural":
      // desaturated, warm
    case "industrial":
      // bold, high saturation primary
  }
}
```

## Public Page Changes (`/[slug]/page.tsx`)

Minimal changes:
1. Read `template` + `primaryColor` + `fontPreset` from `page_config`
2. Call `derivePalette()` to get the 8 colors → set CSS variables (same as now)
3. Map `fontPreset` to actual heading/body font values
4. Everything else stays identical (sections, buttons, booking wizard)

No visual regression for existing tenants — migration auto-assigns `classic` template with their existing primary color.

## Section Reorder Bug Fix (↑↓ arrows)

### Current (broken)
```typescript
// dnd-kit with activationConstraint: { distance: 8 }
// {attributes} on container, {listeners} on grip button
// Unreliable on mobile, drag never feels right
```

### New
```typescript
function moveSection(index: number, direction: -1 | 1) {
  const reordered = [...sections]
  const target = index + direction
  if (target < 0 || target >= reordered.length) return
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
  onChange(reordered.map((s, i) => ({ ...s, order: i })))
}
```

Simple array swap. No dependencies. Works on all devices.

## Button Visibility Bug Fix

**Root cause:** Double toggle — section-level toggle (sections-section.tsx) hides/shows the entire `quick-buttons` wrapper, BUT the wrapper itself conditionally renders each button based on `config.buttons.*.visible`. Turning section ON but having all 4 buttons OFF produces an empty visible section.

**Fix:** In `/dashboard/appearance/buttons-section.tsx`, add warning banner:
> "Los botones individuales solo se ven si la sección Botones rápidos está activa"

Additionally, when saving, if section is ON but all buttons OFF, show a toast warning.

Optionally: when user toggles section OFF, auto-disable all buttons; when toggling ON, restore previous state.

## Dependencies

- **Remove:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **No new dependencies**

## Supabase Considerations

- No schema migration needed — `page_config` is already JSONB
- Existing data remains valid (old `page_config` with full colors object still renders via `derivePalette` fallback)
- Migration SQL is optional (for clean data), not required for functionality
- All RLS policies remain unchanged (tenants table policies already cover update)

## Security

- `page_config` is user-owned data, editable only by tenant owners (existing RLS)
- Template definitions are client-side constants — no injection risk
- Primary color is validated as hex string before storage

## Implementation Order

1. Create `derivePalette()` pure function + `src/lib/templates.ts` with template definitions
2. Update `PageConfig` type (add `template`, `primaryColor`, `fontPreset` fields)
3. Rework `sections-section.tsx` — replace dnd-kit with ↑↓ buttons, remove dependencies
4. Add warning to `buttons-section.tsx` about double toggle
5. Build `template-selector.tsx` — 4-card grid
6. Build `primary-color-picker.tsx` with live swatch strip
7. Build `font-preset-selector.tsx` — radio group, dynamic per template
8. Update `/dashboard/appearance/page.tsx` — assemble new sections
9. Update `/[slug]/page.tsx` — use `derivePalette()` instead of reading colors directly
10. Write legacy migration logic (auto-detect old config → assign template + primaryColor)
11. Remove `@dnd-kit/*` packages from `package.json`
12. Test: verify all 4 templates render correctly, ↑↓ reorder works, button visibility consistent

## Future (Not In Scope)

- Preview modal before saving
- Template-specific section styling variants (e.g., gallery grid vs. carousel per template)
- Custom CSS injection for power users
