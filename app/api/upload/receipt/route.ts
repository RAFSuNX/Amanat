import { NextRequest, NextResponse } from "next/server"
import { uploadToR2 } from "@/lib/storage"
import { randomUUID } from "crypto"
import { getSession } from "@/lib/session"
import { log } from "@/lib/audit"

// Receipt upload is intentionally open to guests (anonymous donors can upload too).
// Protection: 5MB limit, image-only, random key (no overwrite possible).
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  // Strict image-only - no PDF, no other types
  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP or GIF images accepted." }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 400 })
  }

  const ext = file.type.split("/")[1]
  const key = `donations/receipts/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadToR2(buffer, key, file.type)

  // Log if session exists (linked donors); skip for guests
  const session = await getSession()
  if (session) {
    await log({ userId: session.user.id, userName: session.user.name,
      action: "DONATION_SUBMITTED", resourceType: "receipt", details: { key }, request })
  }

  return NextResponse.json({ url })
}
