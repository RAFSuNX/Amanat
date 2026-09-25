"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

export function ProgressBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const first = useRef(true)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return
      const href = a.getAttribute("href") ?? ""
      if (!href.startsWith("/")) return
      if (new URL(a.href).pathname === pathname) return
      setVisible(true)
      setProgress(18)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [pathname])

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setProgress((p) => (p < 90 ? p + (90 - p) * 0.15 : p)), 200)
    return () => clearInterval(id)
  }, [visible])

  useEffect(() => {
    if (first.current) { first.current = false; return }
    setProgress(100)
    const t = setTimeout(() => { setVisible(false); setProgress(0) }, 250)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        className="h-full bg-primary transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
      />
    </div>
  )
}
