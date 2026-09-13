import { createAuthClient } from "better-auth/react"

// The auth client only ever runs in the browser (React hooks) and the auth API
// is same-origin. In the browser ALWAYS use the live origin, so production can
// never point at localhost regardless of any build-time value. NEXT_PUBLIC_APP_URL
// is only used server-side (SSR), where window is undefined.
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL,
})

export const { signIn, signOut, signUp, useSession } = authClient
