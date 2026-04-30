# ACME Bottles Supply Chain System

A runnable full-stack take-home solution for ACME Bottles, a plastic bottle manufacturer that needs to track raw material supplies, purchase orders, and production scheduling across two dedicated production lines.

## Features

- Production status dashboard at `/production-status`
- Purchase order management at `/purchase-orders`
- Supply order management at `/supply-orders`
- FIFO production scheduling by purchase order creation time
- Material-constrained scheduling with expected start and completion times
- Dynamic statuses: `Completed`, `In Production`, `Pending`, `Delay expected`, and `Unable to fulfill`
- Server-side validation for all create workflows
- SQLite database with Prisma ORM and seed data
- Unit tests for the scheduling engine

## Tech Stack

- Next.js App Router
- TypeScript
- Prisma ORM
- SQLite
- Tailwind CSS
- Zod
- Vitest

## Architecture

The app persists only business facts:

- Purchase orders
- Supply orders

Production state is computed dynamically from current time, FIFO order order, line capacity, material requirements, received supplies, and future incoming supplies. The scheduling engine lives in `lib/scheduler.ts` as a pure TypeScript function so it can be tested without Next.js, Prisma, or a database.

## Scheduling Logic

ACME produces only:

- `1-Liter Bottle` on the 1-liter line at 2,000 bottles/hour
- `1-Gallon Bottle` on the 1-gallon line at 1,500 bottles/hour

Purchase orders are sorted FIFO by `createdAt`, then `id`. Supply orders are sorted by ETA, then creation time. The scheduler maintains independent availability cursors for the two production lines and global FIFO material reservations across all orders.

For each order, the engine:

1. Computes required material in kilograms.
2. Finds the assigned production line and earliest line slot.
3. Finds the earliest time all required materials are available after earlier FIFO reservations.
4. Marks the order `Unable to fulfill` if total received plus incoming material can never satisfy it.
5. Otherwise schedules the order at the later of line availability and material availability.
6. Calculates completion time from quantity and line capacity.
7. Computes status from `now`.

The scheduler replays the order history from each line's earliest purchase order so demo data can show completed and in-production work. This keeps the dashboard useful as a live operational view instead of only showing future work.

## Material Calculations

All supplies are entered in kilograms. Bottle requirements are defined in grams per unit and converted with:

```text
required_kg = quantity * grams_per_unit / 1000
```

1-gallon bottle:

- 65g PET Resin
- 45g PTA
- 20g EG

1-liter bottle:

- 20g PET Resin
- 15g PTA
- 10g EG

## Tradeoffs And Assumptions

- Supplies, purchase orders, and produced goods are free.
- No caps, labels, packaging, invoices, shipping, storage, warehouse movement, downtime, or quality issues are modeled.
- Production lines run 24/7 at full capacity.
- Produced goods are considered fulfilled immediately after production completes.
- `Unable to fulfill` orders do not block a production line forever. They are marked as business exceptions, skipped for material and line reservations, and later orders continue scheduling. This keeps the dashboard operational while still surfacing the exception clearly.

## Run Locally

```bash
git clone <repo-url>
cd acme-bottles
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Commands

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:reset
```

The default local database URL is:

```bash
DATABASE_URL="file:./dev.db"
```

## Tests And Build

```bash
npm test
npm run lint
npm run build
```

## Navigate The App

- `/production-status`: current line cards, material snapshot, FIFO schedule table
- `/purchase-orders`: newest-first purchase order list, search, create purchase order form
- `/supply-orders`: current material totals, newest-first supply list, search, create supply order form

## Publishing To GitHub

```bash
git init
git add .
git commit -m "Build ACME Bottles supply chain system"
gh repo create acme-bottles --public --source=. --remote=origin --push
```

If GitHub CLI is unavailable:

```bash
git remote add origin https://github.com/<your-username>/acme-bottles.git
git branch -M main
git push -u origin main
```

## Tools And Major Prompts Used

This project was generated with Codex from the Flow AI take-home prompt describing ACME Bottles, the required pages, the scheduling rules, Prisma/SQLite persistence, and the required README/test/build quality bar.
