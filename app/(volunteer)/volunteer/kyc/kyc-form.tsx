"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function KycForm({
  profileId,
  existing,
}: {
  profileId?: number
  existing?: { legalName?: string; docType?: string; docNumber?: string; docImageUrl?: string }
}) {
  const router = useRouter()
  const [legalName, setLegalName] = useState(existing?.legalName ?? "")
  const [docType, setDocType] = useState(existing?.docType ?? "")
  const [docNumber, setDocNumber] = useState(existing?.docNumber ?? "")
  const [file, setFile] = useState<File | null>(null)
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportPhotoUrl, setPassportPhotoUrl] = useState(existing?.docImageUrl ? "" : "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadWarning, setUploadWarning] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setUploadWarning("")

    if (!legalName || !docType || !docNumber) {
      setError("Please fill in your legal name, document type, and document number.")
      return
    }

    setLoading(true)

    let docImageUrl = existing?.docImageUrl ?? ""
    let finalPassportPhotoUrl = passportPhotoUrl

    async function uploadFile(f: File, folder: string): Promise<string | null> {
      const fd = new FormData()
      fd.append("file", f)
      const res = await fetch("/api/upload/kyc", { method: "POST", body: fd })
      if (!res.ok) return null
      const { url } = await res.json()
      return url
    }

    if (file) {
      const url = await uploadFile(file, "kyc")
      if (url) docImageUrl = url
      else setUploadWarning("Document photo could not be uploaded. You can resubmit with a photo later.")
    }

    if (passportFile) {
      const url = await uploadFile(passportFile, "kyc")
      if (url) finalPassportPhotoUrl = url
    }

    const res = await fetch("/api/volunteer/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName,
        docType,
        docNumber,
        docImageUrl: docImageUrl || undefined,
        passportPhotoUrl: finalPassportPhotoUrl || undefined,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to submit KYC. Please try again.")
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="border border-border/60 rounded p-4 bg-muted/30 flex flex-col gap-1.5">
        <p className="text-xs font-semibold">Manual verification process</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your KYC application will be reviewed manually by our team. We may call you for a brief verification. This process can take up to 24 hours. Please keep your mobile number reachable so we can reach you.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Full Name as on Document *</Label>
        <Input
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="Exactly as written on your NID or passport"
        />
        <p className="text-[10px] text-muted-foreground">
          This will become your official name on your Amanat profile.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Document Type *</Label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select type</option>
          <option value="NID">National ID (NID)</option>
          <option value="PASSPORT">Passport</option>
          <option value="DRIVING_LICENSE">Driving License</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Document Number *</Label>
        <Input
          value={docNumber}
          onChange={(e) => setDocNumber(e.target.value)}
          placeholder="Enter your document number"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Document Photo</Label>
          <span className="text-[10px] text-muted-foreground">Recommended</span>
        </div>
        {existing?.docImageUrl && (
          <p className="text-xs text-muted-foreground">Already uploaded. Select a new file to replace.</p>
        )}
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-[10px] text-muted-foreground">
          Upload a clear photo of your NID, passport, or driving license. You can add this later if not ready.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Your Passport-Size Photo</Label>
          <span className="text-[10px] text-muted-foreground">For records</span>
        </div>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-[10px] text-muted-foreground">
          A clear face photo of yourself. This is kept on record for identity verification.
        </p>
      </div>

      {uploadWarning && (
        <p className="text-xs text-amber-600 border border-amber-200 bg-amber-50 rounded px-3 py-2">
          {uploadWarning}
        </p>
      )}

      {error && (
        <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : profileId ? "Update KYC" : "Submit KYC"}
      </Button>
    </form>
  )
}
