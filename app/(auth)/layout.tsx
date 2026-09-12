import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh w-dvw grid md:grid-cols-[5fr_7fr] overflow-hidden">
      {/* Left: brand panel */}
      <div className="hidden md:flex flex-col justify-between bg-primary px-12 py-12">
        <Link href="/" className="text-sm font-semibold text-primary-foreground tracking-tight">
          Amanat
        </Link>
        <div className="flex flex-col gap-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary-foreground/40">
            The Hope of All of Us
          </p>
          <p
            className="font-bold text-primary-foreground leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.8rem)" }}
          >
            Built on public record. Maintained by volunteers. Sustained by charity.
          </p>
          <p className="text-sm text-primary-foreground/50 leading-relaxed max-w-xs">
            Every taka donated is tracked. Every family registered is on record. Every distribution is public.
          </p>
        </div>
        <Link href="/ledger/donations" className="text-xs text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors uppercase tracking-widest">
          View Public Ledger
        </Link>
      </div>

      {/* Right: form area */}
      <div className="flex flex-col items-center justify-center px-8 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <Link href="/" className="md:hidden block text-sm font-semibold mb-8">Amanat</Link>
          {children}
        </div>
      </div>
    </div>
  )
}
