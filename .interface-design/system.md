# Clicio Design System

## Direction

- **Human:** Dueño de taller automotriz o staff. Abre la app desde su teléfono/tablet entre trabajos. Antes estuvo con un cliente, después pasará al taller. Quiere respuestas rápidas: "quién viene hoy", "qué falta", "estado del trabajo".
- **Task:** Gestionar agenda diaria, registrar clientes, avanzar bookings por el flujo del taller.
- **Feel:** Industrial but approachable. Como tablero de taller bien organizado — concreto, metal, limpio. Naranja/azul como acentos de herramientas profesionales.

## Token Architecture

### Colors
Tokens definidos en `globals.css` via OKLCH. Sin hex values sueltos en páginas.

- `--background`, `--foreground` + hierarchy (`--muted-foreground`, etc.)
- `--primary` + `--primary-foreground`
- `--accent` + `--accent-foreground` (sidebar active, highlights)
- `--destructive` + `--destructive-foreground`
- `--border` / `--input` / `--ring`

### Status Colors
Definidos en `src/lib/booking-constants.ts`. Tres formatos:
- `STATUS_COLORS` — hex backgrounds (inline styles en calendar grid)
- `STATUS_TEXT_COLORS` — hex text/border
- `STATUS_BADGE_CLASSES` — tailwind classes para `<Badge>`

Usar siempre desde el import, nunca inline.

### Typography
- Font: Geist Sans (body), Geist Mono (data/monospace)
- Hierarchy: size + weight + tracking, no solo size

### Spacing
- Base unit: 4px (Tailwind defaults)
- Page padding: `p-4 md:p-6`
- Card padding: `p-6`
- Section gap: `mb-6`

### Depth Strategy
Borders + subtle surface color shifts. Sin shadows.

- Base surface: `bg-background`
- Elevated: `bg-background` + `border`
- Hover: `bg-muted/40`
- Active/Selected: `bg-accent`

### Border Radius
- `rounded-lg` — cards, dialogs, sidebar
- `rounded-md` — inputs, buttons
- `rounded-full` — avatars, badges

## Navigation

### Sidebar
- Background: same as canvas (`bg-background`) with `border-r`
- Active state: `bg-accent text-accent-foreground font-medium`
- Inactive: `text-muted-foreground hover:text-foreground hover:bg-muted`
- Icon size: `h-4 w-4`

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

Color mapping:
- reserved: blue
- waiting: yellow
- in_progress: orange
- ready: green
- delivered: gray

## Animation
- `animate-fade-in` para page transitions
- No spring/bounce
- Hover transitions: `transition-colors` or `transition-opacity` (150ms)

## Mobile
- Sidebar hidden by default, overlay with backdrop blur
- Calendar: responsive grid, horizontal scroll
- Tables: `overflow-x-auto` for horizontal scroll
