import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PublicNavProps {
  donateButton?: boolean
  activeHref?: string
}

export function PublicNav({ donateButton = false, activeHref }: PublicNavProps) {
  const links = [
    { href: "/ledger/donations", label: "Donations" },
    { href: "/ledger/distributions", label: "Distributions" },
    { href: "/ledger/volunteers", label: "Volunteers" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <nav className="border-b border-border/40 px-10 py-5 flex items-center justify-between shrink-0">
      <Link href="/" className="text-sm font-semibold tracking-tight">Amanat</Link>
      <div className="flex items-center gap-6">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-xs transition-colors ${
              activeHref === l.href
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Sign in
        </Link>
        {donateButton && (
          <Link href="/donate">
            <Button size="sm" className="text-xs px-5">Donate</Button>
          </Link>
        )}
      </div>
    </nav>
  )
}
