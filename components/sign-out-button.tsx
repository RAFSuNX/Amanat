"use client"

import { signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-xs"
      onClick={async () => {
        await signOut()
        router.push("/login")
      }}
    >
      Sign out
    </Button>
  )
}
