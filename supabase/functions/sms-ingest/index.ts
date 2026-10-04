// Receives a bank SMS from the user's iPhone Shortcut and puts the transaction in their inbox.
//   POST https://<project>.supabase.co/functions/v1/sms-ingest?key=<personal key>
//   body: JSON { "text": "<the message>" }  (plain text bodies work too)
// The message is parsed here and only the result is stored — the text itself is never saved.
// parse.ts is a copy of src/features/SmsImport/parse.ts: copy it again and redeploy when that changes.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { parseSms } from './parse.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const MAX_TEXT = 2000;
const MAX_PENDING = 300; // stops a leaked key from flooding someone's inbox

const reply = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const sha256 = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .map(b => b.toString(16).padStart(2, '0')).join('');

// The date exactly as the bank wrote it (Egypt time), with no timezone: "2026-09-30T20:48".
// The phone reads it back as its own local time.
const p = (n: number) => String(n).padStart(2, '0');
const localStamp = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;

async function readText(req: Request) {
  const type = req.headers.get('content-type') ?? '';
  if (type.includes('json')) {
    const body = await req.json().catch(() => ({}));
    return typeof body?.text === 'string' ? body.text : body?.text != null ? String(body.text) : '';
  }
  if (type.includes('form')) {
    const form = await req.formData().catch(() => null);
    return String(form?.get('text') ?? '');
  }
  return await req.text();
}

Deno.serve(async req => {
  if (req.method !== 'POST') return reply(405, { ok: false, error: 'Use POST' });

  const key = new URL(req.url).searchParams.get('key') ?? req.headers.get('x-fakka-key') ?? '';
  if (key.length < 32 || key.length > 128) return reply(401, { ok: false, error: 'Missing or invalid key' });

  const { data: owner, error: keyErr } = await db.from('sms_keys').select('user_id').eq('key_hash', await sha256(key)).maybeSingle();
  if (keyErr) return reply(500, { ok: false, error: 'Server error' });
  if (!owner) return reply(401, { ok: false, error: 'This link was reset or turned off. Copy the new one from Fakka.' });

  const text = (await readText(req)).slice(0, MAX_TEXT);
  const tx = parseSms(text);
  if (!tx) return reply(200, { ok: true, added: false, reason: 'Not a payment message' });

  const { count } = await db.from('sms_inbox').select('id', { count: 'exact', head: true }).eq('user_id', owner.user_id);
  if ((count ?? 0) >= MAX_PENDING) return reply(429, { ok: false, error: 'Too many waiting. Open Fakka to review them.' });

  const { error } = await db.from('sms_inbox').upsert({
    user_id: owner.user_id,
    fingerprint: tx.fingerprint,
    tx: { kind: tx.kind, amount: tx.amount, currency: tx.currency, party: tx.party ?? null, channel: tx.channel, date: tx.date ? localStamp(tx.date) : null },
  }, { onConflict: 'user_id,fingerprint', ignoreDuplicates: true });
  if (error) return reply(500, { ok: false, error: 'Server error' });

  return reply(200, { ok: true, added: true, kind: tx.kind, amount: tx.amount, currency: tx.currency, party: tx.party ?? null });
});
