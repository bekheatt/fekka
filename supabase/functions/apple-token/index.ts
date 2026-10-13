// Sign in with Apple tokens, so Fakka can revoke them when someone deletes their account (Apple requirement).
//   POST https://<project>.supabase.co/functions/v1/apple-token   (signed-in user's JWT, verify_jwt on)
//   body: { "action": "save", "code": "<authorizationCode from the Apple sheet>" }  -> swaps it for a refresh token and keeps it
//         { "action": "revoke" }                                                   -> revokes the kept token with Apple
// Secrets (Supabase → Edge Functions → Secrets): APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (the .p8 file's text),
// APPLE_CLIENT_ID (com.fekka.app).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'npm:jose@5';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

// Short values: drop stray spaces or quotes from pasting
const env = (k: string) => (Deno.env.get(k) ?? '').replace(/[\s"']/g, '');
const TEAM = env('APPLE_TEAM_ID');
const KEY_ID = env('APPLE_KEY_ID');
const CLIENT = env('APPLE_CLIENT_ID') || 'com.fekka.app';
// Pasted keys arrive mangled (line breaks turned into spaces or "\n", headers missing), so keep
// only the base64 body and rebuild the PEM shape the key importer expects
const BODY = (Deno.env.get('APPLE_PRIVATE_KEY') ?? '')
  .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\\n/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
const PEM = BODY && `-----BEGIN PRIVATE KEY-----\n${BODY.match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----`;

const reply = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Apple's "client secret" is a short-lived JWT signed with the Sign in with Apple key
async function clientSecret() {
  const key = await importPKCS8(PEM, 'ES256');
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: KEY_ID })
    .setIssuer(TEAM)
    .setSubject(CLIENT)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

const apple = async (path: 'token' | 'revoke', form: Record<string, string>) =>
  fetch(`https://appleid.apple.com/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT, client_secret: await clientSecret(), ...form }),
  });

Deno.serve(req => handle(req).catch(e => {
  console.error('apple-token crashed', String(e?.message ?? e)); // e.g. a badly pasted private key
  return reply(500, { error: 'Server error' });
}));

async function handle(req: Request): Promise<Response> {
  if (req.method !== 'POST') return reply(405, { error: 'POST only' });
  if (!TEAM || !KEY_ID || !PEM) {
    console.error('apple secrets missing', { team: !!TEAM, keyId: !!KEY_ID, key: !!PEM });
    return reply(500, { error: 'Apple secrets are not set' });
  }

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: who } = await db.auth.getUser(jwt);
  const uid = who.user?.id;
  if (!uid) return reply(401, { error: 'Not signed in' });

  const body = await req.json().catch(() => ({}));

  if (body?.action === 'save') {
    if (typeof body.code !== 'string' || !body.code) return reply(400, { error: 'Missing code' });
    const res = await apple('token', { code: body.code, grant_type: 'authorization_code' });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.refresh_token) {
      console.error('apple token exchange failed', res.status, out.error, out.error_description);
      return reply(502, { error: out.error ?? 'Apple refused the code' });
    }
    const { error } = await db.from('apple_tokens').upsert({ user_id: uid, refresh_token: out.refresh_token, created_at: new Date().toISOString() });
    if (error) { console.error('apple token save failed', error.message); return reply(500, { error: error.message }); }
    return reply(200, { ok: true });
  }

  if (body?.action === 'revoke') {
    const { data: row } = await db.from('apple_tokens').select('refresh_token').eq('user_id', uid).maybeSingle();
    if (!row) return reply(200, { ok: true, revoked: false }); // nothing kept (e.g. signed in before tokens were saved)
    const res = await apple('revoke', { token: row.refresh_token, token_type_hint: 'refresh_token' });
    if (!res.ok) {
      console.error('apple revoke failed', res.status, await res.text().catch(() => ''));
      return reply(502, { error: `Apple revoke failed (${res.status})` });
    }
    await db.from('apple_tokens').delete().eq('user_id', uid);
    return reply(200, { ok: true, revoked: true });
  }

  return reply(400, { error: 'Unknown action' });
}
