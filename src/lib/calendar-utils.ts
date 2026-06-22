import type { BusinessHour } from "@/lib/types"

export interface CalendarDay {
  date: string
  dayOfMonth: number
  isCurrentMonth: boolean
  isAvailable: boolean
  isToday: boolean
  isPast: boolean
}

export function getCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDow = firstDay.getDay()

  const grid: CalendarDay[] = []

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    grid.push({ date, dayOfMonth: d, isCurrentMonth: false, isAvailable: false, isToday: false, isPast: true })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    const dt = new Date(year, month, d)
    grid.push({ date, dayOfMonth: d, isCurrentMonth: true, isAvailable: false, isToday: dt.getTime() === today.getTime(), isPast: dt < today })
  }

  const remaining = 42 - grid.length
  for (let d = 1; d <= remaining; d++) {
    const dt = new Date(year, month + 1, d)
    const date = `${year}-${String(month + 2).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    grid.push({ date, dayOfMonth: d, isCurrentMonth: false, isAvailable: false, isToday: false, isPast: dt < today })
  }

  return grid
}

export function getAvailableSlots(
  date: string,
  businessHours: BusinessHour[],
  blockedDates: string[]
): string[] {
  if (blockedDates.includes(date)) return []

  const [yr, mo, dy] = date.split("-").map(Number)
  const dayOfWeek = new Date(yr, mo - 1, dy).getDay()

  const hours = businessHours.find(h => h.day_of_week === dayOfWeek)
  if (!hours || !hours.is_open) return []

  const [openH, openM] = hours.open_time.split(":").map(Number)
  const [closeH, closeM] = hours.close_time.split(":").map(Number)
  const openMin = openH * 60 + openM
  const closeMin = closeH * 60 + closeM

  const slots: string[] = []
  for (let m = openMin; m + 30 <= closeMin; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0")
    const mm = String(m % 60).padStart(2, "0")
    slots.push(`${hh}:${mm}`)
  }

  return slots
}
