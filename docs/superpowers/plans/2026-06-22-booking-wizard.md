# Booking Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans.

**Goal:** Replace booking dialog with embedded step-by-step wizard on `/[slug]`

**Architecture:** Single `BookingWizard` component managing 4 steps inline. Calendar availability computed client-side from business_hours + blocked_dates + bookings.

**Tech Stack:** Next.js App Router, Supabase, Tailwind v4

## Global Constraints

- Brand colors: azul-rey (#1A3A8A), celeste-cielo (#4A90D9), rojo (#E3242B), bg-concreto (#F7F5F3)
- Fonts: Inter (body), Playfair Display italic (display), JetBrains Mono (code)
- No external calendar/date libraries — manual grid generation
- Build must pass after each commit
- No modals — wizard embebido en página

---

### Task 1: DB Migration — deposit fields + supabase types

**Files:**
- Create: `supabase/migrations/20260622001_add_deposit_fields.sql`
- Modify: `src/lib/types.ts`

- [ ] Write migration

```sql
ALTER TABLE tenants
  ADD COLUMN deposit_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN deposit_type text CHECK (deposit_type IN ('percent', 'fixed')) DEFAULT 'percent',
  ADD COLUMN deposit_value numeric(10,0) DEFAULT NULL;
```

- [ ] Add types

```ts
// src/lib/types.ts — add to Tenant
deposit_enabled?: boolean
deposit_type?: "percent" | "fixed" | null
deposit_value?: number | null
```

- [ ] Run migration, generate types

- [ ] Commit

### Task 2: Calendar utility

**Files:**
- Create: `src/lib/calendar-utils.ts`

Generate calendar grid + compute available time slots for a given day.

- [ ] Write and implement

```ts
export interface CalendarDay {
  date: string
  dayOfMonth: number
  isCurrentMonth: boolean
  isAvailable: boolean
  isToday: boolean
  isPast: boolean
}

export function getCalendarGrid(year: number, month: number): CalendarDay[]

export function getAvailableSlots(
  date: string,
  businessHours: BusinessHour[],
  bookings: any[],
  blockedDates: string[]
): string[]
```

### Task 3: BookingWizard component

**Files:**
- Create: `src/components/booking/booking-wizard.tsx`
- Create: `src/components/booking/wizard-progress.tsx`

Main wizard orchestrating 4 steps. WizardProgress shows step indicator bar.

- [ ] Build all 4 steps + wizard container
- [ ] Commit

### Task 4: Rewrite page.tsx — embed wizard, remove dialog

**Files:**
- Modify: `src/app/[slug]/page.tsx`

Replace hero CTA button + Dialog with embedded BookingWizard. Hero section includes wizard card.

- [ ] Modify page.tsx
- [ ] Build passes
- [ ] Commit
- [ ] Push
