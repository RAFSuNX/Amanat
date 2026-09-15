import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid md:grid-cols-[5fr_7fr]">
      {/* Left: brand panel - pinned to the viewport so it never stretches or
          redistributes when the form on the right grows (e.g. volunteer fields). */}
      <div className="hidden md:flex flex-col justify-between bg-primary px-12 py-12 md:self-start md:sticky md:top-0 md:h-dvh">
        <Link href="/">
          <img src="/logo.png" alt="Amanat" className="h-16 w-auto object-contain brightness-0 invert" />
        </Link>
        <div className="flex flex-col gap-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary-foreground/40">
            The Hope for All of Us
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

      {/* Right: form area. Top-anchored (not justify-center) so the form grows
          downward when fields toggle instead of re-centering and shifting the
          heading up. min-h-dvh keeps it filling the screen on short forms. */}
      <div className="flex flex-col items-center justify-start px-8 py-12 md:py-16 bg-background md:min-h-dvh">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <Link href="/" className="md:hidden block text-sm font-semibold mb-8">Amanat</Link>
          {children}
        </div>
      </div>
    </div>
  )
}
