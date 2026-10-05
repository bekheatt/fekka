import { getLang } from './i18n';

// Fekka blue palette: #003366 #00509E #007ACC #66A3FF #CCE0FF
const LIGHT = {
  bg: '#F6F9FE', card: '#FFFFFF', ink: '#14294A', sub: '#7D8DA8', line: '#EEF3FA', soft: '#EEF4FE',
  navy: '#003366', primary: '#00509E', accent: '#007ACC', sky: '#66A3FF', pale: '#CCE0FF', hero: '#00509E',
  green: '#2FB57A', red: '#E0605A', orange: '#F29B45', purple: '#66A3FF', gold: '#007ACC', tabBar: '#FFFFFF',
};
const DARK: typeof LIGHT = {
  bg: '#07172B', card: '#0E2340', ink: '#EAF2FF', sub: '#8CA3C2', line: '#18345A', soft: '#15304F',
  navy: '#003366', primary: '#2F8BE6', accent: '#007ACC', sky: '#66A3FF', pale: '#CCE0FF', hero: '#00509E',
  green: '#3CCB8C', red: '#F06A62', orange: '#F5A85C', purple: '#66A3FF', gold: '#007ACC', tabBar: '#0B1D36',
};

export const C = { ...LIGHT };
let mode: 'light' | 'dark' = 'light';
export const isDark = () => mode === 'dark';

// ── Design switch (Settings → Appearance → Design) ──────────────────────────────
// 'classic' = the original Fekka look.
// 'refined' (shown as "New") = "Ink & Electric": graphite and white with black statement cards, one electric-blue
// accent, the Outfit typeface, flat hairline cards, round badges and pill controls.
// To keep one design later: delete the other palette pair, toNew() and every ds() branch.
export type Design = 'classic' | 'refined';
let design: Design = 'classic';
export const isRefined = () => design === 'refined';
// Pick a value for the current design: ds(classicValue, newValue)
export const ds = <T,>(classic: T, fresh: T): T => (design === 'refined' ? fresh : classic);

const NEW_LIGHT: typeof LIGHT = {
  bg: '#EEEFF2', card: '#FFFFFF', ink: '#0E1014', sub: '#6E7480', line: '#E2E4E9', soft: '#F3F4F6',
  navy: '#0E1014', primary: '#2B3BFF', accent: '#2B3BFF', sky: '#8E97FF', pale: '#D8DBFF', hero: '#0E1014',
  green: '#14A06B', red: '#E5484D', orange: '#F2994A', purple: '#8E97FF', gold: '#2B3BFF', tabBar: '#0E1014',
};
const NEW_DARK: typeof LIGHT = {
  bg: '#08090B', card: '#131519', ink: '#F1F2F4', sub: '#8A909C', line: '#23262C', soft: '#1A1D22',
  navy: '#08090B', primary: '#4D5BFF', accent: '#4D5BFF', sky: '#9AA2FF', pale: '#C9CDFF', hero: '#1C1F25',
  green: '#2BC48A', red: '#F2555A', orange: '#F5A55C', purple: '#9AA2FF', gold: '#4D5BFF', tabBar: '#F1F2F4',
};

// Bigger contrast between small text and display numbers
const TYPE: Record<number, number> = { 10: 12, 11: 12, 17: 18, 19: 20, 20: 22, 22: 24, 24: 28, 26: 30, 28: 34, 30: 36, 32: 38, 34: 42 };
const SPACING = ['padding', 'paddingVertical', 'paddingHorizontal', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom', 'gap', 'rowGap'];

const toNew = (st: any) => {
  if (!st || typeof st !== 'object') return st;
  const o = { ...st };
  // Type: display sizes jump up and tighten; titles get a little tracking off
  if (typeof o.fontSize === 'number') {
    const size = TYPE[o.fontSize] ?? o.fontSize;
    o.fontSize = size;
    if (size >= 28) { o.fontWeight = '700'; o.letterSpacing = -Math.round(size * 0.035 * 10) / 10; }
    else if (size >= 18) o.letterSpacing = Math.min(o.letterSpacing ?? 0, -0.3);
    if (typeof o.lineHeight === 'number' && typeof st.fontSize === 'number') o.lineHeight = Math.round(o.lineHeight * size / st.fontSize + 1);
  }
  // A bit more air
  for (const k of SPACING) if (typeof o[k] === 'number' && o[k] >= 8) o[k] = Math.round(o[k] * 1.1 / 2) * 2;
  // Shapes: round badges, pill controls, soft 24px panels
  const r = o.borderRadius;
  if (typeof r === 'number') {
    const w = o.width, h = o.height;
    const sized = typeof w === 'number' && typeof h === 'number';
    if (sized && r >= Math.min(w, h) / 2 - 1) { /* already round */ }
    else if (sized && w === h) o.borderRadius = w / 2;                                   // icon tiles → circles
    else if (r >= 26) { /* big capsules */ }
    else if (r >= 18 || (r >= 11 && ((o.padding ?? 0) >= 18 || (typeof h === 'number' && h >= 80)))) o.borderRadius = 24; // panels, images
    else if (r >= 11) o.borderRadius = 999;                                              // buttons, chips, inputs → pills
  }
  // Flat: no soft shadows; white cards get a hairline instead
  if (typeof o.shadowOpacity === 'number' && o.shadowOpacity <= 0.12) {
    o.shadowOpacity = 0; o.elevation = 0;
    if (o.backgroundColor === C.card && o.borderWidth == null) { o.borderWidth = 1; o.borderColor = C.line; }
  }
  return o;
};

// Style sheets that rebuild themselves when the theme changes
const sheets: { cache: any; fn: () => any }[] = [];
const build = (fn: () => any) => {
  const sheet = fn();
  if (design !== 'refined') return sheet;
  const out: any = {};
  for (const k in sheet) out[k] = toNew(sheet[k]);
  return out;
};
export function themed<T extends object>(fn: () => T): T {
  const entry = { cache: null as any, fn };
  sheets.push(entry);
  return new Proxy({} as T, { get: (_, k) => { if (!entry.cache) entry.cache = build(fn); return entry.cache[k]; } });
}
export function applyTheme(m: 'light' | 'dark', d: Design = design) {
  mode = m;
  design = d;
  Object.assign(C, d === 'refined' ? (m === 'dark' ? NEW_DARK : NEW_LIGHT) : (m === 'dark' ? DARK : LIGHT));
  sheets.forEach(s => { s.cache = null; });
}

// Money — L.E everywhere unless stated otherwise
let hidden = false;                       // privacy mode: show ••••• instead of amounts
export const setHidden = (h: boolean) => { hidden = h; };
export const isHidden = () => hidden;
export const MASK = '•••••';
const cur = () => (getLang() === 'ar' ? 'ج.م ' : 'L.E ');
export const le = (n: number) => {
  if (hidden) return cur() + MASK;
  const v = Math.round(n);
  return (v < 0 ? '-' : '') + cur() + Math.abs(v).toLocaleString('en-US');
};
export const leShort = (n: number) => {
  if (hidden) return cur() + MASK;
  const a = Math.abs(n);
  const s = a >= 1e6 ? (a / 1e6).toFixed(1) + 'M' : a >= 1e4 ? (a / 1e3).toFixed(1) + 'K' : Math.round(a).toLocaleString('en-US');
  return (n < 0 ? '-' : '') + cur() + s;
};

// Installment companies, by name only. Colours come from Fakka's own palette (not the companies' brand
// colours) so nothing suggests a partnership. See the trademark note in Settings → About.
export const PROVIDERS = [
  { name: 'valU', color: '#00509E' }, { name: 'Souhoola', color: '#2F8BE6' }, { name: 'Klivvr', color: '#5B6B8C' },
  { name: 'Sympl', color: '#3A7CA5' }, { name: 'Contact', color: '#6C7FD8' }, { name: 'Aman', color: '#4A9C8C' },
  { name: 'Forsa', color: '#8A6FB0' }, { name: 'Halan', color: '#5E8C61' }, { name: 'Premium', color: '#C07A3E' },
  { name: 'Other', color: '#7A8BA6' },
];

export const LOAN_TYPES = [
  { name: 'Mortgage', icon: 'home' }, { name: 'Car Loan', icon: 'car-sport' },
  { name: 'Personal', icon: 'person' }, { name: 'Credit Card', icon: 'card' },
] as const;

export const BILL_TYPES = [
  { name: 'Electricity', icon: 'flash', color: '#F2B53A' },
  { name: 'Gas', icon: 'flame', color: '#F29B45' },
  { name: 'Water', icon: 'water', color: '#3DA5E0' },
  { name: 'Internet', icon: 'wifi', color: '#007ACC' },
  { name: 'Mobile', icon: 'phone-portrait', color: '#66A3FF' },
  { name: 'School', icon: 'school', color: '#8E6FE0' },
  { name: 'Rent', icon: 'key', color: '#00509E' },
  { name: 'Club', icon: 'football', color: '#2FB57A' },
  { name: 'Other', icon: 'document-text', color: '#7A8BA6' },
] as const;

export const EXPENSE_CATS = [
  { name: 'Food', icon: 'fast-food', color: '#F29B45' },
  { name: 'Transport', icon: 'car', color: '#007ACC' },
  { name: 'Bills', icon: 'flash', color: '#E8B93A' },
  { name: 'Shopping', icon: 'bag-handle', color: '#8E6FE0' },
  { name: 'Health', icon: 'medkit', color: '#E5534B' },
  { name: 'Fun', icon: 'game-controller', color: '#2FB57A' },
  { name: 'Transfers', icon: 'swap-horizontal', color: '#E0605A' }, // money you sent: InstaPay, wallets, bank transfers (red; received ones show green)
  { name: 'Other', icon: 'ellipsis-horizontal', color: '#7A8BA6' },
] as const;

export const SAVING_TYPES = [
  { key: 'gold21', name: 'Gold 21K', unit: 'grams', icon: 'diamond', color: '#E0AA3E' },
  { key: 'gold24', name: 'Gold 24K', unit: 'grams', icon: 'diamond-outline', color: '#C9922A' },
  { key: 'usd', name: 'US Dollar', unit: 'USD', icon: 'logo-usd', color: '#2FB57A' },
  { key: 'eur', name: 'Euro', unit: 'EUR', icon: 'logo-euro', color: '#007ACC' },
  { key: 'egp', name: 'Cash / Bank', unit: 'L.E', icon: 'wallet', color: '#00509E' },
] as const;

export const GOAL_ICONS = ['heart', 'car-sport', 'airplane', 'home', 'school', 'moon', 'umbrella', 'gift', 'laptop', 'star'] as const;

// Fallback prices, used only until live prices load
export const DEFAULT_RATES: Record<string, number> = { gold21: 6230, gold24: 7120, usd: 51.7, eur: 58.9, egp: 1 };
