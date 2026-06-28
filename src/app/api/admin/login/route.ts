import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { headers } from "next/headers"

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export async function POST(req: Request) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
  }

  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headersList.get("x-real-ip")
    || "unknown"

  const supabase = createAdminClient()

  const { count } = await supabase
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("username", username)
    .eq("ip_address", ip)
    .eq("success", false)
    .gte("attempted_at", new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString())

  if (count && count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  const { data: valid } = await supabase.rpc("verify_admin_password", {
    p_username: username,
    p_password: password,
  })

  await supabase.from("login_attempts").insert({
    username,
    ip_address: ip,
    success: !!valid,
  })

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  await supabase.from("admin_sessions").delete().lt("expires_at", new Date().toISOString())

  const { data: session } = await supabase
    .from("admin_sessions")
    .insert({})
    .select("token")
    .single()

  if (!session) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set("admin_token", session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  return response
}
