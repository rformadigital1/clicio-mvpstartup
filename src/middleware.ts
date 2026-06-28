import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const ALLOWED_ORIGINS = [
  "clicio.app",
  "clicio-mvpstartup.vercel.app",
  "localhost:3000",
  "localhost:54321",
]

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return false
  try {
    const host = new URL(origin).host
    return ALLOWED_ORIGINS.some(
      (o) => host === o || host.endsWith("." + o) || host.endsWith(":" + o.split(":")[1])
    )
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, method } = request.nextUrl

  if ((pathname.startsWith("/api/admin") || pathname.startsWith("/api/tenant")) && ["POST", "PUT", "DELETE"].includes(method)) {
    if (request.headers.get("origin") && !isSameOrigin(request)) {
      return new NextResponse(JSON.stringify({ error: "CSRF" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

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
          .select("status, trial_ends_at")
          .eq("id", profile.tenant_id)
          .single()

        if (tenant) {
          const isExpired = tenant.status === "trial" && tenant.trial_ends_at && new Date(tenant.trial_ends_at) < new Date()
          if (tenant.status === "paused" || tenant.status === "cancelled" || isExpired) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = "/dashboard/suspended"
            return NextResponse.redirect(redirectUrl)
          }
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
