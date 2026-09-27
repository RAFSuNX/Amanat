# Amanat

Amanat means trust. The system is named for what it asks of everyone involved: donors trust that their money reaches real people, volunteers trust that the system protects the families they register, families trust that help will come consistently, and admins trust that the record is permanent and honest.

This is a welfare system, not a charity platform. It exists to move money from people who have it to people who cannot sustain themselves or their families, through a network of on-the-ground volunteers who verify, document, and deliver. Every step is recorded. Nothing disappears.

---

## The Problem This Solves

Informal welfare in Bangladesh breaks down in one of two ways. Either money gets collected with good intentions and nobody can account for where it went, or it gets distributed equally regardless of need, which means the family with six children and no earner gets the same as the family with three working adults. Neither is acceptable.

Amanat solves both. Every taka that enters the pool is tracked from submission to confirmation. Every family in the system has a documented need assessment. The distribution algorithm calculates proportional shares based on family size, number of children, elderly members, disabled members, and whether anyone in the household earns an income. The results are published publicly before delivery, and the delivered amounts are published after. Anyone with internet access can verify the numbers.

---

## How a Cycle Works

The system operates in monthly cycles.

A volunteer finds a family that cannot support itself. They register the family in the system with full household details, a need assessment, and their own identity on the record. An admin reviews and approves the registration.

Donors contribute throughout the month. Each donor submits the transaction reference of their bKash, Nagad, or bank transfer. An admin verifies the transaction and confirms it into the pool. The donor receives a receipt number and a confirmation email. If the donor wants to remain anonymous on the public ledger, that preference is respected, but the amount is always shown.

When the admin is ready to run a distribution cycle, the system calculates how the pool should be split across all approved families. The calculation is deterministic and documented. The volunteer who covers each family reviews their allotment before the cycle goes live. If a family has an urgent situation that month, the volunteer can flag it or submit a special need application. The admin reviews adjustments, locks the amounts, and activates the cycle.

Volunteers then deliver to their assigned families and record delivery. Once all deliveries are complete, the admin closes the cycle and publishes the results to the public ledger. The cycle is permanently on record. It cannot be altered.

---

## Who Is Involved

Donors are the simplest participant. They can donate with or without an account. With an account they get a dashboard showing their donation history and receipt numbers. Without an account they get a receipt number in their confirmation email and can find their transaction on the public ledger using that number.

Volunteers must complete a full KYC process before accessing any tools. They submit their NID or passport (front and back), a passport-size photo, their present address, and their permanent address. An admin reviews the documents before approving access. Every action a volunteer takes in the system is permanently logged with their identity attached. If a volunteer registers a family that turns out to be fraudulent, the record shows exactly who submitted it and when.

Admins have access to the full system. They confirm donations, approve beneficiaries, approve volunteer KYC, run distribution cycles, and view the audit log. Every admin action is recorded in a separate append-only audit database that cannot be modified or deleted even by other admins. The first admin must be seeded manually in the database. All subsequent admins are added by an existing admin.

---

## The Public Ledger

The public ledger at `/ledger` is readable by anyone with no login required. It shows every confirmed donation, every completed distribution cycle, and every verified volunteer. The data is served from a Supabase read replica that is kept in sync within seconds of every write to the primary database. The primary database never serves public reads.

Donations show the donor name (or Anonymous), the amount, the method, the date, and a link to the receipt. Distributions show the cycle period, total pool, number of families, and total distributed. Volunteers show their name, district, and verification status.

---

## The Technical System

The application is a Next.js 16 server-side rendered app running on a self-hosted Kubernetes cluster. The database is PostgreSQL 17 on a StatefulSet with Longhorn persistent storage. Authentication is handled by Better Auth with email and password, Redis-backed sessions, and full audit of every sign-in. File storage uses Cloudflare R2 with two separate buckets: one public for donation receipts and volunteer passport photos, one private for KYC identity documents. KYC documents are never served from a public URL. They are fetched from the private bucket server-side by an authenticated admin endpoint and logged in the audit trail every time they are accessed.

Email is handled by Resend. When a donor submits a donation, they receive a confirmation email with their receipt number, a summary of the pending status, and a direct link to the public ledger. If they provided an email, they are urged to monitor the ledger until their donation is confirmed. The verification email for new accounts uses the same template structure.

The sync worker is a separate process running in the cluster. It listens for database change notifications and pushes updates to three external destinations: the Supabase public ledger replica (7 public tables, real-time), Neon (9 business tables, real-time full backup), and the Supabase backup database (daily full pg_dump of everything including the audit database). If any destination fails, the others continue independently. The watermark only advances after a successful commit, so a crashed sync worker replays any missed writes on restart.

Money math is enforced at multiple layers. The database has CHECK constraints that prevent any donation amount from being zero or negative, and any allotment from being negative. State transitions are atomic: a donation can only be confirmed if it is currently pending, a distribution cycle can only be activated if the total allocation does not exceed the pool, and a completed cycle cannot be reopened. A reconciliation check runs at publish time to verify that the sum of all allotments plus the remaining pool equals the original pool cap to within a rounding tolerance. If the check fails, the cycle cannot be published.

---

## Running Locally

Prerequisites: Docker and Node.js 24 or later.

```bash
git clone https://github.com/RAFSuNX/Amanat.git
cd Amanat
docker compose up app-dev --build
```

That single command starts postgres, the audit database, Redis, runs all migrations, seeds mock data, and starts the Next.js development server at http://localhost:3000.

The dev environment uses only local databases and hardcoded local-only credentials. It never connects to the production databases, Neon, Supabase, or R2. The seed script verifies that the database URL contains localhost before inserting any data, so it cannot run against a remote database even if misconfigured.

To create a dev admin account, register at `/register` with any email and password, then run:

```bash
docker exec amanat-postgres-1 psql -U amanat -d amanat \
  -c "UPDATE users SET role='ADMIN', email_verified=true WHERE email='your@email.com';"
```

Email verification is not required in the dev environment because RESEND_API_KEY is empty, which sets requireEmailVerification to false in Better Auth.

| | Dev (docker compose up app-dev) | Prod (k8s + Flux) |
|---|---|---|
| Database | Local Docker postgres | In-cluster postgres-0 on Longhorn |
| Secrets | Hardcoded local values in compose | Doppler synced to k8s ExternalSecret |
| Migrations | Auto-run on container start | db-migrate k8s Job before rollout |
| Seed data | Mock data on first run | Never |
| Email | Disabled | Resend |
| File storage | Fake R2, uploads fail gracefully | Cloudflare R2 |
| Connectivity checks | Skipped | Run at every pod startup |

---

## Deploying

Production deploys are triggered manually via GitHub Actions and delivered by Flux GitOps. The workflow builds multi-arch Docker images (amd64 and arm64 natively, no QEMU emulation) and pushes them to GHCR. After a successful build, the image SHA is updated in the server-hub repository and Flux rolls it out to the cluster.

```bash
gh workflow run "CI and build" --repo RAFSuNX/Amanat --ref main
```

The deploy sequence is: migration job runs first (applies all pending Drizzle migrations to the primary database, the audit database, and Neon), then new app pods start, then old pods terminate. The public ledger replica and backup database are not blocking. If they are unreachable during deployment, the migration job logs the failure and continues.

Secrets are managed in Doppler under the amanat project, prd config, and synced to the cluster via External Secrets Operator.

---

## Rollback

Rolling back the application is a one-line change to the image SHA in the server-hub kustomization. The database schema is forward-only. Additive migrations (new nullable columns, new indexes) are backward-compatible with the previous app image, so an app rollback after an additive migration is safe.

Destructive schema changes are not auto-revertible. In that case, restore from Neon (real-time copy, seconds of lag) or from the Supabase backup (nightly pg_dump). Full restore procedures are in `docs/disaster-recovery.md`.

---

## Principles

No middlemen on the money. Funds go directly to volunteers who handle the actual purchase and delivery of necessities. The system does not hold a float or pay out through any intermediary.

Permanent records. Every family, every donation, every distribution, every admin action is in the system indefinitely and cannot be removed.

Public accountability. Any person anywhere can open the ledger and verify the numbers without creating an account.

Need, not equality. A household with three children, an elderly dependent, and no earner receives more than a household with two working adults. The algorithm is documented and deterministic.

---

## License

MIT
