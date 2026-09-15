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
  existing?: { legalName?: string; phone?: string; docType?: string; docNumber?: string; docImageUrl?: string; passportPhotoUrl?: string }
}) {
  const router = useRouter()
  const [legalName, setLegalName] = useState(existing?.legalName ?? "")
  const [phone, setPhone] = useState(existing?.phone ?? "")
  const [docType, setDocType] = useState(existing?.docType ?? "")
  const [docNumber, setDocNumber] = useState(existing?.docNumber ?? "")
  const [file, setFile] = useState<File | null>(null)
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportPhotoUrl] = useState(existing?.passportPhotoUrl ?? "")
  // The identity document (and the name that must match it) is write-once. The
  // passport photo (avatar) stays editable.
  const docLocked = !!existing?.docImageUrl
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadWarning, setUploadWarning] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setUploadWarning("")

    if (!legalName || !phone || !docType || !docNumber) {
      setError("Please fill in your legal name, mobile number, document type, and document number.")
      return
    }
    if (!file && !existing?.docImageUrl) {
      setError("Document photo is required.")
      return
    }
    if (!passportFile && !passportPhotoUrl) {
      setError("Your passport-size photo is required.")
      return
    }

    setLoading(true)

    let docImageUrl = existing?.docImageUrl ?? ""
    let finalPassportPhotoUrl = passportPhotoUrl

    async function uploadFile(f: File, type: "document" | "portrait"): Promise<string | null> {
      const fd = new FormData()
      fd.append("file", f)
      fd.append("type", type)
      const res = await fetch("/api/upload/kyc", { method: "POST", body: fd })
      if (!res.ok) return null
      const { url } = await res.json()
      return url
    }

    if (file) {
      const url = await uploadFile(file, "document")
      if (url) docImageUrl = url
      else setUploadWarning("Document photo could not be uploaded. You can resubmit with a photo later.")
    }

    if (passportFile) {
      const url = await uploadFile(passportFile, "portrait")
      if (url) finalPassportPhotoUrl = url
    }

    const res = await fetch("/api/volunteer/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName,
        phone: phone || undefined,
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
          disabled={docLocked}
        />
        <p className="text-[10px] text-muted-foreground">
          {docLocked
            ? "Locked. Must match your submitted document."
            : "This will become your official name on your Amanat profile."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Mobile Number *</Label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
        />
        <p className="text-[10px] text-muted-foreground">
          We will use this to contact you during verification. Keep it reachable.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Document Type *</Label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          disabled={docLocked}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
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
          disabled={docLocked}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Document Photo *</Label>
          <span className="text-[10px] text-muted-foreground">{docLocked ? "Locked" : "Required"}</span>
        </div>
        {docLocked ? (
          <div className="flex items-center gap-3 rounded border border-border/60 bg-muted/30 p-3">
            <a href={existing!.docImageUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
              View submitted document
            </a>
            <span className="text-[10px] text-muted-foreground">On record. Cannot be changed.</span>
          </div>
        ) : (
          <>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-[10px] text-muted-foreground">
              Upload a clear photo of your NID, passport, or driving license.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Your Passport-Size Photo (Avatar) *</Label>
          <span className="text-[10px] text-muted-foreground">{passportPhotoUrl ? "Editable" : "Required"}</span>
        </div>
        {passportPhotoUrl && (
          <div className="flex items-center gap-3">
            <img src={passportPhotoUrl} alt="Your photo" className="w-12 h-12 object-cover rounded border" />
            <span className="text-xs text-muted-foreground">On record. Select a new file to replace.</span>
          </div>
        )}
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-[10px] text-muted-foreground">
          A clear face photo of yourself. You can update this anytime.
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
