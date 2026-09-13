"use client"

import { useState } from "react"
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

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        className="flex flex-col gap-1.5 p-2"
      >
        <span className={`block w-5 h-0.5 bg-foreground transition-transform ${open ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`block w-5 h-0.5 bg-foreground transition-opacity ${open ? "opacity-0" : ""}`} />
        <span className={`block w-5 h-0.5 bg-foreground transition-transform ${open ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {open && (
        <div className="fixed right-4 top-16 w-52 bg-background border border-border rounded shadow-lg z-50 flex flex-col py-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-xs hover:bg-muted transition-colors"
            >
              {l.label}
            </Link>
          ))}
          {signIn && (
            <Link href="/login" onClick={() => setOpen(false)}
              className="px-4 py-3 text-xs hover:bg-muted transition-colors border-t border-border/40 mt-1">
              Sign in
            </Link>
          )}
          {donateButton && (
            <Link href="/donate" onClick={() => setOpen(false)}
              className="mx-3 mt-2 mb-1 px-4 py-2 text-xs bg-primary text-primary-foreground rounded text-center font-medium">
              Donate
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
