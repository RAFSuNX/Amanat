import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm text-center flex flex-col gap-4">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      </div>

      <div>
        <h1 className="text-xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          We sent a verification link to your email address. Click the link to activate your account.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          If you do not see it, check your spam folder.
        </p>
      </div>

      <Link href="/login">
        <Button variant="outline" className="w-full">Back to Sign in</Button>
      </Link>
    </div>
  )
}
