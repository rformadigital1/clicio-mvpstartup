import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ALLOWED_REDIRECTS = ["/dashboard", "/dashboard/calendar", "/dashboard/reports", "/dashboard/ingresos", "/dashboard/customers", "/dashboard/services", "/dashboard/settings"]

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next") ?? "/dashboard"

  let next = "/dashboard"
  if (rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")) {
    const url = new URL(`${origin}${rawNext}`)
    if (url.origin === origin || ALLOWED_REDIRECTS.some(p => rawNext.startsWith(p))) {
      next = rawNext
    }
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth`)
}
