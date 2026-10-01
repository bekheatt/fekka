// Combines changes from two phones using the same account.
//
//   base   = the last version this phone and the server agreed on
//   local  = this phone now
//   server = what another phone saved since
//
// Rules (per item, e.g. one expense or one installment):
//   - changed on only one side      → keep that change
//   - changed on both sides         → this phone wins
//   - added on either side          → keep it
//   - deleted on one side, untouched on the other → deleted
//   - deleted on one side, edited on the other    → keep the edit (never lose someone's work)

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const isIdList = (v: unknown): v is { id: string }[] =>
  Array.isArray(v) && v.every(x => isObj(x) && typeof x.id === 'string');

function mergeList(base: any[] | undefined, local: any[] = [], server: any[] = []) {
  const B = new Map((base ?? []).map(x => [x.id, x]));
  const L = new Map(local.map(x => [x.id, x]));
  const S = new Map(server.map(x => [x.id, x]));
  const out: any[] = [];
  for (const s of server) {
    const b = B.get(s.id), l = L.get(s.id);
    if (l) out.push(b && same(l, b) ? s : l);   // in both: take whichever side changed (this phone if both did)
    else if (!b) out.push(s);                   // added on the other phone
    else if (!same(s, b)) out.push(s);          // deleted here, but edited there → keep the edit
    // else: deleted here and untouched there → stays deleted
  }
  for (const l of local) {
    if (S.has(l.id)) continue;
    const b = B.get(l.id);
    if (!b || !same(l, b)) out.push(l);         // added here, or edited here while deleted there
    // else: deleted on the other phone and untouched here → stays deleted
  }
  return out;
}

const pick = (b: unknown, l: unknown, s: unknown, hasS: boolean) => (same(l, b) && hasS ? s : l);

export function merge3(base: any, local: any, server: any): any {
  if (!isObj(server)) return local;
  if (!isObj(base)) base = {};
  const out: Record<string, any> = {};
  const keys = new Set([...Object.keys(local), ...Object.keys(server)]);
  for (const k of keys) {
    const b = base[k], l = local[k], s = server[k];
    const hasS = k in server, hasL = k in local;
    if (!hasL) { if (!(k in base)) out[k] = s; continue; } // new key from the other phone (or deleted here)
    if ((isIdList(l) || l === undefined) && (isIdList(s) || s === undefined) && (isIdList(l) || isIdList(s))) {
      out[k] = mergeList(b, l, s);
    } else if (isObj(l) && isObj(s)) {
      // settings, score history…: decide field by field
      const o: Record<string, any> = {};
      const bo = isObj(b) ? b : {};
      for (const f of new Set([...Object.keys(l), ...Object.keys(s)])) {
        if (!(f in l)) { if (!(f in bo)) o[f] = s[f]; continue; }
        o[f] = pick(bo[f], l[f], s[f], f in s);
      }
      out[k] = o;
    } else {
      out[k] = pick(b, l, s, hasS);
    }
  }
  return out;
}
