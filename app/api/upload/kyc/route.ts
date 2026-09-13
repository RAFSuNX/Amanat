import { NextRequest, NextResponse } from "next/server"
import { requireVolunteer } from "@/lib/session"
import { uploadToR2 } from "@/lib/storage"
import { randomUUID } from "crypto"

// type=document → volunteers/kyc-documents/{userId}/
// type=portrait → volunteers/kyc-portraits/{userId}/
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
  const key = `volunteers/${folder}/${session.user.id}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadToR2(buffer, key, file.type)

  return NextResponse.json({ url })
}
