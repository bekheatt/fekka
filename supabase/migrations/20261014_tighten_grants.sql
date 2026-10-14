-- Defense in depth: take away table rights nobody uses. Row level security already blocks these;
-- this removes the second door too, so a future policy mistake can't open it.
--   * Signed-out visitors (anon) never touch any table: guests keep everything on the phone.
--   * sms_keys is only reached through new_sms_key() / remove_sms_key() and the sms-ingest function.
--   * sms_inbox rows are written by sms-ingest (service role); people only read and clear their own.
--   * TRUNCATE ignores row level security, so nobody but the service role gets it.
revoke all on public.user_data, public.legal_consents, public.merchant_votes, public.sms_inbox, public.sms_keys, public.apple_tokens from anon;
revoke all on public.sms_keys, public.apple_tokens from authenticated;
revoke insert, update on public.sms_inbox from authenticated;
revoke truncate, references, trigger on public.user_data, public.legal_consents, public.merchant_votes, public.sms_inbox from authenticated;
