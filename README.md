# Amanat

**The Hope for All of Us**

Amanat is a welfare system, not a platform. It exists to connect people who are willing to donate with volunteers who go on the ground to find and support those who genuinely cannot sustain themselves or their families.

We believe welfare must be structured, accountable, and transparent. Every taka donated is recorded. Every family registered is on record. Every distribution is calculated, reviewed, and published publicly. Nothing is hidden.

---

## What This Is

A monthly welfare cycle operates as follows:

1. **Donors contribute** via bKash, Nagad, or bank transfer. They submit their transaction reference. An admin verifies and adds it to the shared fund pool.
2. **Volunteers register families** on the ground. They verify who cannot support themselves, record household details, assess monthly needs, and submit for admin approval.
3. **The system calculates distribution** proportionally, weighted by family size, dependants, disability, and earner status. Families with greater need receive a proportionally larger share.
4. **Volunteers review allotments** before the cycle goes live. If a family has an urgent situation, the volunteer can flag it or submit a special need application.
5. **Admin approves** the final distribution, volunteers deliver, and the results are published on the public ledger.

---

## Who Can Participate

| Role | How to join |
|---|---|
| Donor | Self-register at `/register`, or donate anonymously without an account |
| Volunteer | Apply via `/register` (volunteer type), verified by admin after KYC |
| Admin | First admin seeded manually in DB; subsequent admins added by existing admin |

Volunteers must complete KYC (NID, passport, or driving license — front and back) before accessing any beneficiary tools. KYC documents are stored in a private R2 bucket and served exclusively via server-side signed URLs — never exposed directly.

---

## Transparency

All confirmed donations and completed distributions are publicly visible at `/ledger` with no login required. Donors may choose to remain anonymous per transaction, but the amount and date are always shown.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Node server, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL 17 (in-cluster StatefulSet, Longhorn PVC) |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| Cache | Redis 7 (in-cluster, AOF+RDB persistence) |
| UI | Tailwind CSS v4 + shadcn/ui |
| File storage | Cloudflare R2 (public bucket for avatars/receipts, private bucket for KYC docs) |
| Email | Resend (transactional) |
| Deployment | k8s via Flux GitOps — images from GHCR, secrets from Doppler |
| DB backups | Daily pg_dump → Supabase + real-time push-sync → Neon |

---

## Local Development

**Prerequisites:** Docker, Node.js 24+

```bash
git clone https://github.com/RAFSuNX/Amanat.git
cd Amanat

# Start everything: postgres, audit-postgres, redis, and Next.js dev server
# Uses local-only env vars — zero production credentials
docker compose up app-dev --build
```

Visit `http://localhost:3000`.

The `app-dev` service:
- Runs `npm run dev` with hot reload (source directory is mounted)
- Uses only local databases — never touches Supabase, Neon, or R2
- Skips R2/Neon connectivity checks at startup (`DEV_SKIP_CONNECTIVITY=1`)
- Seeds realistic mock data on first run (idempotent, safe to re-run)
- Emails are disabled (empty `RESEND_API_KEY` → `requireEmailVerification = false`)

### First-time admin account

After `docker compose up app-dev --build`, register at `/register` then promote:

```bash
docker exec amanat-postgres-1 psql -U amanat -d amanat \
  -c "UPDATE users SET role='ADMIN', email_verified=true WHERE email='your@email.com';"
```

### Dev vs prod isolation

| | Dev (`docker compose up app-dev`) | Prod (k8s + Flux) |
|---|---|---|
| Database | Local Docker postgres | In-cluster postgres-0 (Longhorn) |
| Secrets | Hardcoded local values in compose | Doppler → k8s ExternalSecret |
| Migrations | Auto-run on container start | `db-migrate` k8s Job before rollout |
| Seed data | Mock data inserted automatically | Never — real data only |
| Email | Disabled | Resend (transactional) |
| File storage | Fake R2 (uploads fail gracefully) | Cloudflare R2 (real buckets) |
| Connectivity checks | Skipped | Run at every pod startup |

**Dev scripts never affect prod:** `seed-dev.mjs` hard-aborts if `DATABASE_URL` is not `localhost`, `dev.sh` is manual-only, the `app-dev` compose service is not referenced by CI or Flux.

---

## Deployment

Production is deployed to a k8s cluster via Flux GitOps. Images are built and pushed to GHCR by GitHub Actions, then `server-hub/k8s/amanat/kustomization.yaml` is updated with the new SHA.

```bash
# Trigger a build
gh workflow run "CI and build" --repo RAFSuNX/Amanat --ref main
# Then update server-hub kustomization.yaml with the new image SHA
```

Migrations run automatically as a k8s Job before new app pods start. Neon is also migrated in the same job (with retry).

### Rollback

- **App:** update `kustomization.yaml` to the previous image SHA
- **Schema:** migrations are forward-only. For a destructive change, restore from Neon (real-time copy) or Supabase backup (daily pg_dump). See `docs/disaster-recovery.md`.

---

## Data Integrity

- **Primary DB:** PostgreSQL with ACID transactions, DB-level CHECK constraints on all money fields, atomic state machine transitions
- **Audit trail:** Separate append-only audit database — every admin action is permanently recorded
- **Real-time backup:** Neon receives push-sync of all 9 business tables within seconds of every write
- **Daily snapshot:** Full pg_dump of both databases to Supabase at 02:00 Dhaka time
- **Disaster recovery:** See `docs/disaster-recovery.md`

---

## Principles

**No middlemen on the money.** Funds go to volunteers who handle the actual purchase of necessities for each family.

**Permanent records.** Every family registered stays in the system indefinitely.

**Public accountability.** Anyone can verify the ledger at `/ledger` without an account.

**Need, not equality.** Distribution is proportional to assessed need, not equal per family.

---

## License

MIT
