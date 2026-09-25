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
  applicationName: "Amanat",
  openGraph: {
    siteName: "Amanat",
    type: "website",
    locale: "en_US",
    title: "Amanat: The Hope for All of Us",
    description: "A transparent welfare platform connecting donors with those in need across Bangladesh.",
    url: "https://theamanat.org",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NGO",
              name: "Amanat",
              alternateName: "The Hope for All of Us",
              url: "https://theamanat.org",
              description: "A transparent welfare platform connecting donors with those in need across Bangladesh.",
              contactPoint: { "@type": "ContactPoint", email: "support@theamanat.org", contactType: "customer support" },
              areaServed: "BD",
              knowsLanguage: ["en", "bn"],
            }),
          }}
        />
      </body>
    </html>
  )
}
