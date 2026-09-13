import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MobileMenu } from "@/components/mobile-menu"

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
    <nav className="sticky top-0 z-20 bg-background border-b border-border/40 px-4 md:px-10 h-14 md:h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center">
        <img src="/logo.png" alt="Amanat" className="h-10 md:h-12 w-auto object-contain" />
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
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

      {/* Mobile hamburger */}
      <MobileMenu links={links} donateButton={donateButton} />
    </nav>
  )
}
