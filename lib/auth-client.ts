import { createAuthClient } from "better-auth/react"

// The auth API is same-origin (/api/auth on whatever host is serving the app),
// so use the current origin. NEVER hardcode localhost: baked into the client
// bundle it makes production visitors' browsers hit their OWN localhost, which
// triggers the browser's "access other apps and services on this device" prompt.
// NEXT_PUBLIC_APP_URL is an optional override for the rare cross-origin case.
export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : undefined),
})

export const { signIn, signOut, signUp, useSession } = authClient
