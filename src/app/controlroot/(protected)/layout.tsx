import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

export default async function AdminboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value

  if (!token) {
    redirect("/controlroot/login")
  }

  const supabase = createAdminClient()

  const { data: session } = await supabase
    .from("admin_sessions")
    .select("id")
    .eq("token", token)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle()

  if (!session) {
    redirect("/controlroot/login")
  }

  return <>{children}</>
}
