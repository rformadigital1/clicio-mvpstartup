import { createClient } from "@/lib/supabase/client"

export async function checkAvailability(
  tenantId: string,
  date: string,
  time: string
): Promise<{ available: boolean; reason?: string }> {
  const supabase = createClient()
  const dayOfWeek = new Date(date + "T12:00:00").getDay()

  // Check if tenant has ANY hours configured
  const { count: totalHours } = await supabase
    .from("business_hours")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)

  if (totalHours && totalHours > 0) {
    // Hours configured: validate against specific day
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
  // No hours configured → no restriction (backwards compatible)

  // Check blocked dates (only if any exist for this tenant)
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

  return { available: true }
}
