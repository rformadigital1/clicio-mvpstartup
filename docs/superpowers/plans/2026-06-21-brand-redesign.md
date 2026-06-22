# Brand Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform all-white shadcn dashboard into BMW M-inspired industrial design with azul-rey/celeste-cielo/rojo palette, Playfair Display italic for workshop name, and pizarra magnética calendar.

**Architecture:** CSS custom properties for palette (extends shadcn CSS vars), Tailwind v4 `@theme` for utility classes, inline status constants for non-Tailwind usage (calendar grid). Each task is independently verifiable via `npm run build`.

**Tech Stack:** Next.js 15, Tailwind v4, shadcn/ui, CSS custom properties

## Global Constraints

- No JS runtime color manipulation — all colors are static CSS vars or constants
- All status colors sourced from `src/lib/booking-constants.ts` — never inline
- shadcn component variants preserved — only CSS variable values change
- Build must pass after every task (`npm run build`)
- `prefers-reduced-motion` respected for all animations

---

## File Structure

| File | Role |
|------|------|
| `src/app/globals.css` | CSS custom properties, Tailwind theme, font imports, animations |
| `src/lib/booking-constants.ts` | Status colors (hex for calendar grid, Tailwind classes for Badge) |
| `src/app/dashboard/layout.tsx` | Sidebar active state with azul-rey border, logo area |
| `src/app/dashboard/page.tsx` | Dashboard hero greeting + compact metrics |
| `src/app/dashboard/calendar/page.tsx` | Booking block styling (pizarra magnética) |
| `.interface-design/system.md` | Update tokens section |

---

### Task 1: CSS Tokens + Fonts + Custom Colors

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: (none — ground-up rewrite of CSS vars)
- Produces: New shadcn CSS vars + custom Tailwind color tokens (`azul-rey`, `celeste-cielo`, `rojo`, `bg-concreto`, `bg-superficie`, `border-subtil`, `border-medio`) + font-family tokens

- [ ] **Step 1: Replace globals.css content**

Write full file:

```css
@import "tailwindcss";
@import "tailwindcss-animate";

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@custom-variant dark (&:is(.dark *));

:root {
  --background: #F7F5F3;
  --foreground: #0F172A;
  --card: #F0EEEC;
  --card-foreground: #0F172A;
  --popover: #FFFFFF;
  --popover-foreground: #0F172A;
  --primary: #1A3A8A;
  --primary-foreground: #FFFFFF;
  --secondary: #4A90D9;
  --secondary-foreground: #FFFFFF;
  --muted: #F0EEEC;
  --muted-foreground: #475569;
  --accent: #FFFFFF;
  --accent-foreground: #1A3A8A;
  --destructive: #E3242B;
  --destructive-foreground: #FFFFFF;
  --border: #E2E0DE;
  --input: #D4D2D0;
  --ring: #1A3A8A;
  --radius: 0.625rem;
}

.dark {
  --background: #0F172A;
  --foreground: #F8FAFC;
  --card: #1E293B;
  --card-foreground: #F8FAFC;
  --popover: #1E293B;
  --popover-foreground: #F8FAFC;
  --primary: #4A90D9;
  --primary-foreground: #0F172A;
  --secondary: #1A3A8A;
  --secondary-foreground: #F8FAFC;
  --muted: #1E293B;
  --muted-foreground: #94A3B8;
  --accent: #1E293B;
  --accent-foreground: #4A90D9;
  --destructive: #EF4444;
  --destructive-foreground: #F8FAFC;
  --border: #334155;
  --input: #334155;
  --ring: #4A90D9;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-azul-rey: #1A3A8A;
  --color-celeste-cielo: #4A90D9;
  --color-rojo: #E3242B;
  --color-bg-concreto: #F7F5F3;
  --color-bg-superficie: #F0EEEC;
  --color-border-subtil: #E2E0DE;
  --color-border-medio: #D4D2D0;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-display: 'Playfair Display', serif;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground overflow-x-hidden;
  }
}

@layer utilities {
  .animated-gradient {
    background: linear-gradient(-45deg, #1A3A8A, #4A90D9, #E3242B, #1A3A8A);
    background-size: 400% 400%;
    animation: gradient-shift 15s ease infinite;
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: Build passes. Any 404s on the CSS `@import` are expected to resolve at runtime.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "design: BMW M palette, font imports, custom color tokens"
```

---

### Task 2: Status Colors — BMW Named Palette

**Files:**
- Modify: `src/lib/booking-constants.ts`

**Interfaces:**
- Consumes: (none — standalone constants file)
- Produces: Updated STATUS_COLORS, STATUS_TEXT_COLORS, STATUS_BADGE_CLASSES

- [ ] **Step 1: Write new booking-constants.ts**

Change all hex colors and Tailwind classes to BMW M-inspired palette:

| Status | hex bg | hex text | Tailwind badge class |
|--------|--------|----------|---------------------|
| reserved | `#DBEAFE` (same, maps to azul-rey) | `#1A3A8A` | `bg-azul-rey/10 text-azul-rey` |
| waiting | `#FEF3C7` (same, maps to amber) | `#B45309` | `bg-amber-100 text-amber-800` |
| in_progress | `#FEE2E2` (light red) | `#E3242B` | `bg-rojo/10 text-rojo` |
| ready | `#DCFCE7` (same, maps to green) | `#166534` | `bg-green-100 text-green-800` |
| delivered | `#F3F4F6` (same, maps to gray) | `#4B5563` | `bg-gray-100 text-gray-700` |

```ts
import type { BookingStatus } from "@/lib/types"

export const STATUS_LABELS: Record<BookingStatus, string> = {
  reserved: "Reservado",
  waiting: "Esperando",
  in_progress: "En progreso",
  ready: "Listo",
  delivered: "Entregado",
}

export const STATUS_COLORS: Record<BookingStatus, string> = {
  reserved: "#dbeafe",
  waiting: "#fef3c7",
  in_progress: "#fee2e2",
  ready: "#dcfce7",
  delivered: "#f3f4f6",
}

export const STATUS_TEXT_COLORS: Record<BookingStatus, string> = {
  reserved: "#1a3a8a",
  waiting: "#b45309",
  in_progress: "#e3242b",
  ready: "#166534",
  delivered: "#4b5563",
}

export const STATUS_BADGE_CLASSES: Record<BookingStatus, string> = {
  reserved: "bg-azul-rey/10 text-azul-rey",
  waiting: "bg-amber-100 text-amber-800",
  in_progress: "bg-rojo/10 text-rojo",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-700",
}
```

Note: `bg-azul-rey/10` and `bg-rojo/10` work because we defined `--color-azul-rey` and `--color-rojo` in the `@theme inline` block. Tailwind v4 automatically generates opacity variants for custom colors.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: Build passes. Badge colors update across all pages that show booking status.

- [ ] **Step 3: Commit**

```bash
git add src/lib/booking-constants.ts
git commit -m "design: BMW M status colors for badges and calendar grid"
```

---

### Task 3: Sidebar Active State

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

**Interfaces:**
- Consumes: CSS custom properties from Task 1 (`--color-azul-rey`, accent tokens)
- Produces: Sidebar with azul-rey left border on active item

- [ ] **Step 1: Update the active item className**

Change line ~156-159 in layout.tsx. Current:
```tsx
const isActive = itemPath === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(itemPath)
return (
  <Link
    key={item.href}
    href={item.href}
    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive
        ? "bg-accent text-accent-foreground font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`}
```

Change to:
```tsx
const isActive = itemPath === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(itemPath)
return (
  <Link
    key={item.href}
    href={item.href}
    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive
        ? "bg-white text-azul-rey font-medium border-l-2 border-azul-rey rounded-none rounded-r-lg"
        : "text-muted-foreground hover:text-foreground hover:bg-white/50"
    }`}
```

Also change main wrapper `bg-muted/30` to `bg-bg-concreto` and `aside` border to `border-subtil` if desired. These will come from the updated CSS vars automatically through shadcn vars. The sidebar `aside` uses `border-r bg-background` — since `--background` is now `#F7F5F3` (concreto), the sidebar already matches the canvas.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: Build passes. Sidebar active nav item shows azul-rey left border.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "design: sidebar active state with azul-rey left border"
```

---

### Task 4: Dashboard Hero Greeting

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `--font-display` from globals.css, tenant name from Supabase
- Produces: Dashboard page with "Hola, [taller]" greeting in Playfair Display italic

- [ ] **Step 1: Add state for tenant name**

In the existing state block (around line 18-24), add `tenantName`:
```tsx
const [tenantName, setTenantName] = useState("")
```

- [ ] **Step 2: Fetch tenant name in loadData**

After setting `tenantId` and before the role check, add:
```tsx
const { data: tenantData } = await supabase
  .from("tenants")
  .select("name")
  .eq("id", profile.tenant_id)
  .single()
if (tenantData) setTenantName(tenantData.name)
```

- [ ] **Step 3: Replace PageHeader with Hero greeting**

Find:
```tsx
<PageHeader title="Dashboard" />
```

Replace with:
```tsx
<div className="mb-8">
  <h1 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)] italic font-bold text-foreground">
    Hola, {tenantName.toLowerCase()}
  </h1>
  <p className="text-muted-foreground mt-1">
    {new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} — Resumen del día
  </p>
</div>
```

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: Build passes. Dashboard shows "Hola, [nombre taller]" in Playfair Display italic.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "design: dashboard hero greeting in Playfair Display italic"
```

---

### Task 5: Calendar Pizarra Magnética Blocks

**Files:**
- Modify: `src/app/dashboard/calendar/page.tsx`

**Interfaces:**
- Consumes: STATUS_COLORS, STATUS_TEXT_COLORS from booking-constants.ts
- Produces: Booking blocks styled as magnetic board cards with left accent border and subtle shadow

- [ ] **Step 1: Update booking block style**

Find the booking block div (lines ~438-462). Current style:
```tsx
style={{
  top: topPx,
  height: Math.max(heightPx, 24),
  left: `calc(60px + ${col - 1} * (100% - 60px) / 7 + 4px)`,
  width: `calc((100% - 60px) / 7 - 8px)`,
  backgroundColor: STATUS_COLORS[status] ?? "#e5e7eb",
  color: STATUS_TEXT_COLORS[status] ?? "#374151",
  borderColor: STATUS_TEXT_COLORS[status] ?? "#374151",
}}
```

Change to:
```tsx
style={{
  top: topPx,
  height: Math.max(heightPx, 24),
  left: `calc(60px + ${col - 1} * (100% - 60px) / 7 + 4px)`,
  width: `calc((100% - 60px) / 7 - 8px)`,
  backgroundColor: STATUS_COLORS[status] ?? "#e5e7eb",
  color: STATUS_TEXT_COLORS[status] ?? "#374151",
  borderLeft: `3px solid ${STATUS_TEXT_COLORS[status] ?? "#374151"}`,
}}
```

And update the className to add `shadow-sm`:
```tsx
className="absolute left-0 right-0 mx-1 rounded px-1 sm:px-2 py-1 text-[10px] sm:text-xs overflow-hidden cursor-pointer border hover:opacity-80 transition-opacity z-20 shadow-sm"
```
Remove the `borderColor` from inline style (replaced by borderLeft).

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: Build passes. Calendar booking blocks now have left accent color bar and shadow-sm presence.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/calendar/page.tsx
git commit -m "design: calendar blocks as pizarra magnética with left accent border"
```

---

### Task 6: Update system.md

**Files:**
- Modify: `.interface-design/system.md`

- [ ] **Step 1: Update tokens section with new palette names**

Replace existing colors section with:
```
## Tokens

### Brand Colors
- `--color-azul-rey` `#1A3A8A` — Primary, buttons, links, active states
- `--color-celeste-cielo` `#4A90D9` — Secondary, hover, highlights
- `--color-rojo` `#E3242B` — Destructive, in_progress status, alerts

### Neutral
- `--color-bg-concreto` `#F7F5F3` — Page background
- `--color-bg-superficie` `#F0EEEC` — Card/surface background
- `--color-border-subtil` `#E2E0DE` — Low emphasis borders
- `--color-border-medio` `#D4D2D0` — Standard borders

### Depth Strategy
Borders-only. Surface color shifts for elevation. No shadows (except calendar booking blocks which use shadow-sm for magnetic board effect).

### Typography
- Body: Inter (--font-sans)
- Display/Headings: Playfair Display italic (--font-display) — used for workshop name on dashboard
- Data/Monospace: JetBrains Mono (--font-mono)
```

- [ ] **Step 2: Commit**

```bash
git add .interface-design/system.md
git commit -m "docs: update system.md with new brand tokens"
```
