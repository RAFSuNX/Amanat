# Amanat

**The Hope of All of Us**

Amanat is a welfare system, not a platform. It exists to connect people who are willing to donate with volunteers who go on the ground to find and support those who genuinely cannot sustain themselves or their families.

We believe welfare must be structured, accountable, and transparent. Every taka donated is recorded. Every family registered is on record. Every distribution is calculated, reviewed, and published publicly. Nothing is hidden.

---

## What This Is

A monthly welfare cycle operates as follows:

1. **Donors contribute** via bKash or Nagad. They submit their transaction reference. An admin verifies and adds it to the shared fund pool.
2. **Volunteers register families** on the ground. They verify who cannot support themselves, record household details, assess monthly needs, and submit for admin approval.
3. **The system calculates distribution** proportionally, weighted by family size, dependants, disability, and earner status. Families with greater need receive a proportionally larger share.
4. **Volunteers review allotments** before the cycle goes live. If a family has an urgent situation that month, the volunteer can flag it or submit a special need application.
5. **Admin approves** the final distribution, volunteers deliver, and the results are published on the public ledger.

---

## Who Can Participate

| Role | How to join |
|---|---|
| Donor | Self-register at `/register`, or donate anonymously without an account |
| Volunteer | Invited by admin after an in-person verification process |
| Admin | First admin seeded manually; subsequent admins added by existing admin |

Volunteers must complete KYC (NID, passport, or driving license) before accessing any beneficiary tools.

---

## Transparency

All confirmed donations and completed distributions are publicly visible at `/ledger` with no login required. Donors may choose to remain anonymous per transaction, but the amount and date are always shown.

The distribution algorithm is documented and deterministic. The factors that determine allocation are:

- Declared monthly need (assessed by the volunteer)
- Family size
- Number of children (under 12)
- Number of elderly members (60 and above)
- Number of disabled members
- Whether the household has any earners

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, Node server) |
| Language | TypeScript |
| Database | PostgreSQL (local Docker, backed up to Supabase/Neon) |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| Cache | Redis |
| UI | Tailwind CSS + shadcn/ui |
| Files | Cloudinary (KYC documents, beneficiary photos) |
| Email | Resend (transactional notifications) |
| Deployment | Docker Compose on self-hosted cluster |
| Container Registry | GitHub Container Registry (GHCR) |

---

## Running Locally

**Prerequisites:** Docker, Node.js 20+

```bash
# Clone the repo
git clone https://github.com/RAFSuNX/Amanat.git
cd Amanat

# Copy environment variables
cp .env.example .env.local
# Fill in BETTER_AUTH_SECRET and optionally Cloudinary/Resend keys

# Start Postgres and Redis
docker compose up -d postgres redis

# Install dependencies
npm install

# Push database schema
DATABASE_URL=postgresql://amanat:amanat_dev@localhost:5432/amanat npx drizzle-kit push

# Start development server
npm run dev
```

Visit `http://localhost:3000`.

---

## Deploying with Docker

The app publishes a Docker image to GHCR on every push to `main`.

```bash
# Pull the latest image
docker pull ghcr.io/rafsunx/amanat:main

# Or use the full docker-compose setup
cp .env.example .env
# Set all production environment variables in .env
docker compose up -d
```

---

## Principles

**No middlemen on the money.** Funds go to volunteers who handle the actual purchase of necessities for each family. This prevents misuse and ensures the money reaches its purpose.

**Permanent records.** Every family registered stays in the system indefinitely. Their history, need assessments, and distributions are permanently recorded.

**Public accountability.** Any person anywhere can verify the ledger. If we said we distributed it, it is on record.

**Need, not equality.** We do not distribute equally. A household with three children and no earner receives more than a household with an income. The algorithm is documented.

---

## License

MIT
