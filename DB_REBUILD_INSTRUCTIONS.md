# DB Rebuild Instructions (New Supabase Project)

This project was rebuilt to run on a brand new Supabase project. Follow these steps in order.

## 1) Create a new Supabase project
- Supabase dashboard -> New project
- Save the Project URL and API keys

## 2) Update local environment variables
Update [.env](.env) with the new project values:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Security note:
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It must only be used in Edge Functions or server-side code.

## 3) Run the rebuild SQL
- Open Supabase -> SQL Editor
- Paste and run [DB_REBUILD.sql](DB_REBUILD.sql)

This creates:
- All tables, views, RLS, and policies
- Storage buckets and policies
- Realtime publication

## 4) Configure Auth
Supabase -> Authentication -> Providers:
- Enable Email (OTP / Magic Link)
- Set Site URL to your frontend (local or Vercel)
- Add redirect URLs (example):
  - `http://localhost:8080/**`
  - `http://localhost:5173/**`
  - `https://<your-vercel-domain>/**`

## 5) Deploy Edge Functions
Deploy the two Edge Functions:
- `registration-otp`
- `admin-user-mailer`

Set function environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (or your chosen email provider key)
- `RESEND_FROM_EMAIL`
- `ALLOWED_ORIGINS` (comma-separated list of allowed origins)

## 6) Create the admin user
Create the user in Supabase Auth (Email):
- Example: `admin@snsgroups.com`

Then insert the row in `user_directory`:
```sql
insert into public.user_directory (
  auth_user_id,
  email,
  role,
  status,
  access_status,
  account_status,
  full_name,
  onboarding_complete
)
values (
  '<auth-user-id-from-supabase>',
  'admin@snsgroups.com',
  'admin',
  'approved',
  'approved',
  'active',
  'Admin',
  true
);
```

## 7) Optional: seed test users
Create test users in Supabase Auth and insert matching rows in `user_directory`.

## 8) Verify flows
- Register -> OTP -> pending approval
- Admin approval -> login
- Student request -> mentor/advisor/hod/warden approvals
- Complaints -> escalation -> principal
- Realtime updates

If you want, I can also generate a seed SQL file for test users and sample data.
