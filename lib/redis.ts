// Shared Redis client + a Better Auth SecondaryStorage adapter.
//
// The app runs multiple replicas (see k8s/app.yaml), so any state that must be
// consistent across pods - rate-limit counters, verification/session lookups -
// cannot live in a single pod's memory. Redis is that shared store.
//
// One lazy singleton is reused for every purpose (auth secondary storage and
// the standalone rate limiter). Lazy connect keeps `next build` from dialing
// Redis at build time; the real connection opens on first use at runtime.

import Redis from "ioredis"

let client: Redis | null = null

export function redis(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL!, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      // Never let a slow/dead Redis wedge a request forever.
      connectTimeout: 5000,
      commandTimeout: 5000,
    })
    // ioredis reconnects on its own; without a listener an error would crash
    // the process as an unhandled 'error' event.
    client.on("error", (err) => console.error("[redis]", err.message))
  }
  return client
}

// Better Auth reads/writes through this (structurally checked against the
// secondaryStorage option at the betterAuth() call site - no type import, since
// two @better-auth/core versions are hoisted and their SecondaryStorage names
// collide). All TTLs are in SECONDS, mapping directly onto Redis EX / EXPIRE.
export const redisSecondaryStorage = {
  get: (key: string) => redis().get(key),

  // Atomic read-and-remove (Redis 6.2+ GETDEL).
  getAndDelete: (key: string) => redis().getdel(key),

  // Atomic counter with a create-only TTL: the first INCR creates the key and
  // stamps the window; later increments must not extend it, so EXPIRE runs only
  // when the counter is created (post-increment value of 1).
  increment: async (key: string, ttl: number) => {
    const n = await redis().incr(key)
    if (n === 1) await redis().expire(key, ttl)
    return n
  },

  set: async (key: string, value: string, ttl?: number) => {
    if (ttl) await redis().set(key, value, "EX", ttl)
    else await redis().set(key, value)
  },

  delete: async (key: string) => {
    await redis().del(key)
  },
}

// Shared fixed-window limiter for public (non-Better-Auth) endpoints. Returns
// true while the caller is under `max` hits in the `windowSec` window. Backed by
// the same atomic INCR+create-only-EXPIRE as the auth rate limiter above.
// ponytail: fixed window, good enough for abuse throttling; swap for a sliding
// window only if burst-at-boundary becomes a real problem.
export async function rateLimitOk(key: string, max: number, windowSec: number): Promise<boolean> {
  const n = await redisSecondaryStorage.increment(`rl:${key}`, windowSec)
  return n <= max
}
