-- Applied to the live project on 2026-10-08 (migration name: legal_consents).
-- Proof that a person accepted a given version of the Terms of Service and Privacy Policy.
-- Append-only from the app: people can add and read their own records, never change or delete them.
-- Removed together with the account (on delete cascade), like every other per-user table.
create table public.legal_consents (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  terms_version text not null check (length(terms_version) between 1 and 32),
  privacy_version text not null check (length(privacy_version) between 1 and 32),
  accepted_at timestamptz not null,          -- when the box was ticked, from the phone
  recorded_at timestamptz not null default now(), -- when the server received it
  method text not null check (method in ('email', 'google', 'apple', 'update')),
  platform text check (length(platform) <= 16),
  app_version text check (length(app_version) <= 32),
  unique (user_id, terms_version, privacy_version)
);

alter table public.legal_consents enable row level security;

create policy "Users record their own consent" on public.legal_consents
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users read their own consent" on public.legal_consents
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.legal_consents from anon;
revoke update, delete, truncate on public.legal_consents from authenticated;
