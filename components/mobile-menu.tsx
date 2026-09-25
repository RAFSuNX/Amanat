"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"

export function MobileMenu({
  links,
  donateButton,
  signIn = true,
  signOutButton = false,
}: {
  links: { href: string; label: string }[]
  donateButton?: boolean
  signIn?: boolean
  signOutButton?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  function handleOpen() { setOpen(true) }
  function handleClose() { setOpen(false) }

  const drawer = (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={handleClose} />
      <div className="fixed top-0 right-0 h-dvh w-72 bg-background border-l border-border/40 z-[9999] flex flex-col shadow-2xl">
        <div className="h-16 px-5 flex items-center justify-between border-b border-border/40 shrink-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Menu</span>
          <button type="button" onClick={handleClose} aria-label="Close menu" className="p-2 -mr-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="2" x2="14" y2="14" /><line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 flex flex-col overflow-y-auto py-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={handleClose}
              className="px-6 py-4 text-sm text-foreground hover:bg-muted border-b border-border/10">
              {l.label}
            </Link>
          ))}
          {signIn && (
            <Link href="/login" onClick={handleClose}
              className="px-6 py-4 text-sm text-muted-foreground hover:bg-muted border-b border-border/10">
              Sign in
            </Link>
          )}
          {signOutButton && (
            <button
              type="button"
              onClick={async () => { handleClose(); await signOut(); router.push("/login") }}
              className="px-6 py-4 text-sm text-muted-foreground hover:bg-muted border-b border-border/10 text-left w-full"
            >
              Sign out
            </button>
          )}
        </nav>
        {donateButton && (
          <div className="p-5 border-t border-border/40 shrink-0">
            <Link href="/donate" onClick={handleClose}
              className="block w-full py-3 bg-primary text-primary-foreground text-sm font-medium rounded text-center">
              Donate
            </Link>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open menu"
        aria-expanded={open}
        className="md:hidden flex flex-col justify-center gap-1.5 p-2"
        style={{ touchAction: "manipulation" }}
      >
        <span className="block w-5 h-0.5 bg-foreground" />
        <span className="block w-5 h-0.5 bg-foreground" />
        <span className="block w-5 h-0.5 bg-foreground" />
      </button>

      {open && typeof window !== "undefined" && createPortal(drawer, document.body)}
    </>
  )
}
