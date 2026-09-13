import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

// Cloudflare R2 — S3-compatible, zero egress fees
// Endpoint format: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL! // e.g. https://files.amanat.org or r2.dev URL

export async function uploadToR2(
  buffer: Buffer,
  key: string,             // e.g. "kyc/volunteer_xyz_123.jpg"
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )
  return `${PUBLIC_URL}/${key}`
}
