# Project: Personal Portfolio & Freelance Landing Site

## What this is
Dark-theme personal site combining a photography portfolio with a freelance lead capture page.
Single-page scroll layout with a separate gallery route per collection.

## Stack
- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, React 19
- motion/react for animations
- @react-three/fiber + drei + three.js for 3D (flintlock pistol scroll scene)
- Prisma 5 + Neon PostgreSQL for lead capture
- react-hook-form + Zod 4 for form validation
- Deployed to Vercel

## File structure
- /src/app/ — Next.js App Router pages and API routes
- /src/components/ — UI components (fancy/ for animation primitives)
- /src/lib/ — shared utilities, DB client, collections config, validations
- /src/generated/prisma/ — generated Prisma client (do not edit)
- /public/photos/{slug}/ — gallery images per collection

## Key files
- `src/lib/collections.ts` — single source of truth for SECTION_IDS, PAGE_NAMES, GALLERY_BASE_PATH, and COLLECTIONS array
- `src/components/Framescape.tsx` — SLOTS array controls floating card positions/depth
- `src/components/GalleryClient.tsx` — SCATTER array controls initial photo positions on drag board
- `src/app/gallery/[slug]/page.tsx` — static gallery route, uses generateStaticParams

## Rules
- Never install npm packages without asking first
- Always English in code and comments
- Prisma must stay at v5 — do not upgrade to v6/v7
- Zod 4: use `message` (not `required_error`) in enum schema params
- Keep all UI consistent with the dark terracotta/cream palette:
  - Background: `#100e0c`
  - Accent: `#C07548`
  - Text: `#f2ede8`
  - Muted: `#8c7f74`
- Read `node_modules/next/dist/docs/` before using any Next.js API — this version may differ from training data
- When I say "deploy", run: `git push` (Vercel auto-deploys from main)
- To add photos: drop images into `/public/photos/{slug}/` and update `COLLECTIONS` in `src/lib/collections.ts`
