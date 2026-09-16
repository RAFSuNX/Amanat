"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// Shared client helper for "POST an action, then refresh" buttons. Guarantees the
// three things every hand-rolled handler was missing somewhere:
//   1. loading is ALWAYS reset (finally) - a network failure can't wedge a button,
//   2. server errors (409/400/500) are surfaced, not silently swallowed,
//   3. network failures show a message instead of an unhandled rejection.
// On success it refreshes the server components so the UI reflects the new state.
export function useAction() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function run(key: string, url: string, body?: unknown): Promise<boolean> {
    setError("")
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
      return true
    } catch {
      setError("Network error. Please check your connection and try again.")
      return false
    } finally {
      setLoading(null)
    }
  }

  return { loading, error, setError, run }
}
