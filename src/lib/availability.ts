import { createClient } from "@/lib/supabase/client"

export interface AvailabilityResult {
  available: boolean
  reason?: string
}

export async function checkAvailability(
  tenantId: string,
  date: string,
  time: string,
  serviceIds?: string[]
): Promise<AvailabilityResult> {
  const supabase = createClient()
  const [yr, mo, dy] = date.split("-").map(Number)
  const dayOfWeek = new Date(yr, mo - 1, dy).getDay()

  // Check if tenant has ANY hours configured
  const { count: totalHours } = await supabase
    .from("business_hours")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)

  if (totalHours && totalHours > 0) {
    const { data: hours } = await supabase
      .from("business_hours")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle()

    if (!hours) return { available: false, reason: "Cerrado este día" }
    if (!hours.is_open) return { available: false, reason: "Cerrado este día" }

    const bookingTime = time.slice(0, 5)
    if (bookingTime < hours.open_time.slice(0, 5) || bookingTime >= hours.close_time.slice(0, 5)) {
      return { available: false, reason: "Fuera del horario de atención" }
    }
  }

  // Check blocked dates
  const { count: totalBlocked } = await supabase
    .from("blocked_dates")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)

  if (totalBlocked && totalBlocked > 0) {
    const { data: blocked } = await supabase
      .from("blocked_dates")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("date", date)
      .maybeSingle()

    if (blocked) return { available: false, reason: "Fecha bloqueada" }
  }

  // Skip slot validation if no serviceIds provided (backwards compat)
  if (!serviceIds || serviceIds.length === 0) {
    return { available: true }
  }

  // Calculate total duration of selected services
  const { data: services } = await supabase
    .from("services")
    .select("duration")
    .in("id", serviceIds)

  if (!services || services.length === 0) return { available: false, reason: "Servicios no encontrados" }

  const hasDuration = services.some(s => s.duration != null && s.duration > 0)
  if (!hasDuration) return { available: true } // No duration data → skip capacity check

  const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0)

  // Calculate new booking slot in minutes from midnight
  const [h, m] = time.split(":").map(Number)
  const newStart = h * 60 + m
  const newEnd = newStart + totalDuration

  // Get existing bookings for the day with their services
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("booking_time, booking_services(service_id)")
    .eq("tenant_id", tenantId)
    .eq("booking_date", date)
    .neq("status", "cancelled")

  if (!existingBookings) return { available: true }

  // Collect all service IDs from existing bookings
  const existingServiceIds = new Set<string>()
  for (const b of existingBookings) {
    for (const bs of (b.booking_services as any[]) || []) {
      if (bs.service_id) existingServiceIds.add(bs.service_id)
    }
  }

  // Get durations for all services used today
  const { data: allSvc } = existingServiceIds.size > 0
    ? await supabase.from("services").select("id, duration").in("id", Array.from(existingServiceIds))
    : { data: [] }
  const durationMap: Record<string, number> = {}
  if (allSvc) {
    for (const s of allSvc) {
      if (s.duration) durationMap[s.id] = s.duration
    }
  }

  for (const booking of existingBookings) {
    if (!booking.booking_time) continue
    const [bh, bm] = booking.booking_time.slice(0, 5).split(":").map(Number)
    const bStart = bh * 60 + bm
    let bDuration = 0
    for (const bs of (booking.booking_services as any[]) || []) {
      bDuration += durationMap[bs.service_id] || 60
    }
    const bEnd = bStart + (bDuration || 60)

    // Overlap: newStart < bEnd AND newEnd > bStart
    if (newStart < bEnd && newEnd > bStart) {
      return { available: false, reason: "Horario ocupado" }
    }
  }

  return { available: true }
}
