import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/db"
import { redis } from "@/lib/redis"

// Readiness probe target (see k8s/app.yaml). Unlike "/", this fails when a
// dependency the app serves every request from is down, so k8s stops routing
// traffic to a pod that would only return 500s.
export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, string> = {}
  let healthy = true

  try {
    await db.execute(sql`select 1`)
    checks.database = "ok"
  } catch (e) {
    checks.database = (e as Error).message
    healthy = false
  }

  try {
    await redis().ping()
    checks.redis = "ok"
  } catch (e) {
    checks.redis = (e as Error).message
    healthy = false
  }

  return NextResponse.json({ ok: healthy, checks }, { status: healthy ? 200 : 503 })
}
