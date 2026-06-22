# Clicio Design System

## Direction

- **Human:** Dueño de taller automotriz o staff. Abre la app desde su teléfono/tablet entre trabajos. Antes estuvo con un cliente, después pasará al taller. Quiere respuestas rápidas: "quién viene hoy", "qué falta", "estado del trabajo".
- **Task:** Gestionar agenda diaria, registrar clientes, avanzar bookings por el flujo del taller.
- **Feel:** Industrial but approachable. Como tablero de taller bien organizado — concreto limpio, herramientas profesionales. Inspiración BMW M: azul rey, celeste cielo, rojo.

## Token Architecture

### Brand Colors (globals.css)
- `--color-azul-rey` `#1A3A8A` — Primary, buttons, links, active states
- `--color-celeste-cielo` `#4A90D9` — Secondary, hover, highlights
- `--color-rojo` `#E3242B` — Destructive, in_progress status, alerts

### Neutral
- `--color-bg-concreto` `#F7F5F3` — Page background
- `--color-bg-superficie` `#F0EEEC` — Card/surface background
- `--color-border-subtil` `#E2E0DE` — Low emphasis borders
- `--color-border-medio` `#D4D2D0` — Standard borders

### Standard shadcn CSS vars
- `--background`, `--foreground` + hierarchy (`--muted-foreground`, etc.)

### Status Colors
Definidos en `src/lib/booking-constants.ts`. Tres formatos:
- `STATUS_COLORS` — hex backgrounds (inline styles en calendar grid)
- `STATUS_TEXT_COLORS` — hex text/border
- `STATUS_BADGE_CLASSES` — tailwind classes para `<Badge>`

Usar siempre desde el import, nunca inline.

### Typography
- Body: Inter (--font-sans)
- Data/Monospace: JetBrains Mono (--font-mono) — tabular numbers, prices, times
- Display: Playfair Display italic (--font-display) — workshop name on dashboard hero

### Spacing
- Base unit: 4px (Tailwind defaults)
- Page padding: `p-4 md:p-6`
- Card padding: `p-6`
- Section gap: `mb-6`

### Depth Strategy
Borders-only + surface color shifts. No shadows (except calendar booking blocks use shadow-sm for magnetic board effect).

- Base surface: bg-bg-concreto
- Card surface: bg-bg-superficie
- Elevated (modals/dropdowns): bg-white
- Hover: bg-white/50
- Active/Selected: bg-white text-azul-rey border-l-2 border-azul-rey

### Border Radius
- `rounded-lg` — cards, dialogs, sidebar
- `rounded-md` — inputs, buttons
- `rounded-full` — avatars, badges

## Navigation

### Sidebar
- Background: same as canvas (bg-bg-concreto) with border-r border-subtil
- Active state: bg-white text-azul-rey border-l-2 border-azul-rey rounded-none rounded-r-lg
- Inactive: text-muted-foreground hover:text-azul-rey hover:bg-white/50
- Icon size: h-4 w-4

### Header
- Sticky top, `border-b bg-background`
- Logo left, avatar right
- Mobile: hamburger toggle sidebar

## Page Patterns

### Standard Page Layout
1. `PageHeader` — título + toolbar (acciones, filtros)
2. Content area — cards, grid, tabla según necesidad

### Loading State
- `Skeleton` components con `animate-pulse`
- Grid/cards layout matching final structure

### Empty State
- Icon (lucide, `h-12 w-12`)
- Text title + description
- Action button if applicable

### Error State
- Toast notification (via `use-toast`)
- Descriptive message, never raw error

## Component Patterns

### Cards
- All same surface treatment: `border`, `rounded-lg`, `p-6` card/header/content
- Icon alongside title for visual scan

### Badges
- Colored by BookingStatus via `STATUS_BADGE_CLASSES`
- Always `rounded-full` or `rounded` depending on shadcn variant

### Dialogs
- Max width: default shadcn value
- Header: title only (no description unless needed)
- Form: `space-y-4` with full-width submit button

### Tables
- `w-full text-sm`, `border-b` rows
- Hover state: `hover:bg-muted/40`
- Clickable rows: `cursor-pointer`

### Form Controls
- Inputs, Selects, Labels from shadcn/ui
- Single column forms preferred
- Two-column grid for date+time

## Status Flow (Booking)
Reservado → Esperando → En progreso → Listo → Entregado

Color mapping (BMW M-inspired):
- reserved: Azul Señal (azul-rey)
- waiting: Amarillo Advertencia (amber)
- in_progress: Rojo Competencia (rojo)
- ready: Verde Meta (green)
- delivered: Gris Titanio (gray)

## Animation
- `animate-fade-in` para page transitions
- No spring/bounce
- Hover transitions: `transition-colors` or `transition-opacity` (150ms)

## Mobile
- Sidebar hidden by default, overlay with backdrop blur
- Calendar: responsive grid, horizontal scroll
- Tables: `overflow-x-auto` for horizontal scroll
