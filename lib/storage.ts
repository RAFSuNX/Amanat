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

const BUCKET = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

// Upload and return the public URL. Use for non-sensitive files (receipts, beneficiary photos).
export async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }))
  return `${PUBLIC_URL}/${key}`
}

// Upload and return only the key. Use for sensitive files (KYC documents).
// Access only via getPresignedUrl — never expose the key as a public URL.
export async function uploadPrivateToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }))
  return key
}

// Generate a short-lived signed URL for a private R2 object key (1 hour).
export async function getPresignedUrl(key: string): Promise<string> {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 })
}

// Is the stored value a full URL (legacy public upload) or a key (private)?
export function isKey(value: string): boolean {
  return !value.startsWith("https://") && !value.startsWith("http://")
}
