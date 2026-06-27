import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)

  const url = request.nextUrl.pathname

  if (url.startsWith("/dashboard") && !url.startsWith("/dashboard/suspended")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

      if (profile) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("status")
          .eq("id", profile.tenant_id)
          .single()

        if (tenant && (tenant.status === "paused" || tenant.status === "cancelled")) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = "/dashboard/suspended"
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
