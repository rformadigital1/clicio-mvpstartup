import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: valid } = await supabase.rpc("verify_admin_password", {
    p_username: username,
    p_password: password,
  })

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

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
    path: "/adminboard",
    maxAge: 60 * 60 * 24,
  })

  return response
}
