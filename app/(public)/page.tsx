import Link from "next/link"
import { db } from "@/db"
import { donations, beneficiaries, distributionCycles } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { Button } from "@/components/ui/button"

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
  const stats = await getStats()

  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist)]">

      {/* Nav */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-border/50">
        <div>
          <span className="text-sm font-semibold tracking-tight">Amanat</span>
          <span className="ml-2 text-xs text-muted-foreground">আমানত</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/ledger/donations" className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase">
            Ledger
          </Link>
          <Link href="#how" className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase">
            How it works
          </Link>
          <Link href="#principles" className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase">
            Principles
          </Link>
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/donate">
            <Button size="sm" className="text-xs px-4">Donate</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full px-8 py-24 gap-10">
        <div className="flex flex-col gap-5 max-w-2xl">
          <p className="text-xs tracking-[0.18em] uppercase text-primary font-medium">
            The Hope of All of Us
          </p>
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            A welfare system built on trust, not charity.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            Amanat is a structured fund for Bangladesh. Donors contribute to a
            shared pool. Volunteers on the ground find families who cannot
            sustain themselves. Every taka in, every taka out is recorded and
            visible to the public.
          </p>
          <div className="flex gap-3 pt-2">
            <Link href="/donate">
              <Button size="lg" className="px-8">Make a Donation</Button>
            </Link>
            <Link href="/ledger/donations">
              <Button size="lg" variant="outline" className="px-8">Public Ledger</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-border max-w-lg rounded-lg overflow-hidden border border-border">
          {[
            { label: "Total Donated", value: `৳${stats.totalDonated.toLocaleString("en-BD")}` },
            { label: "Families Active", value: stats.familiesHelped.toString() },
            { label: "Cycles Done", value: stats.cyclesCompleted.toString() },
          ].map((s) => (
            <div key={s.label} className="bg-card px-5 py-4">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t px-8 py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-10">
            How It Works
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                n: "01",
                title: "You Donate",
                body: "Send money via bKash or Nagad. Enter the transaction reference on our donation form. An admin verifies and adds it to the fund pool. You can track it on the public ledger.",
              },
              {
                n: "02",
                title: "Volunteers Register Families",
                body: "Verified volunteers visit communities, identify families who cannot support themselves, and register them with full household information and a monthly need assessment.",
              },
              {
                n: "03",
                title: "Fair Distribution",
                body: "Each month, the pool is distributed proportionally — weighted by family size, dependants, disability, and earner status. Those in greater need receive a larger share. Volunteers handle physical delivery.",
              },
            ].map((s) => (
              <div key={s.n} className="flex flex-col gap-3">
                <span className="text-3xl font-bold text-border">{s.n}</span>
                <h3 className="font-semibold text-base">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section id="principles" className="border-t px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-10">
            Our Principles
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Full Transparency",
                body: "Every donation confirmed, every distribution completed, is published on our public ledger. No login required. Anyone in the world can verify we did what we said.",
              },
              {
                title: "Need-Based Priority",
                body: "We do not distribute equally — we distribute fairly. A family with three young children and no earner receives more than a household with income. The algorithm is open and documented.",
              },
              {
                title: "Volunteer Accountability",
                body: "Every volunteer is KYC-verified with NID, passport, or driving license before accessing the system. Each family registration is tied to a named volunteer.",
              },
              {
                title: "No Cash to Beneficiaries",
                body: "Funds go to volunteers who manage the family's actual needs — food, medicine, utilities. This prevents misuse and ensures the money reaches its purpose.",
              },
              {
                title: "Special Needs Process",
                body: "If a family faces an emergency — illness, flood, fire — a volunteer can submit a special application. Admin reviews and approves additional funds outside the regular cycle.",
              },
              {
                title: "Permanent Record",
                body: "Every family registered stays in the system. Their history, need assessments, and distributions are permanently recorded. No family falls through the cracks.",
              },
            ].map((p) => (
              <div key={p.title} className="flex flex-col gap-2 py-5 border-t border-border/50">
                <h3 className="font-semibold text-sm">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t px-8 py-20 bg-primary">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-primary-foreground">Ready to contribute?</h2>
            <p className="text-sm text-primary-foreground/70">
              Every amount matters. Your donation enters a transparent, fair system.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/donate">
              <Button size="lg" variant="secondary" className="px-8">
                Donate Now
              </Button>
            </Link>
            <Link href="/ledger/donations">
              <Button size="lg" variant="outline" className="px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                View Ledger
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-8 py-8 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold">Amanat</span>
          <span className="ml-1 text-xs text-muted-foreground">— The Hope of All of Us</span>
        </div>
        <div className="flex gap-6">
          <Link href="/ledger/donations" className="text-xs text-muted-foreground hover:text-foreground">Donation Ledger</Link>
          <Link href="/ledger/distributions" className="text-xs text-muted-foreground hover:text-foreground">Distribution Ledger</Link>
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground">Sign in</Link>
        </div>
      </footer>

    </div>
  )
}
