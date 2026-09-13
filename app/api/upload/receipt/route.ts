import { NextRequest, NextResponse } from "next/server"
import { uploadToR2 } from "@/lib/storage"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are accepted." }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  // donations/receipts/{timestamp}-{uuid}.{ext}
  const key = `donations/receipts/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadToR2(buffer, key, file.type)

  return NextResponse.json({ url })
}
