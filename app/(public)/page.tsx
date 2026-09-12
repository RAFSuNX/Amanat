import Link from "next/link"
import { db } from "@/db"
import { donations, beneficiaries, distributionCycles } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import { getLocale } from "@/lib/i18n/locale"
import { translations } from "@/lib/i18n/translations"
import { LanguageToggle } from "@/components/language-toggle"

async function getStats() {
  const [donationTotal] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(donations)
    .where(eq(donations.status, "CONFIRMED"))

  const [familyCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(beneficiaries)
    .where(eq(beneficiaries.status, "ACTIVE"))

  const [cycleCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(distributionCycles)
    .where(eq(distributionCycles.status, "COMPLETED"))

  return {
    totalDonated: parseFloat(donationTotal?.total ?? "0"),
    familiesHelped: Number(familyCount?.count ?? 0),
    cyclesCompleted: Number(cycleCount?.count ?? 0),
  }
}

export default async function LandingPage() {
  const [stats, locale] = await Promise.all([getStats(), getLocale()])
  const t = translations[locale]

  return (
    <div
      className="h-dvh w-dvw overflow-y-scroll overflow-x-hidden"
      style={{ scrollSnapType: "y mandatory", scrollBehavior: "smooth" }}
    >
      {/* ── Section 1: Hero ─────────────────────────────────────────── */}
      <section
        className="h-dvh w-dvw flex flex-col relative"
        style={{ scrollSnapAlign: "start" }}
      >
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5 shrink-0 border-b border-border/40">
          <span className="text-sm font-semibold tracking-tight">Amanat</span>
          <div className="flex items-center gap-6">
            <Link href="/ledger/donations" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
              {t.nav.ledger}
            </Link>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.signIn}
            </Link>
            <LanguageToggle current={locale} />
            <Link href="/donate">
              <Button size="sm" className="text-xs px-5">{t.nav.donate}</Button>
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 gap-8 max-w-5xl">
          <p className="text-xs tracking-[0.2em] uppercase text-primary font-medium">
            {t.hero.eyebrow}
          </p>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.04] tracking-tight max-w-3xl">
            {t.hero.headline}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
            {t.hero.body}
          </p>
          <div className="flex gap-3">
            <Link href="/donate">
              <Button size="lg" className="px-8">{t.hero.ctaDonate}</Button>
            </Link>
            <Link href="/ledger/donations">
              <Button size="lg" variant="outline" className="px-8">{t.hero.ctaLedger}</Button>
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="shrink-0 border-t border-border/40 grid grid-cols-3 divide-x divide-border/40">
          {[
            { label: t.stats.totalDonated, value: `${stats.totalDonated.toLocaleString()}` },
            { label: t.stats.familiesActive, value: stats.familiesHelped.toString() },
            { label: t.stats.cyclesDone, value: stats.cyclesCompleted.toString() },
          ].map((s) => (
            <div key={s.label} className="px-8 py-5">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-20 right-8 flex flex-col items-center gap-1.5 text-muted-foreground/40">
          <div className="w-px h-10 bg-current animate-pulse" />
          <span className="text-[10px] tracking-widest uppercase rotate-90 origin-center translate-y-4">Scroll</span>
        </div>
      </section>

      {/* ── Section 2: How It Works ──────────────────────────────────── */}
      <section
        className="h-dvh w-dvw flex flex-col justify-center px-8 md:px-16 bg-muted/30"
        style={{ scrollSnapAlign: "start" }}
      >
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-12">
          {t.how.eyebrow}
        </p>
        <div className="grid md:grid-cols-3 gap-16 max-w-5xl">
          {t.how.steps.map((s) => (
            <div key={s.n} className="flex flex-col gap-4">
              <span className="text-5xl font-bold text-border/70">{s.n}</span>
              <h3 className="font-semibold text-lg tracking-tight">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Principles ────────────────────────────────────── */}
      <section
        className="h-dvh w-dvw flex flex-col justify-center px-8 md:px-16"
        style={{ scrollSnapAlign: "start" }}
      >
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-10">
          {t.principles.eyebrow}
        </p>
        <div className="grid md:grid-cols-3 gap-x-16 max-w-5xl">
          {t.principles.items.map((p) => (
            <div key={p.title} className="flex flex-col gap-2 py-5 border-t border-border/40">
              <h3 className="font-semibold text-sm">{p.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: CTA + Footer ──────────────────────────────────── */}
      <section
        className="h-dvh w-dvw flex flex-col"
        style={{ scrollSnapAlign: "start" }}
      >
        {/* CTA block */}
        <div className="flex-1 flex flex-col justify-center bg-primary px-8 md:px-16">
          <p className="text-xs tracking-[0.2em] uppercase text-primary-foreground/50 mb-6">
            Amanat
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground tracking-tight max-w-xl mb-4">
            {t.cta.headline}
          </h2>
          <p className="text-sm text-primary-foreground/70 mb-8 max-w-sm">
            {t.cta.body}
          </p>
          <div className="flex gap-3">
            <Link href="/donate">
              <Button size="lg" variant="secondary" className="px-8">{t.cta.donate}</Button>
            </Link>
            <Link href="/ledger/donations">
              <Button
                size="lg"
                variant="outline"
                className="px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                {t.cta.ledger}
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t px-8 py-6 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold">Amanat</span>
            <span className="ml-2 text-xs text-muted-foreground">{t.footer.tagline}</span>
          </div>
          <nav className="flex gap-6">
            <Link href="/ledger/donations" className="text-xs text-muted-foreground hover:text-foreground">{t.footer.donationLedger}</Link>
            <Link href="/ledger/distributions" className="text-xs text-muted-foreground hover:text-foreground">{t.footer.distributionLedger}</Link>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground">{t.footer.signIn}</Link>
          </nav>
        </footer>
      </section>
    </div>
  )
}
