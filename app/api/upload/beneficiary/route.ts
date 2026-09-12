import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { requireVolunteer } from "@/lib/session"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  const session = await requireVolunteer()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "amanat/beneficiaries",
          resource_type: "image",
          public_id: `beneficiary_${session.user.id}_${Date.now()}`,
        },
        (err, res) => {
          if (err || !res) reject(err)
          else resolve(res as { secure_url: string })
        }
      )
      .end(buffer)
  })

  return NextResponse.json({ url: result.secure_url })
}
