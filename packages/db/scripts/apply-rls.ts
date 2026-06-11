// Applies prisma/rls.sql to the connected database. Run with `pnpm db:apply-rls`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src";

async function main() {
  const sql = readFileSync(join(__dirname, "..", "prisma", "rls.sql"), "utf8");
  await prisma.$executeRawUnsafe(sql);
  console.log("RLS applied: row level security enabled on all app tables + storage read policy.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
