"use client"

import { useState } from "react"
import Link from "next/link"

type Donation = {
  id: number
  donorName: string
  isAnonymous: boolean
  amount: string
  method: string
  transactionRef: string
  confirmedAt: string
  receipt: string
}

function methodLabel(m: string) {
  return { BKASH: "bKash Mobile Banking", NAGAD: "Nagad Mobile Banking", BANK: "Bank Transfer", OTHER: "Other" }[m] ?? m
}

export function DonationQuickView({ donation }: { donation: Donation }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-mono text-xs text-primary hover:underline underline-offset-2 text-left"
      >
        {donation.receipt}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Green top bar */}
            <div style={{ height: "4px", background: "#3B5E45" }} />

            <div className="px-7 py-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                    Official Donation Receipt
                  </p>
                  <p className="font-mono text-sm font-semibold">{donation.receipt}</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none mt-0.5"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {/* Detail rows */}
              <div className="flex flex-col divide-y divide-border/40">
                {[
                  ["Donor", donation.isAnonymous ? "Anonymous Donor" : donation.donorName],
                  ["Amount", `${parseFloat(donation.amount).toLocaleString()} BDT`],
                  ["Method", methodLabel(donation.method)],
                  ["Transaction Reference", donation.transactionRef],
                  ["Confirmed", new Date(donation.confirmedAt).toLocaleString("en-GB", {
                    day: "2-digit", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka", timeZoneName: "short",
                  })],
                  ["Status", "Confirmed and Recorded"],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4 py-2.5">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide w-44 shrink-0 pt-0.5">
                      {label}
                    </span>
                    <span className="text-sm font-medium break-all">{value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-5 border-t border-border/40">
                <Link
                  href={`/ledger/donations/${donation.id}/invoice`}
                  className="flex-1 text-center text-sm py-2 rounded border border-border hover:bg-muted transition-colors"
                  target="_blank"
                >
                  Open Full Invoice
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="px-5 text-sm py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
