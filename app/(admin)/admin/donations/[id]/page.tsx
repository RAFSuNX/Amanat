import { db } from "@/db"
import { donations, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { redirect } from "next/navigation"
import { parseId } from "@/lib/http"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { DonationActions } from "../donation-actions"
import { receiptNumber } from "@/lib/receipt"

export default async function AdminDonationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const { id: idStr } = await params
  const id = parseId(idStr)
  if (!id) redirect("/admin/donations")

  const [d] = await db
    .select({
      id: donations.id,
      donorName: donations.donorName,
      donorEmail: donations.donorEmail,
      donorPhone: donations.donorPhone,
      isAnonymous: donations.isAnonymous,
      amount: donations.amount,
      method: donations.method,
      transactionRef: donations.transactionRef,
      receiptImageUrl: donations.receiptImageUrl,
      status: donations.status,
      rejectionNote: donations.rejectionNote,
      confirmedAt: donations.confirmedAt,
      createdAt: donations.createdAt,
      confirmedByName: users.name,
    })
    .from(donations)
    .leftJoin(users, eq(donations.confirmedByAdminId, users.id))
    .where(eq(donations.id, id))

  if (!d) redirect("/admin/donations")

  const receipt = receiptNumber(d.id, d.confirmedAt ?? d.createdAt)
  const statusVariant =
    d.status === "CONFIRMED" ? "default" : d.status === "REJECTED" ? "destructive" : "secondary"

  const fields = [
    { label: "Donor Name", value: d.donorName },
    { label: "Email", value: d.donorEmail },
    { label: "Phone", value: d.donorPhone },
    { label: "Public Display", value: d.isAnonymous ? "Anonymous" : "Show name" },
    { label: "Amount", value: `৳${parseFloat(d.amount).toLocaleString()} BDT` },
    { label: "Method", value: d.method },
    { label: "Transaction Reference", value: d.transactionRef },
    { label: "Receipt Number", value: receipt },
    { label: "Submitted", value: d.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }) },
    d.confirmedAt ? { label: "Confirmed At", value: d.confirmedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }) } : null,
    d.confirmedByName ? { label: "Confirmed By", value: d.confirmedByName } : null,
    d.rejectionNote ? { label: "Rejection Note", value: d.rejectionNote } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <Link href="/admin/donations" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        &larr; Back to Donations
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Donation #{d.id}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{d.donorName}</h1>
        </div>
        <Badge variant={statusVariant} className="text-sm px-3 py-1">{d.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-6">
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Donation Information</p>
            </div>
            <div className="divide-y divide-border/40">
              {fields.map((f) => (
                <div key={f.label} className="px-5 py-3.5 flex flex-col gap-0.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium break-all">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {d.status === "PENDING" && (
            <div className="border border-border/60 rounded-xl p-5 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Decision</p>
              <DonationActions donationId={d.id} donorName={d.donorName} amount={d.amount} transactionRef={d.transactionRef} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Payment Receipt</p>
          {d.receiptImageUrl ? (
            <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10">
              <a href={d.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img src={d.receiptImageUrl} alt="Payment receipt" className="w-full object-contain max-h-[70vh]" />
              </a>
              <div className="px-4 py-3 border-t border-border/40 bg-muted/20">
                <a href={d.receiptImageUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline underline-offset-2">
                  Open full size &rarr;
                </a>
              </div>
            </div>
          ) : (
            <div className="border border-border/60 rounded-xl flex items-center justify-center h-48 bg-muted/10 text-muted-foreground text-sm">
              No receipt image uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
