import { db } from "@/db"
import { donations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { PrintButton } from "./print-button"

function receiptNumber(id: number, date: Date) {
  const d = date.toISOString().slice(0, 10).replace(/-/g, "")
  return `AMT-${d}-${String(id).padStart(5, "0")}`
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Dhaka",
    timeZoneName: "short",
  })
}

function methodLabel(method: string) {
  const map: Record<string, string> = {
    BKASH: "bKash Mobile Banking",
    NAGAD: "Nagad Mobile Banking",
    BANK: "Bank Transfer",
    OTHER: "Other",
  }
  return map[method] ?? method
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const donation = await db.query.donations.findFirst({
    where: eq(donations.id, Number(id)),
  })

  if (!donation || donation.status !== "CONFIRMED") notFound()

  const receipt = receiptNumber(donation.id, donation.confirmedAt ?? donation.createdAt)
  const donorName = donation.isAnonymous ? "Anonymous Donor" : donation.donorName
  const confirmedAt = donation.confirmedAt ?? donation.createdAt

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .invoice-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
        }
        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print bg-muted/50 border-b px-8 py-3 flex items-center justify-between">
        <a href="/ledger/donations" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Back to Ledger
        </a>
        <PrintButton />
      </div>

      {/* Invoice */}
      <div className="flex justify-center bg-muted/30 min-h-screen p-8 print:p-0 print:bg-white">
        <div
          className="invoice-page bg-white w-full max-w-2xl shadow-sm"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          {/* Green accent bar */}
          <div style={{ height: "5px", background: "#3B5E45" }} />

          {/* Header */}
          <div className="px-14 pt-10 pb-8 border-b border-gray-200 flex flex-col gap-5">
            {/* Logo — left aligned, prominent */}
            <img src="/logo.png" alt="Amanat" style={{ height: "64px", width: "auto" }} />

            {/* Bottom row: tagline/country left, receipt info right — same horizontal line */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <p style={{ fontSize: "0.72rem", color: "#3B5E45", letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif", fontWeight: "500" }}>
                  The Hope of All of Us
                </p>
                <p style={{ fontSize: "0.65rem", color: "#9aaea0", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>
                  Bangladesh
                </p>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "3px" }}>
                <p style={{ fontSize: "0.6rem", color: "#9aaea0", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "system-ui, sans-serif" }}>
                  Official Donation Receipt
                </p>
                <p style={{ fontSize: "1.05rem", fontWeight: "700", color: "#1A2E20", fontFamily: "system-ui, monospace", letterSpacing: "0.04em" }}>
                  {receipt}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-14 py-8">

            {/* Section label */}
            <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.18em", color: "#9aaea0", fontFamily: "system-ui, sans-serif", marginBottom: "16px" }}>
              Donation Details
            </p>

            {/* Details table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "system-ui, sans-serif" }}>
              <tbody>
                {[
                  { label: "Donor", value: donorName },
                  {
                    label: "Amount",
                    value: (
                      <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1A2E20" }}>
                        {parseFloat(donation.amount).toLocaleString("en-BD")} BDT
                      </span>
                    ),
                  },
                  { label: "Payment Method", value: methodLabel(donation.method) },
                  { label: "Transaction Reference", value: donation.transactionRef },
                  { label: "Date & Time", value: formatDateTime(confirmedAt) },
                  { label: "Status", value: "Confirmed and Recorded" },
                ].map((row) => (
                  <tr key={row.label} style={{ borderBottom: "1px solid #edf2ee" }}>
                    <td
                      style={{
                        padding: "13px 0",
                        width: "36%",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#7a9480",
                        verticalAlign: "middle",
                      }}
                    >
                      {row.label}
                    </td>
                    <td
                      style={{
                        padding: "13px 0",
                        fontSize: "0.88rem",
                        color: "#1A2E20",
                        fontWeight: "500",
                        verticalAlign: "middle",
                      }}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Statement */}
            <div
              style={{
                marginTop: "40px",
                paddingTop: "28px",
                borderTop: "1px solid #d4ddd6",
              }}
            >
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "#3d5244",
                  lineHeight: "1.75",
                  fontFamily: "Georgia, serif",
                }}
              >
                This receipt confirms that the above donation has been received by Amanat and
                credited to the shared welfare fund. The funds will be distributed to verified
                beneficiaries in accordance with Amanat&apos;s transparent, need-based distribution
                process. All donations and distributions are recorded on the public ledger at{" "}
                <span style={{ color: "#3B5E45", fontStyle: "italic" }}>amanat.org/ledger</span>.
              </p>
            </div>

            {/* Verification note */}
            <div
              style={{
                marginTop: "28px",
                background: "#f3f7f4",
                border: "1px solid #d4ddd6",
                borderRadius: "4px",
                padding: "14px 18px",
              }}
            >
              <p style={{ fontSize: "0.7rem", color: "#6B8070", fontFamily: "system-ui, sans-serif", lineHeight: "1.6" }}>
                <strong style={{ color: "#3d5244" }}>Verification:</strong> This receipt can be independently
                verified on the Amanat public ledger using the transaction reference above.
                The ledger is publicly accessible and requires no login.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "auto",
              borderTop: "1px solid #d4ddd6",
              padding: "20px 56px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <p style={{ fontSize: "0.65rem", color: "#b0c4b5", fontFamily: "system-ui, sans-serif", maxWidth: "260px", lineHeight: "1.6" }}>
              Amanat operates as a transparent welfare system. Every taka in and every taka out is publicly accounted for.
            </p>
            <p style={{ fontSize: "0.65rem", color: "#b0c4b5", fontFamily: "system-ui, sans-serif", textAlign: "right" }}>
              {receipt}<br />
              <span style={{ color: "#d0ddd2" }}>amanat.org</span>
            </p>
          </div>

          {/* Bottom accent bar */}
          <div style={{ height: "3px", background: "linear-gradient(to right, #3B5E45, #7aab8a)" }} />
        </div>
      </div>
    </>
  )
}
