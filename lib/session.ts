import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest } from "next/server"

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function getSessionFromRequest(request: NextRequest) {
  return auth.api.getSession({ headers: request.headers })
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

export async function requireVolunteer() {
  const session = await getSession()
  if (!session || !["ADMIN", "VOLUNTEER"].includes(session.user.role as string))
    return null
  return session
}
