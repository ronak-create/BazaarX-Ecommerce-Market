import { PrismaClient, UserRole } from "@prisma/client";

/**
 * Promote a user to ADMIN by email. Run after the person has signed in once
 * (so their User row exists from the auth sync):
 *   pnpm db:make-admin you@example.com
 */
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm db:make-admin <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email ${email}. Sign in first, then re-run.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: UserRole.ADMIN },
  });
  console.log(`${email} is now ADMIN.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
