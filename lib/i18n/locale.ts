import { cookies } from "next/headers"
import type { Locale } from "./translations"

export const defaultLocale: Locale = "en"

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const val = store.get("locale")?.value
  return val === "bn" ? "bn" : "en"
}
