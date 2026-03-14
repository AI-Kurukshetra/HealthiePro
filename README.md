# Healthie App (Next.js + Supabase + Vercel)

Feature coverage against `../plan.md`:
- User onboarding and authentication (Supabase Auth)
- Patient profile and health record management
- Appointment booking and teleconsultation link generation
- Care plans and task tracking
- In-app notifications (channel model supports email/SMS records)
- Admin dashboard with aggregate reporting
- Security via RLS and audit logging

## Local setup

1. Ensure `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

2. Run schema in Supabase SQL editor:

```sql
-- paste contents of supabase/schema.sql
```

3. Install and run:

```bash
npm install
npm run dev
```

## Important role setup

To enable admin dashboard for your user, run in Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = '<your-auth-user-id>';
```

## Deploy to Vercel

1. Push this `healthie-app` folder to GitHub.
2. Import repo to Vercel.
3. Set environment variables in Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

## Map to custom domain `healthie.com`

1. In Vercel project: Settings -> Domains -> add `healthie.com` and `www.healthie.com`.
2. In your DNS provider for `healthie.com`:
- `A` record for root (`@`) to `76.76.21.21`
- `CNAME` for `www` to `cname.vercel-dns.com`
3. Wait for DNS propagation and verify TLS status in Vercel.

Without domain ownership and DNS access, this final step cannot be completed programmatically from this workspace.
