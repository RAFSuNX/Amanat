"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const labelClass = "text-xs font-semibold text-foreground"
const fieldClass = "flex flex-col gap-2"

const TOPICS = [
  "General question",
  "Volunteering",
  "My donation",
  "Payment gateway partnership",
  "Media / press",
  "Other",
]

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [topic, setTopic] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // For now, just simulate - wire to email API when Resend is configured
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col justify-center px-[5vw] md:px-10 py-8 md:py-12 gap-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Sent</p>
        <h2 className="text-2xl font-bold tracking-tight">Thank you.</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
          We have received your message and will get back to you as soon as possible.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto px-[5vw] md:px-10 py-8 md:py-12">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Send a message</p>
      <h2 className="text-2xl font-bold tracking-tight mb-4">Contact us</h2>

      {/* Phone note - shown on mobile only (left panel hidden) */}
      <div className="md:hidden border border-border/60 rounded p-4 mb-6 flex flex-col gap-1.5 bg-muted/20">
        <p className="text-xs font-semibold">Phone: +880 1X-XXXX-XXXX</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Call only for urgent fund transfer issues. Available 10am to 8pm, Saturday to Thursday.
          For all other matters, please use this form. We reply within 6 to 12 hours.
        </p>
      </div>

      <div className="border-l-2 border-border/40 pl-3 mb-6">
        <p className="text-xs text-muted-foreground leading-relaxed">
          We reply to all messages within <strong className="text-foreground">6 to 12 hours</strong>. For urgent fund transfer issues only, call <strong className="text-foreground">+880 1X-XXXX-XXXX</strong> between 10am and 8pm, Saturday to Thursday.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={fieldClass}>
            <label className={labelClass}>Your Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Topic</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            className="flex h-10 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a topic</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            placeholder="Tell us what you need..."
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send Message"}
        </Button>
      </form>

      {/* Payment gateway partnership banner */}
      <div className="mt-8 border border-primary/30 rounded-lg p-5 bg-primary/5 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Payment Gateway Partnership</p>
        <p className="text-sm font-medium leading-snug">
          We are looking for help integrating bKash, Nagad, or SSLCommerz.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          If you can assist with payment gateway integration, please use the email form above and select <strong>Payment gateway partnership</strong> as the topic. We would love to hear from you.
        </p>
      </div>
    </div>
  )
}
