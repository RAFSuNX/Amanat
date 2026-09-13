import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/session"

const ADMIN_PATHS = ["/admin"]
const VOLUNTEER_PATHS = ["/volunteer"]
const AUTH_PATHS = ["/login", "/register"]

// Where to send a signed-in user (used to bounce them off the auth pages).
function homeFor(role: string) {
  if (role === "ADMIN") return "/admin"
  if (role === "VOLUNTEER") return "/volunteer"
  return "/account"
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p))
  const isVolunteerPath = VOLUNTEER_PATHS.some((p) => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (!isAdminPath && !isVolunteerPath && !isAuthPath) return NextResponse.next()

  const session = await getSessionFromRequest(request)

  // Already signed in? Don't show login/register — send them to their area.
  if (isAuthPath) {
    if (session) return NextResponse.redirect(new URL(homeFor(session.user.role), request.url))
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAdminPath && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (isVolunteerPath && !["ADMIN", "VOLUNTEER"].includes(session.user.role)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/volunteer/:path*", "/login", "/register"],
}
