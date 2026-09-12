"use client"

import { useRouter } from "next/navigation"

export function LanguageToggle({ current }: { current: string }) {
  const router = useRouter()

  function toggle() {
    const next = current === "en" ? "bn" : "en"
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide"
    >
      {current === "en" ? "বাংলা" : "English"}
    </button>
  )
}
