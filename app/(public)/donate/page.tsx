"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PRESET_AMOUNTS = [500, 1000, 2500, 5000]

export default function DonatePage() {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("")
  const [txnRef, setTxnRef] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!amount || !method || !txnRef || !name) {
      setError("Please fill in all required fields.")
      return
    }
    setLoading(true)
    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method, transactionRef: txnRef, donorName: name, donorPhone: phone, donorEmail: email, isAnonymous }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? "Something went wrong.")
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">Thank you for your donation.</h1>
        <p className="text-muted-foreground max-w-sm">
          Your donation has been submitted and is pending admin confirmation.
          You can verify it anytime on the{" "}
          <Link href="/ledger/donations" className="underline">
            Public Ledger
          </Link>{" "}
          once confirmed.
        </p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">← Back</Link>
        <h1 className="text-2xl font-bold mt-4 mb-1">Make a Donation</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Send money via bKash or Nagad, then enter the transaction reference below.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-5">
          {/* Amount */}
          <div className="flex flex-col gap-2">
            <Label>Amount (BDT) *</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(String(a))}
                  className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    amount === String(a)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  ৳{a.toLocaleString()}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min="1"
              placeholder="Or enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Method */}
          <div className="flex flex-col gap-2">
            <Label>Payment Method *</Label>
            <Select value={method} onValueChange={(v) => setMethod(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BKASH">bKash</SelectItem>
                <SelectItem value="NAGAD">Nagad</SelectItem>
                <SelectItem value="BANK">Bank Transfer</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction ref */}
          <div className="flex flex-col gap-2">
            <Label>Transaction Reference *</Label>
            <Input
              placeholder="e.g. BKA8TJD123"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in your bKash/Nagad transaction history.
            </p>
          </div>

          {/* Donor info */}
          <div className="flex flex-col gap-2">
            <Label>Your Name *</Label>
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Phone</Label>
            <Input
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Email (to receive confirmation)</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Anonymous */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            Keep my name anonymous on the public ledger
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting…" : "Submit Donation"}
          </Button>
        </form>
      </div>
    </div>
  )
}
