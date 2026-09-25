import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { ProgressBar } from "@/components/progress-bar"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "https://theamanat.org"),
  title: {
    default: "Amanat: The Hope for All of Us",
    template: "%s | Amanat",
  },
  description: "A transparent welfare platform connecting donors with those in need across Bangladesh.",
  openGraph: {
    siteName: "Amanat",
    type: "website",
    title: "Amanat: The Hope for All of Us",
    description: "A transparent welfare platform connecting donors with those in need across Bangladesh.",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <ProgressBar />
        {children}
      </body>
    </html>
  )
}
