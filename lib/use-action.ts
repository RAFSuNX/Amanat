"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function useAction() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<string | null>(null)

  async function run(key: string, url: string, body?: unknown): Promise<boolean> {
    setError("")
    setSuccess(null)
    setLoading(key)
    try {
      const res = await fetch(url, {
        method: "POST",
        ...(body !== undefined
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        setError(d.error ?? "Something went wrong. Please try again.")
        return false
      }
      router.refresh()
      setSuccess(key)
      setTimeout(() => setSuccess(null), 2500)
      return true
    } catch {
      setError("Network error. Please check your connection and try again.")
      return false
    } finally {
      setLoading(null)
    }
  }

  return { loading, error, success, setError, run }
}
