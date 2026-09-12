import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/session"

const ADMIN_PATHS = ["/admin"]
const VOLUNTEER_PATHS = ["/volunteer"]
const AUTH_PATHS = ["/login", "/register"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p))
  const isVolunteerPath = VOLUNTEER_PATHS.some((p) => pathname.startsWith(p))

  if (!isAdminPath && !isVolunteerPath) return NextResponse.next()

  const session = await getSessionFromRequest(request)

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
  matcher: ["/admin/:path*", "/volunteer/:path*"],
}
