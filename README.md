# Vet Bill Fair Concierge MVP

Minimal concierge flow for uploading a vet invoice, collecting payment, and reviewing submissions.

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file locally and set these values:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
APP_URL=http://localhost:3000

TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID=...

ADMIN_TOKEN=...
```

## Prisma + Railway Postgres

1. Create a Railway Postgres database and copy the connection string into `DATABASE_URL`.
2. Run the Prisma migration (local) and deploy in production:

```bash
npm run prisma generate
npm run prisma migrate dev
npm run migrate:deploy
```

Migration files live in `prisma/migrations`.

## Cloudflare R2

- Create an R2 bucket and credentials with read/write access.
- Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`.
- The app uses presigned PUT for uploads and presigned GET for admin invoice access.

## Turnstile

- Create a Turnstile site key and secret key.
- Client-side uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- Server verifies `TURNSTILE_SECRET_KEY` inside `/api/upload/presign`.

## Stripe

- Create a product + price, then set `STRIPE_PRICE_ID`.
- Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- Configure webhook endpoint to `/api/stripe/webhook`.

## Admin

- Open `/admin`.
- Paste `ADMIN_TOKEN` to view orders.
- Use the action buttons to update status or download invoice.

## NPM Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - build the app
- `npm run start` - start production server
- `npm run prisma` - Prisma CLI
- `npm run migrate:deploy` - deploy migrations
