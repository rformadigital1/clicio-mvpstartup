# Brand Redesign: Clicio → BMW M Industrial

**Date:** 2026-06-21
**Status:** Design approved, pending implementation

---

## 1. Concept

**Visual metaphor:** Tablero de instrumentos de un taller bien organizado. Concreto limpio, herramientas ordenadas, pizarra magnética. Inspiración BMW M: prestigio automotriz, colores con identidad propia, precisión alemana pero con calidez de taller local.

**Persona:** Dueño de taller automotriz revisando el día entre trabajos. Quiere respuestas rápidas — "quién viene hoy", "qué falta", "estado del trabajo". La app debe sentirse como una herramienta profesional, no como un genérico SaaS.

---

## 2. Palette (BMW M Inspired)

| Token | HEX | Nombre | Uso |
|-------|-----|--------|-----|
| `--color-azul-rey` | `#1A3A8A` | Azul Rey | Primary base, botones principales, links |
| `--color-celeste-cielo` | `#4A90D9` | Azul Celeste Cielo | Secondary, hover states, highlights suaves |
| `--color-rojo` | `#E3242B` | Rojo | Destructive, alertas, badges urgentes |
| `--bg-concreto` | `#F7F5F3` | Gris Concreto | Page background |
| `--bg-superficie` | `#F0EEEC` | Gris Superficie | Card/surface backgrounds |
| `--bg-elevado` | `#FFFFFF` | Blanco | Dropdowns, modals, elevated surfaces |
| `--text-primary` | `#0F172A` | Negro Instrumentos | Body text, headings |
| `--text-secondary` | `#475569` | Grafito | Secondary text, metadata |
| `--text-muted` | `#94A3B8` | Gris Tenue | Placeholders, disabled |
| `--border-subtil` | `#E2E0DE` | Borde Concreto | Borders low emphasis |
| `--border-medio` | `#D4D2D0` | Borde Acero | Borders standard |

**Surface elevation strategy:** Same hue (`#F7F5F3` base), shift lightness up for elevation. No shadows — borders only. Each level: +2-3% lightness.

**Status colors (BMW naming):**

| Status | HEX | Nombre |
|--------|-----|--------|
| reserved | `#1A3A8A` | Azul Señal |
| waiting | `#D4A017` | Amarillo Advertencia |
| in_progress | `#E3242B` | Rojo Competencia |
| ready | `#2E7D32` | Verde Meta |
| delivered | `#6B7280` | Gris Titanio |

---

## 3. Typography

| Uso | Font | Weight | Detalle |
|-----|------|--------|---------|
| Body | Inter | 400 / 500 | Legible, clean, industrial |
| Headings | Inter | 600 / 700 | Tight tracking `-0.02em` |
| **Workshop name (dashboard hero)** | **Playfair Display italic** | 700 italic | Cursiva nítida, prestigio automotriz |
| Data / Monospace | JetBrains Mono | 400 / 500 | Tabular numbers, prices, times |
| Labels / Small | Inter | 500 / 600 | Medium weight at small sizes |

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;1,700&family=JetBrains+Mono:wght@400;500&display=swap');
```

---

## 4. Depth Strategy

**Borders-only.** No shadows.

Base surface: `bg-concreto` (`#F7F5F3`)
Card/surface: `bg-superficie` (`#F0EEEC`)
Elevated (modals/dropdowns): `bg-elevado` (`#FFFFFF`)

Border weights:
- Low: `border-subtil` `#E2E0DE` — card separation, section dividers
- Standard: `border-medio` `#D4D2D0` — inputs, focus rings
- High: `color-azul-rey` — active states, primary button

---

## 5. Layout Architecture

### Sidebar
- Same background as canvas (`bg-concreto`)
- Separated only by `border-r border-subtil`
- Active: `bg-white` + `border-l-2 border-azul-rey` + `text-azul-rey font-medium`
- Inactive: `text-text-secondary hover:text-azul-rey hover:bg-white/50`
- Compact icons (h-4 w-4), label next to icon

### Header
- No separate header bar. Logo + user avatar integrated into sidebar top.
- Page title via PageHeader component.

### Dashboard Hero
- Top section: "Hola, [nombre taller cursiva]" as greeting
- Subtitle: fecha actual + "resumen del día" en text-secondary
- Debajo: métricas compactas con contexto

---

## 6. Component Design

### Cards
- Background: `bg-superficie` (`#F0EEEC`), `border border-subtil`, `rounded-lg`
- No shadows. Hover: `bg-white` + `border-medio` sutil
- Metric cards: compactos, con delta porcentual o sparkline inline
- Padding: `p-4` (compact) or `p-6` (standard)

### Buttons
- **Primary:** `bg-azul-rey` `text-white` `hover:bg-celeste-cielo` `rounded-md`
- **Outline:** `border border-medio` `text-text-primary` `hover:border-azul-rey hover:text-azul-rey`
- **Ghost:** `text-text-secondary` `hover:bg-white/50 hover:text-azul-rey`
- **Destructive:** `bg-rojo` `text-white` `hover:bg-red-700`
- Transitions: `transition-colors duration-150`

### Badges (Booking Status)
- Rounded-full
- Colored by status with STATUS_BADGE_CLASSES
- Updated to use BMW-inspired color names

### Inputs
- Background: `bg-white` (slightly darker than surface, "inset" feel)
- Border: `border border-medio`
- Focus: `ring-1 ring-azul-rey` `border-azul-rey`
- Placeholder: `text-muted`

### Calendar (Pizarra Magnética)
- Grid background: `bg-white`
- Hour slots: `border-b border-subtil`
- Booking blocks: rounded-md, with subtle border, shadow-like presence using `border-l-2` + border color matching status
- Day headers: `text-text-primary` with `text-azul-rey` for today
- Hover on empty slot: `bg-azul-rey/5`

### DonutChart
- Stroke colors: primary, secondary, celeste-cielo, per status
- Size variants: sm (48px), md (64px), lg (96px)

---

## 7. Animation

| Element | Type | Duration | Easing |
|---------|------|----------|--------|
| Page enter | fade-in + translateY(4px) | 250ms | ease-out |
| Hover (cards, rows) | background-color change | 150ms | ease |
| Button press | scale(0.97) | 100ms | ease |
| Dialog open | fade + scale(0.95→1) | 200ms | ease-out |
| Sidebar collapse | translateX | 200ms | ease |

All animations respect `prefers-reduced-motion`.

---

## 8. States

Every component handles: default, hover, active, focus, disabled.

Data states: loading (skeleton animate-pulse matching layout), empty (icon + message + optional CTA), error (toast + retry).

---

## 9. Implementation Order

1. **CSS tokens** — globals.css: colors, fonts, border-radius, animation tokens. Rebuild OKLCH tokens to new palette.
2. **Sidebar** — active state indicator with azul-rey left border, hover states
3. **Buttons** — update shadcn button variants to new palette
4. **Badges** — update STATUS_BADGE_CLASSES to new BMW-named colors
5. **Dashboard hero** — "Hola, [taller]" in Playfair Display italic + subtitle + compact metrics
6. **Cards** — update surface to `bg-superficie`, border to `border-subtil`
7. **Calendar** — pizarra magnética treatment for booking blocks
8. **Inputs / Select** — focus ring with azul-rey
9. **Dialogs** — lighter header, azul-rey primary button
10. **Tables** — hover bg-white, header bg-superficie
