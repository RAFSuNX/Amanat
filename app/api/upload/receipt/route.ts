import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

export async function POST(request: NextRequest) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return NextResponse.json(
      { error: "File uploads are not configured yet. You can still submit your donation without a receipt." },
      { status: 503 }
    )
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are accepted." }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "amanat/receipts", resource_type: "image", public_id: `receipt_${Date.now()}` },
          (err, res) => { if (err || !res) reject(err); else resolve(res as { secure_url: string }) }
        )
        .end(buffer)
    })
    return NextResponse.json({ url: result.secure_url })
  } catch {
    return NextResponse.json(
      { error: "Upload failed. You can still submit without a receipt." },
      { status: 500 }
    )
  }
}
