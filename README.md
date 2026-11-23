# Diangle AutoMaster

A full-stack car marketplace and dealership workspace. The public storefront includes searchable vehicle inventory, vehicle detail pages and customer enquiries. The protected workspace manages vehicle listings, availability, vehicle photos and incoming leads.

## Stack

- Next.js App Router, React and TypeScript
- Supabase Auth with server-side cookie sessions
- Supabase Postgres with row-level security
- Supabase Storage for vehicle photos
- Responsive storefront and admin workspace

## Run locally

1. Install Node.js 22 or newer.
2. Create a Supabase project and run [`supabase/migrations/202611230001_initial_schema.sql`](supabase/migrations/202611230001_initial_schema.sql) in its SQL Editor.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project API settings. Set `NEXT_PUBLIC_SITE_URL` to the local or production origin.
4. In Supabase Authentication, create an administrator user with email and password. Disable public sign-ups for a private dealer workspace.
5. In the SQL Editor, grant that user administrator access. Replace the example email with the administrator's exact sign-in email:

   ```sql
   insert into public.admin_users (user_id, display_name)
   select id, 'GRUID' from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL')
   on conflict (user_id) do update set display_name = excluded.display_name;
   ```

   The dashboard greets the administrator using this display name. Change `GRUID` to another name if desired.

6. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`. The public collection has a demo catalog until database inventory is added; admin features require the configured Supabase project.

## Deploy

Deploy to a Node.js host such as Vercel. Configure the same environment variables, set `NEXT_PUBLIC_SITE_URL` to the public site origin, run the SQL migration, create the administrator, and add the production callback URL under Supabase Authentication URL Configuration. Use HTTPS and keep Supabase's service-role key out of this application; only the public publishable/anon key belongs in the browser environment.

## Main routes

- `/` — public car collection with make, text and price filters
- `/cars/[slug]` — vehicle details and enquiry form
- `/login` — team sign-in
- `/admin` — protected vehicle and enquiry management
- `/auth/callback` — Supabase auth code callback

## Operational notes

- `admin_users` is the source of truth for administrator access. Server-side routes and database policies both enforce it.
- The `vehicles` storage bucket serves public car photos. Storage writes are restricted to administrators, and uploads are limited to 8 MB image files.
- Enquiry submission is intentionally public. Before high-volume production use, add CAPTCHA or an edge rate limit and configure a retention policy for customer data.
- Demo car records are presentation fallbacks only. The dashboard writes to Supabase and does not modify the demo data.
