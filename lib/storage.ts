import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const PUBLIC_BUCKET = process.env.R2_BUCKET_NAME!
const PRIVATE_BUCKET = process.env.R2_KYC_BUCKET_NAME ?? process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

// Upload to public bucket — returns full public URL. Use for receipts, beneficiary photos.
export async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await r2.send(new PutObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key, Body: buffer, ContentType: contentType }))
  return `${PUBLIC_URL}/${key}`
}

// Upload to private KYC bucket — returns only the key, never a public URL.
// Access exclusively via getPresignedUrl(). KYC docs are identity documents; never expose publicly.
export async function uploadPrivateToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await r2.send(new PutObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key, Body: buffer, ContentType: contentType }))
  return key
}

// Generate a 1-hour presigned URL for a private KYC document key.
export async function getPresignedUrl(key: string): Promise<string> {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }), { expiresIn: 3600 })
}

// True if the value is a private key (not a legacy public URL).
export function isKey(value: string): boolean {
  return !value.startsWith("https://") && !value.startsWith("http://")
}
