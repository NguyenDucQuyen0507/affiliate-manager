// Seeds the database with the mockup sample data: `npx prisma db seed`.
// WARNING: wipes users, channels, deals and posts first. Development only.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { fromAppDateTime, fromDateKey } from "../src/lib/format";
import { hashPassword } from "../src/lib/password";
import { buildDealSearchText } from "../src/lib/search-text";
import { seedChannels, seedDeals, seedUser } from "./seed-data";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed: NODE_ENV is production (the seed deletes all data).");
}
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set (see .env.example)");

// The admin password comes from the environment, never from source code.
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
if (!adminPassword || adminPassword.length < 12) {
  throw new Error("Set SEED_ADMIN_PASSWORD in .env (at least 12 characters) to seed the admin user.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // Newest first in the deal list = first entry in seedDeals (as in the mockup).
  const newest = Date.now();
  // Hash outside the transaction: argon2 is deliberately slow.
  const passwordHash = await hashPassword(adminPassword!);

  await prisma.$transaction(
    async (tx) => {
      await tx.post.deleteMany();
      await tx.deal.deleteMany();
      await tx.channel.deleteMany();
      await tx.user.deleteMany();

      const user = await tx.user.create({ data: { ...seedUser, passwordHash } });

      const channelIdByKey = new Map<string, string>();
      for (const [index, channel] of seedChannels.entries()) {
        const { key, ...data } = channel;
        const created = await tx.channel.create({
          data: { ...data, ownerId: user.id, createdAt: new Date(newest - (seedChannels.length - index) * 1000) },
        });
        channelIdByKey.set(key, created.id);
      }

      for (const [index, deal] of seedDeals.entries()) {
        const { posts, expiresAt, ...data } = deal;
        await tx.deal.create({
          data: {
            ...data,
            ownerId: user.id,
            expiresAt: expiresAt ? fromDateKey(expiresAt) : null,
            searchText: buildDealSearchText(deal.title, deal.searchCode),
            createdAt: new Date(newest - index * 60_000),
            posts: {
              create: posts.map((post) => {
                const channelId = channelIdByKey.get(post.channelKey);
                if (!channelId) throw new Error(`Unknown channel key: ${post.channelKey}`);
                const scheduledAt = fromAppDateTime(post.scheduledAt);
                return {
                  channelId,
                  scheduledAt,
                  status: post.status,
                  errorMessage: post.errorMessage,
                  publishedAt: post.status === "PUBLISHED" ? scheduledAt : null,
                };
              }),
            },
          },
        });
      }
    },
    { timeout: 60_000 },
  );

  const [users, channels, deals, posts] = await Promise.all([
    prisma.user.count(),
    prisma.channel.count(),
    prisma.deal.count(),
    prisma.post.count(),
  ]);
  console.log(`Seeded ${users} user, ${channels} channels, ${deals} deals, ${posts} posts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
