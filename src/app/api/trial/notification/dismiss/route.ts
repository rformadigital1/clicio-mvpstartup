import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 })

  const today = new Date().toISOString().split("T")[0]

  await supabase
    .from("trial_notifications")
    .insert({ tenant_id: profile.tenant_id, last_notified_at: today })
    .maybeSingle()

  return NextResponse.json({ ok: true })
}
