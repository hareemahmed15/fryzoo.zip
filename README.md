# Fryzoo

Restaurant ordering app: Next.js (App Router) + TypeScript + Tailwind + Supabase.

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL + publishable key
3. In Supabase SQL Editor run `supabase/migrations/001_fryzoo_schema.sql`, then `supabase/seed.sql`
4. Create an admin user (see the setup guide in the chat) and run `npm run dev`

Change the delivery fee: Supabase -> Table Editor -> `app_settings` -> row `delivery_fee`.
