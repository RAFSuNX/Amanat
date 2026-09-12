export const dynamic = "force-dynamic"

import { PublicNav } from "@/components/public-nav"
import { ContactForm } from "./contact-form"

export default function ContactPage() {
  return (
    <div className="h-dvh w-dvw flex flex-col overflow-hidden">
      <PublicNav donateButton />

      <div className="flex-1 grid md:grid-cols-[1fr_1.4fr] overflow-hidden">
        {/* Left: contact info */}
        <div className="hidden md:flex flex-col justify-between px-10 py-12 border-r border-border/40 bg-muted/20">
          <div className="flex flex-col gap-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight mt-2">
              Get in touch with Amanat
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mt-2">
              Whether you want to volunteer, have a question about the system, or can help us build a better payment experience for donors. We want to hear from you.
            </p>
          </div>

          <div className="flex flex-col gap-0 overflow-y-auto">
            {/* Email - primary contact method */}
            <div className="border-t border-border/40 pt-5 pb-5 flex flex-col gap-1.5">
              <p className="text-xs font-semibold">Email Form</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For all general questions, volunteering, partnership inquiries, or anything non-urgent. We aim to reply within 6 to 12 hours.
              </p>
            </div>

            {/* Phone - secondary, urgent only */}
            <div className="border-t border-border/40 pt-5 pb-5 flex flex-col gap-2">
              <p className="text-xs font-semibold">Phone</p>
              <p className="text-lg font-bold tracking-wide">+880 1X-XXXX-XXXX</p>
              <div className="flex flex-col gap-1.5 mt-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Please call only if you have an urgent issue with a fund transfer or donation that cannot wait. For everything else, use the email form above.
                </p>
                <p className="text-xs font-medium text-foreground">
                  Available 10am to 8pm, Saturday to Thursday.
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  We are a small team. Out-of-hours calls may not be answered. Please leave a message or use the form.
                </p>
              </div>
            </div>

            {/* Volunteer */}
            <div className="border-t border-border/40 pt-5 pb-5 flex flex-col gap-1.5">
              <p className="text-xs font-semibold">Volunteering</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Interested in joining as a volunteer? Register directly on the site. Our team will review your application after KYC submission.
              </p>
              <a href="/register" className="text-xs text-primary underline underline-offset-2 mt-0.5">
                Register as a volunteer
              </a>
            </div>

            {/* Gateway */}
            <div className="border-t border-border/40 pt-5 flex flex-col gap-1.5">
              <p className="text-xs font-semibold">Payment gateway partnership</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We are looking for help integrating bKash, Nagad, or SSLCommerz. If you can assist, please use the email form and select the relevant topic.
              </p>
            </div>
          </div>
        </div>

        {/* Right: contact form */}
        <ContactForm />
      </div>
    </div>
  )
}
