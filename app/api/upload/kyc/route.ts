import { NextRequest, NextResponse } from "next/server"
import { requireVolunteer } from "@/lib/session"
import { uploadToR2 } from "@/lib/storage"
import { randomUUID } from "crypto"

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40)
}

// type=document → volunteers/kyc-documents/{name}-{userId}/
// type=portrait → volunteers/kyc-portraits/{name}-{userId}/
export async function POST(request: NextRequest) {
  const session = await requireVolunteer()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const type = (formData.get("type") as string | null) ?? "document"

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only images and PDFs accepted." }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const folder = type === "portrait" ? "kyc-portraits" : "kyc-documents"
  const volunteerSlug = `${slug(session.user.name)}-${session.user.id.slice(0, 8)}`
  const key = `volunteers/${folder}/${volunteerSlug}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadToR2(buffer, key, file.type)

  return NextResponse.json({ url })
}
