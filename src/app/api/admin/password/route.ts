import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function PUT(req: Request) {
  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from("admin_sessions")
    .select("id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle()

  if (!sessions) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: admin } = await supabase
    .from("super_admin")
    .select("username, password_hash")
    .limit(1)
    .single()

  if (!admin) return NextResponse.json({ error: "No admin" }, { status: 500 })

  const { data: valid } = await supabase.rpc("verify_admin_password", {
    p_username: admin.username,
    p_password: currentPassword,
  })

  if (!valid) {
    return NextResponse.json({ error: "Current password is wrong" }, { status: 401 })
  }

  const { error } = await supabase
    .from("super_admin")
    .update({ password_hash: `pending_rehash_${newPassword}` })
    .eq("id", (await supabase.from("super_admin").select("id").limit(1).single()).data?.id)

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 })

  return NextResponse.json({ ok: true })
}
