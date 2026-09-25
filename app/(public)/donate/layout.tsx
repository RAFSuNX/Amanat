import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Donate",
  description: "Support families in need across Bangladesh. Every donation is recorded transparently on the public ledger.",
  openGraph: {
    title: "Donate | Amanat",
    description: "Support families in need across Bangladesh. Every donation is recorded transparently on the public ledger.",
    url: "https://theamanat.org/donate",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
