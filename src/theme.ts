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
// 'classic' = the original look. 'refined' = the SAME colours with a stricter type scale, more air and one
// corner system (taste-skill audit, preserve mode: variance 3 / motion 4 / density 4).
// Colours are never touched here. To keep one design later: delete toRefined() and every ds() branch.
export type Design = 'classic' | 'refined';
let design: Design = 'classic';
export const isRefined = () => design === 'refined';
// Pick a value for the current design: ds(classicValue, refinedValue)
export const ds = <T,>(classic: T, refined: T): T => (design === 'refined' ? refined : classic);

// Type scale: 21 sizes in use → 8 steps (12 · 13 · 15 · 17 · 20 · 24 · 28 · 34). Big hero numbers stay as they are.
const TYPE: Record<number, number> = { 10: 12, 11: 12, 12: 12, 13: 13, 14: 15, 15: 15, 16: 17, 17: 17, 19: 20, 20: 20, 22: 24, 24: 24, 26: 28, 28: 28, 30: 34, 32: 34, 34: 34 };
const SPACING = ['padding', 'paddingVertical', 'paddingHorizontal', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom', 'gap', 'rowGap'];

const toRefined = (st: any) => {
  if (!st || typeof st !== 'object') return st;
  const o = { ...st };
  // Typography: one scale, quieter captions, bold only for big numbers and titles, tighter display tracking
  if (typeof o.fontSize === 'number') {
    const size = TYPE[o.fontSize] ?? o.fontSize;
    o.fontSize = size;
    const w = String(o.fontWeight ?? '400');
    if (w === '500') o.fontWeight = size <= 13 ? '400' : '600';
    else if (w === '700' && size < 20) o.fontWeight = '600';
    if (size >= 24) o.letterSpacing = Math.min(o.letterSpacing ?? 0, -Math.round(size * 0.02 * 10) / 10);
    else if (size >= 17) o.letterSpacing = Math.min(o.letterSpacing ?? 0, -0.2);
    if (typeof o.lineHeight === 'number' && typeof st.fontSize === 'number') o.lineHeight = Math.round(o.lineHeight * size / st.fontSize + 1);
  }
  // Density 5 → 4: about 15% more breathing room, kept on an even grid
  for (const k of SPACING) if (typeof o[k] === 'number' && o[k] >= 8) o[k] = Math.round(o[k] * 1.15 / 2) * 2;
  // One corner system: cards 20 · large tiles 16 · buttons and inputs 14 · chips and icon tiles 12 · circles stay circles
  const r = o.borderRadius;
  if (typeof r === 'number') {
    const w = o.width, h = o.height;
    const sized = typeof w === 'number' && typeof h === 'number';
    if (sized && r >= Math.min(w, h) / 2 - 1) { /* circle */ }
    else if (sized && w === h && w >= 50) o.borderRadius = 16;      // large tiles (the + button)
    else if (sized && w === h && w >= 30) o.borderRadius = 12;      // icon tiles
    else if (r >= 26) { /* big pills (tab bar) */ }
    else if (r >= 18) o.borderRadius = 20;
    else if (r >= 13) o.borderRadius = 14;
    else if (r >= 9) o.borderRadius = 12;
  }
  // Softer card shadows (same tint); strong shadows on floating things stay
  if (typeof o.shadowOpacity === 'number' && o.shadowOpacity > 0 && o.shadowOpacity <= 0.1) {
    o.shadowOpacity = Math.round(o.shadowOpacity * 0.6 * 1000) / 1000;
    if (typeof o.shadowRadius === 'number') o.shadowRadius = Math.round(o.shadowRadius * 1.25);
  }
  return o;
};

// Style sheets that rebuild themselves when the theme changes
const sheets: { cache: any; fn: () => any }[] = [];
const build = (fn: () => any) => {
  const sheet = fn();
  if (design !== 'refined') return sheet;
  const out: any = {};
  for (const k in sheet) out[k] = toRefined(sheet[k]);
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
  Object.assign(C, m === 'dark' ? DARK : LIGHT);
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
