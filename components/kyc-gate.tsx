"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export function KycGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Always allow the KYC page through
  if (pathname === "/volunteer/kyc") return <>{children}</>

  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Access Restricted</p>
      <h2 className="text-xl font-bold tracking-tight">KYC Pending</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Submit your KYC documents and wait for admin approval before accessing the volunteer portal.
      </p>
      <Link href="/volunteer/kyc" className="text-sm text-primary underline underline-offset-2">
        Submit KYC
      </Link>
    </div>
  )
}
