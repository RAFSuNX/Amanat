"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"

export function MobileMenu({
  links,
  donateButton,
  signIn = true,
}: {
  links: { href: string; label: string }[]
  donateButton?: boolean
  signIn?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  const drawer = (
    <>
      {/* Full-screen backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998]"
        onClick={() => setOpen(false)}
      />
      {/* Slide-in panel from right */}
      <div className="fixed top-0 right-0 h-dvh w-72 bg-background border-l border-border/40 z-[9999] flex flex-col shadow-2xl">
        {/* Header row */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-border/40 shrink-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="p-2 -mr-2"
          >
            <span className="block w-5 h-0.5 bg-foreground rotate-45 translate-y-[1px]" />
            <span className="block w-5 h-0.5 bg-foreground -rotate-45 -translate-y-[1px]" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col overflow-y-auto py-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-6 py-4 text-sm text-foreground hover:bg-muted transition-colors border-b border-border/20"
            >
              {l.label}
            </Link>
          ))}
          {signIn && (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="px-6 py-4 text-sm text-muted-foreground hover:bg-muted transition-colors border-b border-border/20"
            >
              Sign in
            </Link>
          )}
        </nav>

        {/* Donate CTA at bottom */}
        {donateButton && (
          <div className="p-5 border-t border-border/40 shrink-0">
            <Link
              href="/donate"
              onClick={() => setOpen(false)}
              className="block w-full py-3 bg-primary text-primary-foreground text-sm font-medium rounded text-center"
            >
              Donate
            </Link>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex flex-col justify-center gap-1.5 p-2"
      >
        <span className="block w-5 h-0.5 bg-foreground" />
        <span className="block w-5 h-0.5 bg-foreground" />
        <span className="block w-5 h-0.5 bg-foreground" />
      </button>

      {mounted && open && createPortal(drawer, document.body)}
    </div>
  )
}
