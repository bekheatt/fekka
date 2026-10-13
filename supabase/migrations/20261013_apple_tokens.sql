-- Sign in with Apple: the refresh token Apple gives us at sign-in, kept only so we can
-- revoke it when the person deletes their account (Apple requirement).
-- Only the apple-token edge function (service role) reads or writes it: RLS on, no policies.
-- The row goes with the account via on delete cascade.
create table if not exists public.apple_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  created_at timestamptz not null default now()
);

alter table public.apple_tokens enable row level security;
revoke all on public.apple_tokens from anon, authenticated;
