# Affiliate Manager

Next.js (App Router) full-stack app to manage affiliate deals and schedule posts to
Facebook Pages, a Telegram channel and a public Bio link page.

## Stack
- Next.js + TypeScript, Tailwind CSS, shadcn/ui (Radix), lucide-react
- PostgreSQL + Prisma 7 (`prisma/schema.prisma`, config in `prisma7.config.ts`,
  client generated to `src/generated/prisma`, not committed)
- Data access only through server-only modules in `src/lib` (`deals.ts`, `posts.ts`,
  `channels.ts`, `bio.ts`) using `getDb()` from `src/lib/db.ts`; pages never import Prisma directly.

## Local database
- `npm run db:up` (Docker PostgreSQL from `compose.yaml`), then `npm run db:migrate` and
  `npm run db:seed` (the seed wipes all data; development only).

## UI rules
- The approved design is in `docs/design/`. Read `docs/design/DESIGN.md` before building
  or changing any screen, and open the matching mockup in `docs/design/screens/`.
- Match the mockup layout, spacing, colors and Vietnamese copy. Use the tokens and
  shadcn component mapping from DESIGN.md; do not invent new colors or fonts.
- Never copy the mockup runtime syntax (`{{ }}`, `<sc-if>`, `<x-dc>`) into app code.

## Conventions
- Explain changes to the user in short, simple Vietnamese.
- Variable names, function names and code comments in English.
- Secrets (Facebook/Telegram tokens, DATABASE_URL) only in `.env`, never in code or tests.
  Keep `.env.example` with empty values.
