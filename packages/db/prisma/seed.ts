import { PrismaClient, UserRole, BannerPosition } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Phase 1 seed: a minimal, idempotent baseline so the app boots with data.
 * Creates an admin user, a small category tree, and a home banner.
 * Real catalogue/seller data arrives in Phase 2.
 */
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@bazaarx.app" },
    update: {},
    create: {
      email: "admin@bazaarx.app",
      name: "BazaarX Admin",
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  const categories: { name: string; slug: string }[] = [
    { name: "Electronics", slug: "electronics" },
    { name: "Fashion", slug: "fashion" },
    { name: "Home & Kitchen", slug: "home-kitchen" },
    { name: "Beauty", slug: "beauty" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { name: c.name, slug: c.slug, level: 1 },
    });
  }

  const banners = await prisma.banner.findMany({ where: { position: BannerPosition.HOME } });
  if (banners.length === 0) {
    await prisma.banner.create({
      data: {
        imageUrl: "https://placehold.co/1200x400?text=BazaarX",
        linkUrl: "/search",
        position: BannerPosition.HOME,
        priority: 1,
      },
    });
  }

  console.log(`Seeded admin ${admin.email}, ${categories.length} categories, banners.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
