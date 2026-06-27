import { createClient } from "@/lib/supabase/server"

export type TenantStatus = "trial" | "active" | "paused" | "cancelled"

export interface TenantAccess {
  allowed: boolean
  status: TenantStatus
  trialEndsAt: string | null
  daysRemaining: number | null
}

export async function getTenantStatus(userId: string): Promise<TenantAccess | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single()

  if (!profile) return null

  const { data: tenant } = await supabase
    .from("tenants")
    .select("status, trial_ends_at")
    .eq("id", profile.tenant_id)
    .single()

  if (!tenant) return null

  let daysRemaining: number | null = null
  if (tenant.trial_ends_at) {
    const end = new Date(tenant.trial_ends_at)
    const now = new Date()
    daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  return {
    allowed: tenant.status === "trial" || tenant.status === "active",
    status: tenant.status as TenantStatus,
    trialEndsAt: tenant.trial_ends_at,
    daysRemaining,
  }
}

export function getTrialMessage(daysRemaining: number | null, status: TenantStatus): string | null {
  if (status === "paused" || status === "cancelled") return null
  if (daysRemaining === null || daysRemaining > 7) return null
  if (daysRemaining === 0) return "Prueba finalizada. Contacta a tu asesor para activar tu plan."
  if (daysRemaining === 1) return "Último día de prueba. Regula tu situación para seguir usando CLICIO."
  return `Te quedan ${daysRemaining} días de prueba gratuita.`
}
