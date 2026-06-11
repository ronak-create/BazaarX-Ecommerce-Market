import { PrismaClient } from "@prisma/client";

/**
 * Creates the Storage buckets the app uploads to. Buckets are private; the
 * server signs uploads via the service-role key and serves via signed URLs.
 * Idempotent — safe to re-run.
 */
const prisma = new PrismaClient();

const BUCKETS: { id: string; public: boolean }[] = [
  { id: "products", public: true },
  { id: "kyc", public: false },
  { id: "reviews", public: true },
];

async function main() {
  for (const b of BUCKETS) {
    await prisma.$executeRawUnsafe(
      `insert into storage.buckets (id, name, public)
       values ($1, $1, $2)
       on conflict (id) do update set public = excluded.public`,
      b.id,
      b.public,
    );
    console.log(`bucket ready: ${b.id} (public=${b.public})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
