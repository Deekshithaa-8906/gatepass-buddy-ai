create table if not exists public.registration_otp_challenges (
  email text primary key,
  role text not null default 'student',
  otp_hash text not null,
  otp_salt text not null,
  expires_at timestamp with time zone not null,
  verified_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_registration_otp_challenges_expires_at
  on public.registration_otp_challenges (expires_at);

alter table public.registration_otp_challenges enable row level security;