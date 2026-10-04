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

// Style sheets that rebuild themselves when the theme changes
const sheets: { cache: any; fn: () => any }[] = [];
export function themed<T extends object>(fn: () => T): T {
  const entry = { cache: null as any, fn };
  sheets.push(entry);
  return new Proxy({} as T, { get: (_, k) => { if (!entry.cache) entry.cache = fn(); return entry.cache[k]; } });
}
export function applyTheme(m: 'light' | 'dark') {
  mode = m;
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
