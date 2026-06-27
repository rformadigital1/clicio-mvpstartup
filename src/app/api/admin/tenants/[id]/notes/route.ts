import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params
  const { notes } = await req.json()

  const { error } = await supabase
    .from("tenants")
    .update({ notes })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
