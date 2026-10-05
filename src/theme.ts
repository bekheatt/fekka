import { getLang } from './i18n';

// Fekka "Ink & Electric": cool white, navy-tinted text, one electric-blue accent (statement cards too)
const LIGHT = {
  bg: '#EEEFF2', card: '#FFFFFF', ink: '#121726', sub: '#6E7480', line: '#E2E4E9', soft: '#F3F4F6',
  navy: '#2B3BFF', primary: '#2B3BFF', accent: '#2B3BFF', sky: '#8E97FF', pale: '#D8DBFF', hero: '#2B3BFF',
  green: '#14A06B', red: '#E5484D', orange: '#F2994A', purple: '#8E97FF', gold: '#2B3BFF', tabBar: '#FFFFFF',
};
const DARK: typeof LIGHT = {
  bg: '#0B0D12', card: '#151821', ink: '#EEF0F6', sub: '#8A909C', line: '#252A35', soft: '#1C2029',
  navy: '#3B4BFF', primary: '#4D5BFF', accent: '#4D5BFF', sky: '#9AA2FF', pale: '#D3D7FF', hero: '#3B4BFF',
  green: '#2BC48A', red: '#F2555A', orange: '#F5A55C', purple: '#9AA2FF', gold: '#4D5BFF', tabBar: '#151821',
};

// "Copper & Slate": the same look with a warm burnt-copper accent on the cool slate neutrals
// (Settings → Appearance → Color). Warnings move from orange to amber so they don't blend with the copper.
const COPPER_LIGHT: typeof LIGHT = {
  ...LIGHT, navy: '#B8481A', primary: '#B8481A', accent: '#B8481A', sky: '#E8A07E', pale: '#F8DCCD',
  hero: '#B8481A', purple: '#E8A07E', gold: '#B8481A', orange: '#D9A21B',
};
const COPPER_DARK: typeof LIGHT = {
  ...DARK, navy: '#B8481A', primary: '#D9622B', accent: '#D9622B', sky: '#F0A989', pale: '#F8DCCD',
  hero: '#B8481A', purple: '#F0A989', gold: '#D9622B', orange: '#E8B33A',
};
export type Accent = 'blue' | 'copper';
const PALETTES = { blue: { light: LIGHT, dark: DARK }, copper: { light: COPPER_LIGHT, dark: COPPER_DARK } };

export const C = { ...LIGHT };
let mode: 'light' | 'dark' = 'light';
let accent: Accent = 'blue';
export const isDark = () => mode === 'dark';

// Shared style rules, applied to every themed style sheet so all screens follow one system:
// type scale, spacing, shapes (round badges, pill controls, 24px panels) and flat hairline cards.
// Bigger contrast between small text and display numbers
const TYPE: Record<number, number> = { 10: 12, 11: 12, 17: 18, 19: 20, 20: 22, 22: 24, 24: 28, 26: 30, 28: 34, 30: 36, 32: 38, 34: 42 };
const SPACING = ['padding', 'paddingVertical', 'paddingHorizontal', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom', 'gap', 'rowGap'];

const polish = (st: any) => {
  if (!st || typeof st !== 'object') return st;
  const o = { ...st };
  // Type: display sizes jump up and tighten; titles get a little tracking off
  if (typeof o.fontSize === 'number') {
    const size = TYPE[o.fontSize] ?? o.fontSize;
    o.fontSize = size;
    if (String(o.fontWeight) === '700' || o.fontWeight === 'bold') o.fontWeight = '600'; // semi-bold is the heaviest weight
    if (size >= 28) { o.fontWeight = '600'; o.letterSpacing = -Math.round(size * 0.03 * 10) / 10; }
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
  const out: any = {};
  for (const k in sheet) out[k] = polish(sheet[k]);
  return out;
};
export function themed<T extends object>(fn: () => T): T {
  const entry = { cache: null as any, fn };
  sheets.push(entry);
  return new Proxy({} as T, { get: (_, k) => { if (!entry.cache) entry.cache = build(fn); return entry.cache[k]; } });
}
export function applyTheme(m: 'light' | 'dark', a: Accent = accent) {
  mode = m;
  accent = a;
  Object.assign(C, PALETTES[a][m]);
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
