import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTenantStatus, getTrialMessage } from "@/lib/tenant-guard"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ show: false, message: null })

  const access = await getTenantStatus(user.id)
  if (!access) return NextResponse.json({ show: false, message: null })

  if (access.status !== "trial") return NextResponse.json({ show: false, message: null })

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (!profile) return NextResponse.json({ show: false, message: null })

  const today = new Date().toISOString().split("T")[0]
  const { data: existing } = await supabase
    .from("trial_notifications")
    .select("id")
    .eq("tenant_id", profile.tenant_id)
    .eq("last_notified_at", today)
    .maybeSingle()

  if (existing) return NextResponse.json({ show: false, message: null })

  const message = getTrialMessage(access.daysRemaining, access.status)
  return NextResponse.json({ show: message !== null, message })
}
