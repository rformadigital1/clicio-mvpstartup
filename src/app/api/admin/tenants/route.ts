import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createClient()

  const { data: session } = await supabase
    .from("admin_sessions")
    .select("id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name, slug, email, status, trial_ends_at, notes, created_at")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = new Date()
  const enriched = tenants.map((t) => ({
    ...t,
    days_remaining: t.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(t.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null,
  }))

  return NextResponse.json(enriched)
}
