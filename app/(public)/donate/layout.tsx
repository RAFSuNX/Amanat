import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Donate",
  description: "Support families in need across Bangladesh. Every donation is recorded transparently on the public ledger.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
