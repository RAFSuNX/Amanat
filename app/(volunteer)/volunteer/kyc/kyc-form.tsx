"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function KycForm({
  profileId,
  existing,
}: {
  profileId?: number
  existing?: {
    legalName?: string
    phone?: string
    presentAddress?: string
    permanentAddress?: string
    docType?: string
    docNumber?: string
    docImageUrl?: string
    passportPhotoUrl?: string
  }
}) {
  const router = useRouter()
  const [legalName, setLegalName] = useState(existing?.legalName ?? "")
  const [phone, setPhone] = useState(existing?.phone ?? "")
  const [presentAddress, setPresentAddress] = useState(existing?.presentAddress ?? "")
  const [permanentAddress, setPermanentAddress] = useState(existing?.permanentAddress ?? "")
  const [docType, setDocType] = useState(existing?.docType ?? "")
  const [docNumber, setDocNumber] = useState(existing?.docNumber ?? "")
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportPhotoUrl] = useState(existing?.passportPhotoUrl ?? "")
  const docLocked = !!existing?.docImageUrl
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadWarning, setUploadWarning] = useState("")

  async function uploadFile(f: File, type: "document" | "portrait"): Promise<{ url?: string; key?: string } | null> {
    const fd = new FormData()
    fd.append("file", f)
    fd.append("type", type)
    const res = await fetch("/api/upload/kyc", { method: "POST", body: fd })
    if (!res.ok) return null
    return res.json()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setUploadWarning("")

    if (!legalName || !phone || !docType || !docNumber) {
      setError("Please fill in your legal name, mobile number, document type, and document number.")
      return
    }
    if (!presentAddress || !permanentAddress) {
      setError("Both present and permanent addresses are required.")
      return
    }
    if (!frontFile && !existing?.docImageUrl) {
      setError("Front document photo/PDF is required.")
      return
    }
    if (!passportFile && !passportPhotoUrl) {
      setError("Your passport-size photo is required.")
      return
    }

    setLoading(true)

    let docImageUrl = existing?.docImageUrl ?? ""
    let docBackImageUrl = ""
    let finalPassportPhotoUrl = passportPhotoUrl

    if (frontFile) {
      const result = await uploadFile(frontFile, "document")
      if (result?.key) docImageUrl = result.key
      else setUploadWarning("Front document could not be uploaded. You can resubmit later.")
    }

    if (backFile) {
      const result = await uploadFile(backFile, "document")
      if (result?.key) docBackImageUrl = result.key
      else setUploadWarning("Back document could not be uploaded. You can resubmit later.")
    }

    if (passportFile) {
      const result = await uploadFile(passportFile, "portrait")
      if (result?.url) finalPassportPhotoUrl = result.url
    }

    const res = await fetch("/api/volunteer/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName,
        phone: phone || undefined,
        presentAddress,
        permanentAddress,
        docType,
        docNumber,
        docImageUrl: docImageUrl || undefined,
        docBackImageUrl: docBackImageUrl || undefined,
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

  const fieldClass = "flex flex-col gap-2"

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="border border-border/60 rounded p-4 bg-muted/30 flex flex-col gap-1.5">
        <p className="text-xs font-semibold">Manual verification process</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your KYC application will be reviewed manually by our team. We may call you for verification. This process can take up to 24 hours.
        </p>
      </div>

      <div className={fieldClass}>
        <Label>Full Name as on Document *</Label>
        <Input value={legalName} onChange={(e) => setLegalName(e.target.value)}
          placeholder="Exactly as written on your NID or passport" disabled={docLocked} />
        <p className="text-[10px] text-muted-foreground">
          {docLocked ? "Locked. Must match your submitted document." : "This will become your official name on your Amanat profile."}
        </p>
      </div>

      <div className={fieldClass}>
        <Label>Mobile Number *</Label>
        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
        <p className="text-[10px] text-muted-foreground">We may call this number during verification. Keep it reachable.</p>
      </div>

      <div className={fieldClass}>
        <Label>Present Address *</Label>
        <Textarea value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)}
          placeholder="House/flat, road, area, district" rows={2} className="resize-none" />
      </div>

      <div className={fieldClass}>
        <Label>Permanent Address *</Label>
        <Textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)}
          placeholder="House/flat, road, village/area, district" rows={2} className="resize-none" />
        <p className="text-[10px] text-muted-foreground">If same as present address, write it again.</p>
      </div>

      <div className={fieldClass}>
        <Label>Document Type *</Label>
        <select value={docType} onChange={(e) => setDocType(e.target.value)} disabled={docLocked}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60">
          <option value="">Select type</option>
          <option value="NID">National ID (NID)</option>
          <option value="PASSPORT">Passport</option>
          <option value="DRIVING_LICENSE">Driving License</option>
        </select>
      </div>

      <div className={fieldClass}>
        <Label>Document Number *</Label>
        <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)}
          placeholder="Enter your document number" disabled={docLocked} />
      </div>

      <div className={fieldClass}>
        <div className="flex items-center justify-between">
          <Label>Document — Front Side *</Label>
          <span className="text-[10px] text-muted-foreground">{docLocked ? "Locked" : "Image or PDF"}</span>
        </div>
        {docLocked ? (
          <div className="rounded border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            On record. Cannot be changed.
          </div>
        ) : (
          <>
            <Input type="file" accept="image/*,.pdf" onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)} />
            <p className="text-[10px] text-muted-foreground">Clear photo or scanned PDF of the front of your document.</p>
          </>
        )}
      </div>

      <div className={fieldClass}>
        <div className="flex items-center justify-between">
          <Label>Document — Back Side</Label>
          <span className="text-[10px] text-muted-foreground">{docLocked ? "Locked" : "Image or PDF (if applicable)"}</span>
        </div>
        {docLocked ? (
          <div className="rounded border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            On record. Cannot be changed.
          </div>
        ) : (
          <>
            <Input type="file" accept="image/*,.pdf" onChange={(e) => setBackFile(e.target.files?.[0] ?? null)} />
            <p className="text-[10px] text-muted-foreground">Back of your NID or driving license. Not required for passport.</p>
          </>
        )}
      </div>

      <div className={fieldClass}>
        <div className="flex items-center justify-between">
          <Label>Your Passport-Size Photo *</Label>
          <span className="text-[10px] text-muted-foreground">{passportPhotoUrl ? "Editable" : "Required"}</span>
        </div>
        {passportPhotoUrl && (
          <div className="flex items-center gap-3">
            <img src={passportPhotoUrl} alt="Your photo" className="w-12 h-12 object-cover rounded border" />
            <span className="text-xs text-muted-foreground">On record. Select a new file to replace.</span>
          </div>
        )}
        <Input type="file" accept="image/*" onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)} />
        <p className="text-[10px] text-muted-foreground">Clear face photo. You can update this anytime.</p>
      </div>

      {uploadWarning && (
        <p className="text-xs text-amber-600 border border-amber-200 bg-amber-50 rounded px-3 py-2">{uploadWarning}</p>
      )}
      {error && (
        <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : profileId ? "Update KYC" : "Submit KYC"}
      </Button>
    </form>
  )
}
