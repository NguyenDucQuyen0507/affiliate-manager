# Affiliate Manager

Next.js (App Router) full-stack app to manage affiliate deals and schedule posts to
Facebook Pages, a Telegram channel and a public Bio link page.

## Stack
- Next.js + TypeScript, Tailwind CSS, shadcn/ui (Radix), lucide-react
- PostgreSQL (ORM to be decided: Prisma or Drizzle)

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
