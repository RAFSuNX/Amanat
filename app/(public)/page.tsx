export const dynamic = "force-dynamic"

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
        className="relative h-dvh w-dvw flex flex-col"
        style={{ scrollSnapAlign: "start" }}
      >
        {/* Nav */}
        <nav className="shrink-0 flex items-center justify-between px-10 py-5 border-b border-border/30">
          <span className="text-sm font-semibold tracking-tight">Amanat</span>
          <div className="flex items-center gap-8">
            <Link href="/ledger/donations" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
              {t.nav.ledger}
            </Link>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.signIn}
            </Link>
            <LanguageToggle current={locale} />
            <Link href="/donate">
              <Button size="sm" className="text-xs px-6">{t.nav.donate}</Button>
            </Link>
          </div>
        </nav>

        {/* Hero body — two columns: content left, hologram right */}
        <div className="flex-1 flex items-center gap-12 px-10 py-12">

          {/* Left: content */}
          <div className="flex flex-col gap-8 flex-1 max-w-xl">
            <p className="text-xs tracking-[0.22em] uppercase text-primary font-medium">
              {t.hero.eyebrow}
            </p>
            <h1
              className="font-bold leading-[1.02] tracking-tight"
              style={{ fontSize: "clamp(2.6rem, 5.5vw, 5rem)" }}
            >
              {t.hero.headline}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
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

          {/* Right: hologram stats card */}
          <div className="shrink-0 relative" style={{ width: "340px" }}>
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "radial-gradient(ellipse at center, rgba(59,94,69,0.18) 0%, transparent 70%)",
                filter: "blur(24px)",
                transform: "scale(1.15)",
              }}
              aria-hidden="true"
            />

            {/* Card */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(59,94,69,0.10) 0%, rgba(26,46,32,0.06) 100%)",
                border: "1px solid rgba(59,94,69,0.22)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset, 0 4px 40px rgba(59,94,69,0.10)",
              }}
            >
              {/* Grid overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(59,94,69,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,94,69,0.07) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
                aria-hidden="true"
              />

              {/* Scan line */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, rgba(122,171,138,0.5), transparent)",
                  animation: "scan 3s linear infinite",
                  top: 0,
                }}
                aria-hidden="true"
              />

              <div className="relative px-7 py-8 flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Fund Status
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-primary uppercase tracking-wider">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      style={{ animation: "pulse 2s ease-in-out infinite" }}
                    />
                    Live
                  </span>
                </div>

                {/* Stats */}
                <div className="flex flex-col gap-5">
                  {[
                    { label: t.stats.totalDonated, value: `${stats.totalDonated.toLocaleString()} BDT`, accent: true },
                    { label: t.stats.familiesActive, value: stats.familiesHelped.toLocaleString(), accent: false },
                    { label: t.stats.cyclesDone, value: stats.cyclesCompleted.toLocaleString(), accent: false },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col gap-1 border-t border-border/20 pt-5">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        {s.label}
                      </p>
                      <p
                        className="font-bold tabular-nums leading-none"
                        style={{
                          fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                          color: s.accent ? "oklch(0.40 0.11 155)" : "inherit",
                        }}
                      >
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer note */}
                <p className="text-[10px] text-muted-foreground/50 border-t border-border/20 pt-4">
                  Updated in real time. All figures publicly verifiable.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-6 right-10 flex flex-col items-center gap-2"
          aria-hidden="true"
        >
          <div className="w-px h-8 bg-border/50" />
          <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/40">Scroll</span>
        </div>
      </section>

      {/* ── Section 2: How It Works ──────────────────────────────────── */}
      <section
        className="h-dvh w-dvw flex flex-col px-10 py-12 bg-[oklch(0.96_0.012_155)]"
        style={{ scrollSnapAlign: "start" }}
      >
        {/* Eyebrow anchored top */}
        <p className="shrink-0 text-xs tracking-[0.22em] uppercase text-muted-foreground mb-0">
          {t.how.eyebrow}
        </p>

        {/* Steps fill the remaining height with justify-between */}
        <div className="flex-1 flex flex-col justify-between mt-10 pb-2">
          {t.how.steps.map((s, i) => (
            <div
              key={s.n}
              className="flex items-center gap-12 border-t border-border/40 pt-6 pb-4"
            >
              {/* Large structural number */}
              <span
                className="shrink-0 font-bold leading-none tabular-nums text-border/60 select-none"
                style={{ fontSize: "clamp(3.5rem, 7vw, 6rem)", width: "9rem" }}
              >
                {s.n}
              </span>

              {/* Content */}
              <div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-16">
                <h3
                  className="font-bold tracking-tight shrink-0"
                  style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}
                >
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mt-2 md:mt-0">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
          {/* Closing rule */}
          <div className="border-t border-border/40" />
        </div>
      </section>

      {/* ── Section 3: Principles ────────────────────────────────────── */}
      <section
        className="h-dvh w-dvw flex flex-col px-10 py-12"
        style={{ scrollSnapAlign: "start" }}
      >
        {/* Eyebrow anchored top */}
        <p className="shrink-0 text-xs tracking-[0.22em] uppercase text-muted-foreground">
          {t.principles.eyebrow}
        </p>

        {/* Grid fills remaining height — two equal rows */}
        <div
          className="flex-1 grid grid-cols-3 mt-10 pb-2"
          style={{ gridTemplateRows: "1fr 1fr", columnGap: "3rem" }}
        >
          {t.principles.items.map((p) => (
            <div
              key={p.title}
              className="flex flex-col gap-3 border-t border-border/40 pt-8"
            >
              <h3
                className="font-bold tracking-tight leading-tight"
                style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.35rem)" }}
              >
                {p.title}
              </h3>
              <p
                className="text-muted-foreground leading-relaxed"
                style={{ fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)" }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: CTA + Footer ──────────────────────────────────── */}
      <section
        className="h-dvh w-dvw flex flex-col"
        style={{ scrollSnapAlign: "start" }}
      >
        {/* CTA fills most of the section */}
        <div className="flex-1 flex flex-col justify-between px-10 py-14 bg-primary">
          {/* Top label */}
          <p className="text-xs tracking-[0.22em] uppercase text-primary-foreground/40">
            Amanat
          </p>

          {/* Headline block */}
          <div className="flex flex-col gap-6 max-w-2xl">
            <h2
              className="font-bold text-primary-foreground leading-[1.04] tracking-tight"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }}
            >
              {t.cta.headline}
            </h2>
            <p className="text-base text-primary-foreground/65 max-w-sm">
              {t.cta.body}
            </p>
            <div className="flex gap-3 pt-2">
              <Link href="/donate">
                <Button size="lg" variant="secondary" className="px-8">{t.cta.donate}</Button>
              </Link>
              <Link href="/ledger/donations">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  {t.cta.ledger}
                </Button>
              </Link>
            </div>
          </div>

          {/* Bottom: register prompt */}
          <p className="text-xs text-primary-foreground/40">
            Want to help on the ground?{" "}
            <Link href="/register" className="text-primary-foreground/70 hover:text-primary-foreground underline underline-offset-2 transition-colors">
              Register as a volunteer
            </Link>
          </p>
        </div>

        {/* Footer strip */}
        <footer className="shrink-0 border-t px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Amanat</span>
            <span className="text-border/60">|</span>
            <span className="text-xs text-muted-foreground">{t.footer.tagline}</span>
          </div>
          <nav className="flex gap-6">
            <Link href="/ledger/donations" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t.footer.donationLedger}</Link>
            <Link href="/ledger/distributions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t.footer.distributionLedger}</Link>
            <Link href="/ledger/volunteers" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Volunteers</Link>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t.footer.signIn}</Link>
          </nav>
        </footer>
      </section>

    </div>
  )
}
