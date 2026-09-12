export const dynamic = "force-dynamic"

import { PublicNav } from "@/components/public-nav"

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav donateButton />

      <div className="flex-1 grid md:grid-cols-[1fr_1.4fr]">
        {/* Left: context */}
        <div className="hidden md:flex flex-col justify-between px-10 py-12 border-r border-border/40 bg-muted/20">
          <div className="flex flex-col gap-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight mt-2">
              Get in touch with Amanat
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mt-2">
              Whether you want to volunteer, have a question about the system, or can help us build a better payment experience for donors — we want to hear from you.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {[
              {
                label: "For volunteers",
                body: "Interested in joining as a volunteer? Register on our site and our team will review your application.",
                link: { href: "/register", text: "Register as a volunteer" },
              },
              {
                label: "For donors",
                body: "Questions about your donation or the fund? Use the form or reach out directly.",
              },
              {
                label: "Payment gateway partnership",
                body: "We are looking for help integrating bKash, Nagad, or SSLCommerz payment gateways. If you can help, please reach out.",
              },
            ].map((item) => (
              <div key={item.label} className="border-t border-border/40 pt-4 flex flex-col gap-1">
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                {item.link && (
                  <a href={item.link.href} className="text-xs text-primary underline underline-offset-2 mt-1">
                    {item.link.text}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: contact form */}
        <ContactForm />
      </div>
    </div>
  )
}

// Client component for the form
import { ContactForm } from "./contact-form"
