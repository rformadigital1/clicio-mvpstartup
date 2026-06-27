import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from("admin_sessions")
    .select("id, expires_at")
    .gte("expires_at", new Date().toISOString())
    .limit(1)

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true })
}
