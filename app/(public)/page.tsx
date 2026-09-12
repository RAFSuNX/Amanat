export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
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
        <nav className="shrink-0 flex items-center justify-between px-10 h-16">
          <Link href="/">
            <Image src="/logo.png" alt="Amanat" width={100} height={40} className="h-12 w-auto object-contain" priority />
          </Link>
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

        {/* Hero body - 3fr / 1fr grid */}
        <div
          className="flex-1 w-full grid items-center px-10 py-12"
          style={{ gridTemplateColumns: "3fr 1fr", gap: "5vw" }}
        >
          {/* Left: content */}
          <div className="flex flex-col gap-8">
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

          {/* Right: stats - bordered left, fills its grid cell */}
          <div className="flex flex-col divide-y divide-border/40 border-l border-border/40 pl-8 self-center">
            {[
              { label: t.stats.totalDonated, value: `${stats.totalDonated.toLocaleString()} BDT`, primary: true },
              { label: t.stats.familiesActive, value: stats.familiesHelped.toLocaleString(), primary: false },
              { label: t.stats.cyclesDone, value: stats.cyclesCompleted.toLocaleString(), primary: false },
            ].map((s) => (
              <div key={s.label} className="py-6 flex flex-col gap-1.5">
                <p
                  className={`font-bold tabular-nums leading-none ${s.primary ? "text-primary" : ""}`}
                  style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)" }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
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

        {/* Grid fills remaining height - two equal rows */}
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
        {/* CTA - same pattern as other sections: eyebrow top, content middle, prompt bottom */}
        <div className="flex-1 flex flex-col justify-between px-10 py-12 bg-primary">

          {/* Top: eyebrow */}
          <p className="shrink-0 text-xs tracking-[0.22em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
            Amanat
          </p>

          {/* Middle: headline + body + CTAs */}
          <div className="flex flex-col gap-7 max-w-2xl">
            <h2
              className="font-bold text-primary-foreground leading-[1.04] tracking-tight"
              style={{ fontSize: "clamp(2.2rem, 4vw, 3.8rem)" }}
            >
              {t.cta.headline}
            </h2>
            <p className="text-base leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              {t.cta.body}
            </p>
            <div className="flex gap-5 items-center">
              <Link href="/donate">
                <Button size="lg" variant="secondary" className="px-8">{t.cta.donate}</Button>
              </Link>
              <Link
                href="/ledger/donations"
                className="text-sm underline underline-offset-4 transition-opacity hover:opacity-100"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {t.cta.ledger}
              </Link>
            </div>
          </div>

          {/* Bottom: volunteer prompt */}
          <p className="shrink-0 text-xs border-t border-white/10 pt-5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Want to help on the ground?{" "}
            <Link href="/register" className="underline underline-offset-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              Register as a volunteer
            </Link>
          </p>

        </div>

        {/* Footer strip */}
        <footer className="shrink-0 border-t px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Amanat" width={72} height={28} className="h-7 w-auto object-contain" />
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
