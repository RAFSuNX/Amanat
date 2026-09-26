import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"
import { streamFromR2 } from "@/lib/storage"
import { log } from "@/lib/audit"
import { unauthorized } from "@/lib/http"

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  const k = request.nextUrl.searchParams.get("k")
  if (!k) return NextResponse.json({ error: "Missing key" }, { status: 400 })

  let key: string
  try {
    key = Buffer.from(k, "base64url").toString("utf-8")
  } catch {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 })
  }

  // Reject anything that tries to path-traverse out of the KYC folder
  if (!key.startsWith("volunteers/kyc-") || key.includes("..")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const doc = await streamFromR2(key)
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

  // Log every access — admin, IP, which key, when
  await log({
    userId: session.user.id,
    userName: session.user.name,
    userRole: "ADMIN",
    action: "KYC_DOCUMENT_ACCESSED",
    resourceType: "kyc_document",
    details: { key, ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown" },
    request,
  })

  return new Response(doc.body, {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
      // Private — no caching anywhere, no storing in browser
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
