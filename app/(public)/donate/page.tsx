"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PublicNav } from "@/components/public-nav"

const PRESETS = [500, 1000, 2500, 5000]
const labelClass = "text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
const fieldClass = "flex flex-col gap-2"

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
    if (!amount || !method || !txnRef || !name) { setError("Please fill in all required fields."); return }
    setLoading(true)
    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method, transactionRef: txnRef, donorName: name, donorPhone: phone, donorEmail: email, isAnonymous }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Something went wrong."); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Submitted</p>
          <h1 className="text-3xl font-bold tracking-tight">Thank you for your donation.</h1>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Your donation is pending admin confirmation. Once verified, it will appear on the public ledger.
          </p>
          <div className="flex gap-4 mt-2">
            <Link href="/ledger/donations">
              <Button variant="outline">View Ledger</Button>
            </Link>
            <Button onClick={() => router.push("/")}>Back to Home</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav donateButton={false} />

      <div className="flex-1 grid md:grid-cols-[1fr_1.4fr]">
        {/* Left: context */}
        <div className="hidden md:flex flex-col justify-between px-10 py-12 border-r border-border/40 bg-muted/20">
          <div className="flex flex-col gap-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">How it works</p>
            <div className="flex flex-col gap-6 mt-4">
              {[
                { n: "01", t: "Send via bKash or Nagad", b: "Transfer money using the Send Money function. Note your transaction reference." },
                { n: "02", t: "Submit the reference", b: "Fill in the amount, method, and transaction reference on this form." },
                { n: "03", t: "Admin confirms", b: "An admin verifies your transaction. Once confirmed, it is added to the fund pool and appears on the public ledger." },
              ].map((s) => (
                <div key={s.n} className="flex gap-4">
                  <span className="text-2xl font-bold text-border/60 tabular-nums shrink-0">{s.n}</span>
                  <div>
                    <p className="text-sm font-semibold">{s.t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{s.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link href="/ledger/donations" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
            View all confirmed donations
          </Link>
        </div>

        {/* Right: form */}
        <div className="flex flex-col px-10 py-12 max-w-md">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Make a donation</p>
          <h1 className="text-2xl font-bold tracking-tight mb-8">Donate to Amanat</h1>

          <form onSubmit={submit} className="flex flex-col gap-6">
            {/* Amount */}
            <div className={fieldClass}>
              <label className={labelClass}>Amount (BDT)</label>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map((a) => (
                  <button key={a} type="button" onClick={() => setAmount(String(a))}
                    className={`px-4 py-2 text-sm border rounded transition-colors ${
                      amount === String(a) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                    }`}>
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
              <Input type="number" min="1" placeholder="Or enter custom amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            {/* Method */}
            <div className={fieldClass}>
              <label className={labelClass}>Payment Method</label>
              <Select value={method} onValueChange={(v) => setMethod(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BKASH">bKash</SelectItem>
                  <SelectItem value="NAGAD">Nagad</SelectItem>
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Txn ref */}
            <div className={fieldClass}>
              <label className={labelClass}>Transaction Reference</label>
              <Input placeholder="e.g. BKA8TJD123" value={txnRef} onChange={(e) => setTxnRef(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">Find this in your bKash or Nagad transaction history.</p>
            </div>

            {/* Donor info */}
            <div className="grid grid-cols-2 gap-4">
              <div className={fieldClass}>
                <label className={labelClass}>Your Name</label>
                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Phone</label>
                <Input type="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Email (for confirmation)</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {/* Anonymous */}
            <label className="flex items-center gap-3 text-xs text-muted-foreground cursor-pointer select-none border-t border-border/40 pt-4">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
              Keep my name anonymous on the public ledger
            </label>

            {error && <p className="text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-2 rounded">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit Donation"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
