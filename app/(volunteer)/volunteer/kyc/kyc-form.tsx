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
  existing?: { docType?: string; docNumber?: string; docImageUrl?: string }
}) {
  const router = useRouter()
  const [docType, setDocType] = useState(existing?.docType ?? "")
  const [docNumber, setDocNumber] = useState(existing?.docNumber ?? "")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!docType || !docNumber) {
      setError("Please fill in all fields.")
      return
    }
    if (!file && !existing?.docImageUrl) {
      setError("Please upload your document.")
      return
    }

    setLoading(true)
    setError("")

    let docImageUrl = existing?.docImageUrl ?? ""

    // Upload to Cloudinary if new file selected
    if (file) {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/upload/kyc", {
        method: "POST",
        body: formData,
      })
      if (!uploadRes.ok) {
        setError("Failed to upload document.")
        setLoading(false)
        return
      }
      const { url } = await uploadRes.json()
      docImageUrl = url
    }

    const res = await fetch("/api/volunteer/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docType, docNumber, docImageUrl }),
    })

    setLoading(false)
    if (!res.ok) {
      setError("Failed to submit KYC.")
      return
    }
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Document Type *</Label>
        <select
          required
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
          required
          value={docNumber}
          onChange={(e) => setDocNumber(e.target.value)}
          placeholder="Enter your document number"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Document Photo *</Label>
        {existing?.docImageUrl && (
          <p className="text-xs text-muted-foreground">
            Already uploaded. Select a new file to replace.
          </p>
        )}
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : profileId ? "Update KYC" : "Submit KYC"}
      </Button>
    </form>
  )
}
