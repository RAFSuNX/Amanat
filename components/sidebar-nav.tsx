"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function SidebarNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
      {items.map((n) => {
        const active = pathname === n.href || (n.href !== "/admin" && n.href !== "/volunteer" && pathname.startsWith(n.href))
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`px-3 py-2.5 rounded text-xs transition-colors ${
              active
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}
