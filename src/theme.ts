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

// ── Design switch (Settings → Appearance → Design) ──────────────────────────────
// 'classic' = the original Fekka look. 'apple' = DESIGN.md: one Action Blue accent, parchment canvas,
// near-black tiles, no shadows, 18px cards, pill controls, SF Pro (system font).
// To keep only one design later: delete the other palette pair, the toApple() pass and every ds() branch.
export type Design = 'classic' | 'apple';
const APPLE_LIGHT: typeof LIGHT = {
  bg: '#F5F5F7', card: '#FFFFFF', ink: '#1D1D1F', sub: '#7A7A7A', line: '#E0E0E0', soft: '#F5F5F7',
  navy: '#000000', primary: '#0066CC', accent: '#0066CC', sky: '#2997FF', pale: '#D2D2D7', hero: '#1D1D1F',
  green: '#248A3D', red: '#D70015', orange: '#C93400', purple: '#2997FF', gold: '#0066CC', tabBar: '#FFFFFF',
};
const APPLE_DARK: typeof LIGHT = {
  bg: '#000000', card: '#1D1D1F', ink: '#FFFFFF', sub: '#A1A1A6', line: '#333336', soft: '#272729',
  navy: '#000000', primary: '#2997FF', accent: '#2997FF', sky: '#2997FF', pale: '#CCCCCC', hero: '#272729',
  green: '#30D158', red: '#FF453A', orange: '#FF9F0A', purple: '#2997FF', gold: '#2997FF', tabBar: '#1D1D1F',
};
const PALETTES = { classic: { light: LIGHT, dark: DARK }, apple: { light: APPLE_LIGHT, dark: APPLE_DARK } };

export const C = { ...LIGHT };
let mode: 'light' | 'dark' = 'light';
let design: Design = 'classic';
export const isDark = () => mode === 'dark';
export const isApple = () => design === 'apple';
// Pick a value for the current design: ds(classicValue, appleValue)
export const ds = <T,>(classic: T, apple: T): T => (design === 'apple' ? apple : classic);

// DESIGN.md rules applied to every themed style sheet, so all screens follow it without per-screen rewrites:
// no shadows on chrome, radius grammar of 8 / 18 / pill / circle, 17px body, tight display tracking.
const toApple = (st: any) => {
  if (!st || typeof st !== 'object') return st;
  const o = { ...st };
  if ('shadowOpacity' in o || 'elevation' in o) { o.shadowOpacity = 0; o.elevation = 0; }
  const r = o.borderRadius;
  if (typeof r === 'number') {
    const w = o.width, h = o.height;
    const sized = typeof w === 'number' && typeof h === 'number';
    if (sized && r >= Math.min(w, h) / 2 - 1) { /* already a circle */ }
    else if (sized && w === h) o.borderRadius = w / 2;                       // icon tiles → circles
    else if (r >= 18 || (r >= 11 && (o.padding ?? 0) >= 18)) o.borderRadius = 18; // cards / panels
    else if (r >= 11) o.borderRadius = 999;                                   // buttons, chips, inputs → pills
    else if (r >= 7) o.borderRadius = 8;                                      // compact utility
  }
  if (typeof o.fontSize === 'number') {
    if (o.fontSize === 15 || o.fontSize === 16) o.fontSize = 17;             // body runs at 17
    else if (o.fontSize === 13) o.fontSize = 14;                             // captions at 14
    if (o.fontSize >= 24) o.letterSpacing = Math.min(o.letterSpacing ?? 0, -0.374);
  }
  return o;
};

// Style sheets that rebuild themselves when the theme changes
const sheets: { cache: any; fn: () => any }[] = [];
const build = (fn: () => any) => {
  const sheet = fn();
  if (design !== 'apple') return sheet;
  const out: any = {};
  for (const k in sheet) out[k] = toApple(sheet[k]);
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
  Object.assign(C, PALETTES[d][m]);
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
