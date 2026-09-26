import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"

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
// Access exclusively via streamFromR2() through an authenticated server endpoint.
export async function uploadPrivateToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await r2.send(new PutObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key, Body: buffer, ContentType: contentType }))
  return key
}

// Fetch a private KYC document from R2 and return it as a Buffer + content type.
// Only call this from an authenticated server route — never expose the key to the client.
export async function streamFromR2(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }))
    const chunks: Buffer[] = []
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk))
    }
    return { body: Buffer.concat(chunks), contentType: res.ContentType ?? "application/octet-stream" }
  } catch {
    return null
  }
}

// True if the stored value is a private R2 key (not a legacy public URL).
export function isKey(value: string): boolean {
  return !value.startsWith("https://") && !value.startsWith("http://")
}
