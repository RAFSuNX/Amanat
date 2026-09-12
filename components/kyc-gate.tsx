"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export function KycGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Always allow the KYC page through
  if (pathname === "/volunteer/kyc") return <>{children}</>

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Access Restricted</p>
        <h2 className="text-xl font-bold tracking-tight">KYC Pending</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Submit your KYC documents and wait for admin approval before accessing volunteer features.
        </p>
        <Link href="/volunteer/kyc" className="text-sm text-primary underline underline-offset-2">
          Submit KYC
        </Link>
      </div>

      {/* Donation always available regardless of KYC */}
      <div className="border border-border/40 rounded p-5 flex items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Make a donation</p>
          <p className="text-xs text-muted-foreground">
            You can donate anytime. Your details will be pre-filled.
          </p>
        </div>
        <Link href="/donate" className="shrink-0">
          <button className="text-sm px-4 py-2 rounded border border-border hover:bg-muted transition-colors">
            Donate
          </button>
        </Link>
      </div>
    </div>
  )
}
