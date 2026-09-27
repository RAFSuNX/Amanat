// Seed realistic mock data for local development.
// Run: node scripts/seed-dev.mjs (or called from dev.sh)
// Safe to re-run — uses INSERT ... ON CONFLICT DO NOTHING.

import postgres from "postgres"

const DB = process.env.DATABASE_URL || "postgresql://amanat:amanat_dev@localhost:5432/amanat"

// Hard stop if this looks like a production database
if (!DB.includes("localhost") && !DB.includes("127.0.0.1")) {
  console.error("\x1b[31m[seed] ABORTED — DATABASE_URL does not point to localhost.\x1b[0m")
  console.error("\x1b[31m[seed] This script must only run against a local dev database.\x1b[0m")
  process.exit(1)
}

const sql = postgres(DB, { max: 1 })

const cyan = (s) => `\x1b[36m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`

async function seed() {
  console.log(cyan("\n[seed] Inserting dev mock data...\n"))

  // Admin
  await sql`INSERT INTO users (id, name, email, role, email_verified, created_at, updated_at)
    VALUES ('dev-admin-000000000000000000000000', 'Dev Admin', 'admin@dev.local', 'ADMIN', true, now(), now())
    ON CONFLICT (id) DO NOTHING`
  console.log(green("  ✓ admin: admin@dev.local"))

  // Volunteer
  await sql`INSERT INTO users (id, name, email, role, phone, email_verified, created_at, updated_at)
    VALUES ('dev-volunteer-00000000000000000000', 'Karim Hossain', 'volunteer@dev.local', 'VOLUNTEER', '01712345678', true, now(), now())
    ON CONFLICT (id) DO NOTHING`
  await sql`INSERT INTO volunteer_profiles (user_id, district, upazila, kyc_status)
    VALUES ('dev-volunteer-00000000000000000000', 'Dhaka', 'Mirpur', 'APPROVED')
    ON CONFLICT (user_id) DO NOTHING`
  console.log(green("  ✓ volunteer: Karim Hossain (Dhaka/Mirpur, KYC approved)"))

  // Donor
  await sql`INSERT INTO users (id, name, email, role, email_verified, created_at, updated_at)
    VALUES ('dev-donor-0000000000000000000000000', 'Rina Begum', 'donor@dev.local', 'DONOR', true, now(), now())
    ON CONFLICT (id) DO NOTHING`
  console.log(green("  ✓ donor: Rina Begum"))

  // Donations
  await sql`INSERT INTO donations (user_id, donor_name, donor_phone, donor_email, amount, method, transaction_ref, is_anonymous, status, confirmed_at)
    VALUES
      ('dev-donor-0000000000000000000000000', 'Rina Begum',  '01712345678', 'donor@dev.local', '5000.00', 'BKASH', 'DEV-BK-001', false, 'CONFIRMED', now()-interval'5 days'),
      ('dev-donor-0000000000000000000000000', 'Rina Begum',  '01712345678', 'donor@dev.local', '2500.00', 'NAGAD', 'DEV-NG-001', false, 'CONFIRMED', now()-interval'2 days'),
      (NULL, 'Anonymous',   NULL,           NULL,            '1000.00', 'BANK',  'DEV-BNK-001', true,  'PENDING', NULL),
      (NULL, 'Rafiq Ahmed', '01987654321',  'rafiq@dev.local','3000.00','BKASH', 'DEV-BK-002',  false, 'PENDING', NULL)
    ON CONFLICT DO NOTHING`
  console.log(green("  ✓ donations: 2 confirmed, 2 pending"))

  // Beneficiaries
  const [b1] = await sql`
    INSERT INTO beneficiaries (name, phone, district, upazila, village, nid_number, type, status, registered_by_volunteer_id)
    VALUES ('Fatema Khatun', '01856789012', 'Dhaka', 'Badda', 'South Badda', 'DEV-NID-001', 'FAMILY', 'ACTIVE', 'dev-volunteer-00000000000000000000')
    ON CONFLICT DO NOTHING RETURNING id`

  const [b2] = await sql`
    INSERT INTO beneficiaries (name, phone, district, upazila, village, type, status, registered_by_volunteer_id)
    VALUES ('Jamal Uddin', '01734567890', 'Dhaka', 'Mirpur', 'Mirpur-10', 'INDIVIDUAL', 'ACTIVE', 'dev-volunteer-00000000000000000000')
    ON CONFLICT DO NOTHING RETURNING id`

  if (b1?.id) await sql`
    INSERT INTO beneficiary_members (beneficiary_id, name, relation, age, is_disabled, is_earner, updated_at)
    VALUES
      (${b1.id}, 'Fatema Khatun', 'Self',   45, false, false, now()),
      (${b1.id}, 'Karim',         'Spouse', 50, true,  false, now()),
      (${b1.id}, 'Riya',          'Child',  12, false, false, now())
    ON CONFLICT DO NOTHING`

  console.log(green("  ✓ beneficiaries: 2 active families with members"))

  // Distribution cycle
  await sql`
    INSERT INTO distribution_cycles (period, total_pool, special_deduction_total, status, notes, created_by_admin_id)
    VALUES ('2024-09', '7500.00', '0.00', 'DRAFT', 'Dev seed cycle - September 2024', 'dev-admin-000000000000000000000000')
    ON CONFLICT (period) DO NOTHING`
  console.log(green("  ✓ distribution cycle: 2024-09 (DRAFT)"))

  await sql.end()
  console.log(cyan("\n[seed] Done."))
  console.log(cyan("  Login at http://localhost:3000/login"))
  console.log(cyan("  Note: passwords must be set via /register or directly in DB\n"))
}

seed().catch((e) => { console.error("[seed] Error:", e.message); process.exit(1) })
