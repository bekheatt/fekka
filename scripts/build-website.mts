// Builds fakkaeg.com into website/: home, support, privacy, terms, delete-account and a 404 page.
// The Privacy Policy and Terms come from the same text the app shows (src/features/Legal/documents.ts),
// so the website and the app can never disagree. Run after changing either document:
//   node scripts/build-website.mts
// Plain HTML + CSS with self-hosted fonts, photos and icons: no trackers, no cookies, no outside requests.
// Photos: Unsplash (Mohamed Marey, Ahmad Safwat). Icons: Phosphor (MIT), in assets/website/icons.
// App screenshots: drop PNGs named in SHOTS into assets/website/screens/ and the "On your phone" section appears.
import { writeFileSync, mkdirSync, readFileSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { LEGAL_DOCS, blocks, type LegalDocKey } from '../src/features/Legal/documents.ts';

const brand = JSON.parse(readFileSync(new URL('../brand.json', import.meta.url), 'utf8'));
const NAME: string = brand.name, NAME_AR: string = brand.nameAr;
const DOMAIN = 'fakkaeg.com';
const EMAIL = 'support@fakkaeg.com';
const OWNER = 'Ahmed Hesham Bekheat';
const YEAR = new Date().getFullYear();

const root = new URL('../website/', import.meta.url);
const asset = (p: string) => new URL(`../assets/website/${p}`, import.meta.url);
rmSync(root, { recursive: true, force: true });
const write = (path: string, html: string) => {
  const url = new URL(path, root);
  mkdirSync(new URL('./', url), { recursive: true });
  writeFileSync(url, html);
};
const copy = (from: URL, to: string) => { mkdirSync(new URL('./', new URL(to, root)), { recursive: true }); copyFileSync(from, new URL(to, root)); };

// Fonts from the app's own packages (SIL Open Font License)
const FONTS = [
  ['outfit', 'Outfit_400Regular.ttf', '400Regular'], ['outfit', 'Outfit_600SemiBold.ttf', '600SemiBold'],
  ['ibm-plex-sans-arabic', 'IBMPlexSansArabic_400Regular.ttf', '400Regular'], ['ibm-plex-sans-arabic', 'IBMPlexSansArabic_600SemiBold.ttf', '600SemiBold'],
];
for (const [pkg, file, dir] of FONTS) copy(new URL(`../node_modules/@expo-google-fonts/${pkg}/${dir}/${file}`, import.meta.url), `fonts/${file}`);

// Photos (self-hosted copies, so visitors never load anything from another site)
const PHOTOS = { coin: [1600, 1067], ataba: [2000, 1500], 'ataba-market': [1000, 1250] } as const;
for (const p of Object.keys(PHOTOS)) copy(asset(`photos/${p}.jpg`), `img/${p}.jpg`);

// Real app screenshots, when they exist (iPhone screenshots, portrait)
const SHOTS: [string, string, string][] = [
  ['home', 'Your month at a glance', 'شهرك في نظرة'],
  ['pay', 'Installments, loans and bills', 'الأقساط والقروض والفواتير'],
  ['save', 'Gold and savings at today\'s prices', 'الدهب والادخار بأسعار النهارده'],
];
const shots = SHOTS.filter(([f]) => existsSync(asset(`screens/${f}.png`)));
for (const [f] of shots) copy(asset(`screens/${f}.png`), `img/screen-${f}.png`);
if (shots.length < SHOTS.length) console.warn(`No app screenshots yet (${shots.length}/${SHOTS.length}): the "On your phone" section is left out. Add them in assets/website/screens/.`);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// The same text in English and Arabic; the page shows one, by the visitor's choice or phone language
const b = (en: string, ar: string) => `<span data-l="en">${en}</span><span data-l="ar">${ar}</span>`;
// Phosphor icon, inlined so it takes the text colour
const icon = (name: string, size = 22) => readFileSync(asset(`icons/${name}.svg`), 'utf8').trim()
  .replace('<svg ', `<svg class="ic" width="${size}" height="${size}" aria-hidden="true" focusable="false" `);
const img = (name: keyof typeof PHOTOS, alt: string, cls = '', eager = false) =>
  `<img class="${cls}" src="/img/${name}.jpg" width="${PHOTOS[name][0]}" height="${PHOTOS[name][1]}" alt="${alt}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;

// The app's logo: three coins, the front one with ف (drawn the same way as src/Logo.tsx)
const logo = (size: number) => `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
  <g><circle cx="35" cy="39" r="29.1" fill="#D8DBFF" stroke="#8E97FF" stroke-width="3.7"/></g>
  <g><circle cx="65" cy="37" r="29.1" fill="#8E97FF" stroke="#2B3BFF" stroke-width="3.7"/></g>
  <g><circle cx="50" cy="63" r="29.1" fill="#fff" stroke="#2B3BFF" stroke-width="3.7"/>
  <text x="50" y="66" text-anchor="middle" dominant-baseline="middle" font-size="31" font-weight="700" fill="#2B3BFF" font-family="IBM Plex Sans Arabic, Tahoma, sans-serif">ف</text></g>
</svg>`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<circle cx="35" cy="39" r="29.1" fill="#D8DBFF" stroke="#8E97FF" stroke-width="3.7"/>
<circle cx="65" cy="37" r="29.1" fill="#8E97FF" stroke="#2B3BFF" stroke-width="3.7"/>
<circle cx="50" cy="63" r="29.1" fill="#fff" stroke="#2B3BFF" stroke-width="3.7"/>
<text x="50" y="66" text-anchor="middle" dominant-baseline="middle" font-size="31" font-weight="700" fill="#2B3BFF" font-family="Tahoma, sans-serif">ف</text>
</svg>`;

// One accent (the app's Electric Blue), cool neutrals, light + dark from the phone's setting.
// Shapes: surfaces and photos 24px, small tiles 16px, everything you tap is a full pill.
const CSS = `
@font-face { font-family: Outfit; font-weight: 400; font-display: swap; src: url(/fonts/Outfit_400Regular.ttf) format("truetype"); }
@font-face { font-family: Outfit; font-weight: 600; font-display: swap; src: url(/fonts/Outfit_600SemiBold.ttf) format("truetype"); }
@font-face { font-family: "IBM Plex Sans Arabic"; font-weight: 400; font-display: swap; src: url(/fonts/IBMPlexSansArabic_400Regular.ttf) format("truetype"); }
@font-face { font-family: "IBM Plex Sans Arabic"; font-weight: 600; font-display: swap; src: url(/fonts/IBMPlexSansArabic_600SemiBold.ttf) format("truetype"); }
:root {
  --bg: #F5F6F8; --surface: #FCFCFD; --tint: #ECEEFF; --ink: #0F1218; --sub: #545B68; --line: #E1E4EA;
  --accent: #2B3BFF; --on-accent: #FCFCFD; --accent-soft: #C9CEFF; --shadow: 230 40% 30%;
  --r: 24px; --r-sm: 16px; --ease: cubic-bezier(.16, 1, .3, 1); color-scheme: light;
}
@media (prefers-color-scheme: dark) { :root {
  --bg: #0C0E13; --surface: #151820; --tint: #1A1E33; --ink: #ECEEF3; --sub: #A0A7B4; --line: #262B36;
  --accent: #5563FF; --on-accent: #FCFCFD; --accent-soft: #2A3170; --shadow: 230 60% 2%; color-scheme: dark;
} }
* { box-sizing: border-box; }
html[lang=en] [data-l=ar], html[lang=ar] [data-l=en] { display: none; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 17px/1.6 Outfit, "IBM Plex Sans Arabic", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
html[lang=ar] body { font-family: "IBM Plex Sans Arabic", Outfit, system-ui, sans-serif; }
img { display: block; max-width: 100%; height: auto; }
a { color: var(--accent); text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }
.ic { flex: none; }
.wrap { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
@media (max-width: 767px) { .wrap { padding: 0 16px; } }
h1, h2, h3 { font-weight: 600; margin: 0; text-wrap: balance; }
p { margin: 0; }

/* Header */
.top { position: sticky; top: 0; z-index: 10; background: color-mix(in srgb, var(--bg) 82%, transparent); backdrop-filter: saturate(1.4) blur(14px); -webkit-backdrop-filter: saturate(1.4) blur(14px); border-bottom: 1px solid color-mix(in srgb, var(--line) 70%, transparent); }
.top .wrap { display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 16px; }
.brand { display: inline-flex; align-items: center; gap: 10px; color: var(--ink); text-decoration: none; font-weight: 600; font-size: 20px; letter-spacing: -.02em; }
.nav { display: flex; align-items: center; gap: 4px; font-size: 15px; }
.nav a { color: var(--sub); text-decoration: none; padding: 8px 12px; border-radius: 999px; transition: color .2s, background-color .2s; }
.nav a:hover { color: var(--ink); background: var(--surface); }
.nav a[aria-current] { color: var(--ink); }
.lang { margin-inline-start: 6px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 999px; padding: 7px 14px; font: inherit; font-size: 14px; cursor: pointer; transition: border-color .2s, transform .15s var(--ease); }
.lang:hover { border-color: var(--accent); }
.lang:active { transform: scale(.97); }
@media (max-width: 640px) { .nav .opt { display: none; } }

/* Buttons and the store badge */
.pill { display: inline-flex; align-items: center; gap: 10px; white-space: nowrap; border-radius: 999px; padding: 14px 22px; font-weight: 600; font-size: 16px; text-decoration: none; transition: transform .2s var(--ease), box-shadow .2s var(--ease), background-color .2s; }
.pill.solid { background: var(--accent); color: var(--on-accent); box-shadow: 0 10px 28px -12px hsl(233 100% 50% / .55); }
.pill.solid:hover { transform: translateY(-2px); box-shadow: 0 16px 34px -14px hsl(233 100% 50% / .6); }
.pill.solid:active { transform: translateY(0) scale(.98); }
.soon { display: inline-flex; align-items: center; gap: 12px; border: 1px solid var(--line); background: var(--surface); border-radius: 999px; padding: 10px 20px 10px 12px; }
html[dir=rtl] .soon { padding: 10px 12px 10px 20px; }
.soon .ic { width: 38px; height: 38px; padding: 9px; border-radius: 50%; background: var(--accent); color: var(--on-accent); }
.soon small { display: block; color: var(--sub); font-size: 13px; line-height: 1.2; }
.soon strong { display: block; font-weight: 600; font-size: 16px; line-height: 1.3; }

/* Hero: words on one side, the coin on the other */
.hero { display: grid; grid-template-columns: 1.05fr .95fr; gap: 56px; align-items: center; padding-block: 56px 72px; min-height: min(calc(100dvh - 64px), 860px); }
.hero h1 { font-size: clamp(42px, 6.2vw, 78px); line-height: 1.02; letter-spacing: -.035em; }
html[lang=ar] .hero h1 { line-height: 1.2; letter-spacing: 0; }
.hero h1 em { font-style: normal; color: var(--accent); }
.hero p { margin: 22px 0 34px; color: var(--sub); font-size: clamp(18px, 1.6vw, 21px); max-width: 30ch; }
.hero figure { margin: 0; position: relative; }
.hero figure img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; object-position: 58% 50%; border-radius: var(--r); box-shadow: 0 40px 80px -40px hsl(var(--shadow) / .45); }
@media (max-width: 860px) {
  .hero { grid-template-columns: 1fr; gap: 36px; min-height: 0; padding-block: 24px 48px; }
  .hero figure img { aspect-ratio: 4 / 3; }
}

/* The meaning of the name */
.meaning { padding: 96px 0; }
.meaning p { font-size: clamp(26px, 3.4vw, 44px); line-height: 1.22; letter-spacing: -.02em; max-width: 26ch; font-weight: 600; }
html[lang=ar] .meaning p { letter-spacing: 0; line-height: 1.5; }
.meaning p span.quiet { color: var(--sub); }
.meaning .ar-word { color: var(--accent); font-family: "IBM Plex Sans Arabic", sans-serif; }

/* Features: a bento of six, each tile with its own surface */
.sec { padding: 72px 0; }
.sec > .wrap > h2, .sec-head { font-size: clamp(30px, 4vw, 48px); letter-spacing: -.03em; line-height: 1.08; max-width: 18ch; margin-bottom: 40px; }
html[lang=ar] .sec > .wrap > h2 { letter-spacing: 0; line-height: 1.35; }
.bento { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: auto auto auto; gap: 16px; }
.tile { position: relative; overflow: hidden; border-radius: var(--r); padding: 28px; background: var(--surface); border: 1px solid var(--line); display: flex; flex-direction: column; justify-content: flex-end; min-height: 230px; transition: transform .35s var(--ease), box-shadow .35s var(--ease); }
.tile:hover { transform: translateY(-3px); box-shadow: 0 24px 48px -28px hsl(var(--shadow) / .4); }
.tile h3 { font-size: 21px; letter-spacing: -.01em; line-height: 1.25; }
.tile p { margin-top: 8px; color: var(--sub); font-size: 16px; max-width: 38ch; }
.tile .ic { color: var(--accent); margin-bottom: auto; }
.tile.score { grid-column: span 2; grid-row: span 2; background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
.tile.score p { color: color-mix(in srgb, var(--on-accent) 80%, transparent); font-size: 18px; }
.tile.score h3 { font-size: 30px; }
.tile.score .scale { font-size: clamp(64px, 9vw, 128px); font-weight: 600; letter-spacing: -.05em; line-height: .9; margin-bottom: auto; font-variant-numeric: tabular-nums; }
.tile.score .scale small { font-size: .32em; letter-spacing: 0; margin: 0 .3em; color: color-mix(in srgb, var(--on-accent) 62%, transparent); vertical-align: .35em; }
.tile.wide { grid-column: span 2; }
.tile.tall { grid-row: span 2; border: 0; color: #F4F5F8; }
.tile.tall img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
.tile.tall::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgb(8 10 16 / .88) 0%, rgb(8 10 16 / .35) 55%, rgb(8 10 16 / .05) 100%); z-index: 1; }
.tile.tall > :not(img) { position: relative; z-index: 2; }
.tile.tall p { color: rgb(244 245 248 / .82); }
.tile.tall .ic { color: #F4F5F8; }
.tile.tinted { background: var(--tint); border-color: transparent; }
@media (max-width: 960px) {
  .bento { grid-template-columns: repeat(2, 1fr); }
  .tile.tall { grid-row: span 1; min-height: 320px; }
}
@media (max-width: 600px) {
  .bento { grid-template-columns: 1fr; }
  .tile.score, .tile.wide { grid-column: span 1; grid-row: span 1; }
  .tile { min-height: 200px; padding: 24px; }
}

/* App screenshots */
.shots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; align-items: end; }
.shots figure { margin: 0; }
.shots img { width: 100%; max-width: 300px; margin: 0 auto; border-radius: 40px; border: 8px solid #12141A; box-shadow: 0 40px 70px -40px hsl(var(--shadow) / .55); }
.shots figure:nth-child(2) img { transform: translateY(-28px); }
.shots figcaption { margin-top: 18px; text-align: center; color: var(--sub); }
@media (max-width: 860px) {
  .shots { grid-template-columns: repeat(3, 72%); overflow-x: auto; scroll-snap-type: x mandatory; margin: 0 -16px; padding: 8px 16px 20px; gap: 16px; }
  .shots figure { scroll-snap-align: center; }
  .shots figure:nth-child(2) img { transform: none; }
}

/* Made for Egypt: one full-bleed photo */
.egypt { position: relative; margin: 72px 0; min-height: 640px; display: flex; align-items: flex-end; color: #F4F5F8; overflow: hidden; }
.egypt > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 62%; }
.egypt::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgb(8 10 16 / .9) 0%, rgb(8 10 16 / .55) 45%, rgb(8 10 16 / .1) 100%); }
.egypt .wrap { position: relative; z-index: 1; padding-top: 220px; padding-bottom: 64px; display: grid; grid-template-columns: 1.1fr 1fr; gap: 48px; align-items: end; }
.egypt h2 { font-size: clamp(34px, 5vw, 64px); letter-spacing: -.035em; line-height: 1.02; max-width: 12ch; }
html[lang=ar] .egypt h2 { letter-spacing: 0; line-height: 1.3; }
.eyebrow { display: inline-block; margin-bottom: 16px; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: rgb(244 245 248 / .78); }
html[lang=ar] .eyebrow { letter-spacing: 0; font-size: 15px; }
.points { display: grid; gap: 18px; }
.points > div { display: grid; grid-template-columns: 26px 1fr; gap: 14px; align-items: start; }
.points .ic { margin-top: 2px; color: #AEB5FF; }
.points strong { display: block; font-weight: 600; }
.points p { color: rgb(244 245 248 / .78); font-size: 16px; }
@media (max-width: 860px) {
  .egypt { min-height: 0; }
  .egypt .wrap { grid-template-columns: 1fr; padding-top: 260px; gap: 32px; }
}

/* Privacy: a heading beside a grid of promises */
.privacy { display: grid; grid-template-columns: .8fr 1.2fr; gap: 56px; align-items: start; }
.privacy h2 { font-size: clamp(30px, 4vw, 48px); letter-spacing: -.03em; line-height: 1.08; }
html[lang=ar] .privacy h2 { letter-spacing: 0; line-height: 1.35; }
.privacy > div > p { margin-top: 18px; color: var(--sub); max-width: 36ch; }
.promises { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.promise { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: center; padding: 16px; border-radius: var(--r-sm); background: var(--surface); border: 1px solid var(--line); }
.promise .ic { width: 44px; height: 44px; padding: 11px; border-radius: 50%; background: var(--tint); color: var(--accent); }
.promise span { font-size: 16px; line-height: 1.4; }
@media (max-width: 860px) {
  .privacy { grid-template-columns: 1fr; gap: 28px; }
}
@media (max-width: 560px) { .promises { grid-template-columns: 1fr; } }

/* Closing: questions */
.ask { margin-top: 72px; padding-block: 64px; text-align: center; border-top: 1px solid var(--line); }
.ask h2 { font-size: clamp(28px, 3.6vw, 40px); letter-spacing: -.02em; }
.ask p { color: var(--sub); margin: 12px auto 28px; max-width: 44ch; }

/* Footer */
footer { border-top: 1px solid var(--line); padding: 32px 0 44px; color: var(--sub); font-size: 14px; }
footer .wrap { display: grid; grid-template-columns: 1fr auto; gap: 16px 32px; align-items: start; }
footer nav { display: flex; flex-wrap: wrap; gap: 8px 20px; }
footer a { color: var(--sub); text-decoration: none; }
footer a:hover { color: var(--ink); text-decoration: underline; }
footer .credit { grid-column: 1 / -1; font-size: 13px; }
@media (max-width: 760px) { footer .wrap { grid-template-columns: 1fr; } }

/* Inner pages: support, legal documents, delete account */
.page-head { padding: 64px 0 36px; }
.page-head h1 { font-size: clamp(36px, 5vw, 56px); letter-spacing: -.03em; line-height: 1.05; }
html[lang=ar] .page-head h1 { letter-spacing: 0; line-height: 1.3; }
.page-head p { margin-top: 14px; color: var(--sub); font-size: 18px; max-width: 52ch; }
.contact { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; padding: 28px; border-radius: var(--r); background: var(--tint); margin-bottom: 56px; }
.contact strong { display: block; font-size: 20px; font-weight: 600; color: var(--ink); }
.contact > span { color: var(--sub); }
.faq h2 { font-size: 28px; letter-spacing: -.02em; margin-bottom: 18px; }
details { border-bottom: 1px solid var(--line); }
details:first-of-type { border-top: 1px solid var(--line); }
summary { cursor: pointer; list-style: none; display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 20px 2px; font-weight: 600; font-size: 18px; }
summary::-webkit-details-marker { display: none; }
summary::after { content: "+"; font-weight: 400; font-size: 26px; line-height: 1; color: var(--accent); transition: transform .25s var(--ease); }
details[open] summary::after { transform: rotate(45deg); }
details p { color: var(--sub); padding: 0 2px 22px; max-width: 70ch; }
.doc { display: grid; grid-template-columns: 240px 1fr; gap: 56px; align-items: start; padding-bottom: 32px; }
.toc { position: sticky; top: 88px; font-size: 14px; }
.toc strong { display: block; margin-bottom: 10px; font-weight: 600; }
.toc ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; }
.toc a { display: block; color: var(--sub); text-decoration: none; padding: 5px 0; line-height: 1.35; }
.toc a:hover { color: var(--accent); }
article { max-width: 72ch; direction: ltr; text-align: left; }
article h2 { font-size: 24px; letter-spacing: -.01em; margin: 44px 0 10px; scroll-margin-top: 88px; }
article h3 { font-size: 18px; margin: 24px 0 6px; }
article p { white-space: pre-line; margin: 0 0 14px; }
article .meta { color: var(--sub); }
article ul { padding-inline-start: 22px; margin: 0 0 14px; }
article li { margin-bottom: 6px; }
.note { padding: 14px 18px; border-radius: var(--r-sm); background: var(--tint); margin-bottom: 28px; }
@media (max-width: 860px) {
  .doc { grid-template-columns: 1fr; gap: 24px; }
  .toc { position: static; padding: 18px; border-radius: var(--r-sm); background: var(--surface); border: 1px solid var(--line); }
}
.lost { min-height: 60dvh; display: grid; align-content: center; justify-items: start; gap: 18px; padding: 64px 0; }
.lost h1 { font-size: clamp(36px, 5vw, 56px); letter-spacing: -.03em; }

/* Motion: things settle in once, as you reach them (only when the phone allows motion) */
@media (prefers-reduced-motion: no-preference) {
  .js .rise { opacity: 0; transform: translateY(22px); transition: opacity .8s var(--ease), transform .8s var(--ease); transition-delay: calc(var(--i, 0) * 70ms); }
  .js .rise.in { opacity: 1; transform: none; }
  .hero figure img { animation: settle 1.2s var(--ease) both; }
  @keyframes settle { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: none; } }
}
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } * { transition: none !important; animation: none !important; } }
`;

// Picks Arabic or English from the last choice or the phone's language; the button switches
const LANG_JS = `<script>
(function(){var h=document.documentElement,k='fakka-lang',l;h.classList.add('js');try{l=localStorage.getItem(k)}catch(e){}
if(!l)l=(navigator.language||'').slice(0,2)==='ar'?'ar':'en';
function set(x){h.lang=x;h.dir=x==='ar'?'rtl':'ltr';try{localStorage.setItem(k,x)}catch(e){}}
set(l);window.fakkaLang=function(){set(h.lang==='ar'?'en':'ar')};})();
</script>`;
const PLAIN_JS = `<script>document.documentElement.classList.add('js')</script>`;
// Reveals .rise elements once, as they scroll into view
const REVEAL_JS = `<script>
(function(){var els=document.querySelectorAll('.rise');if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.12});
els.forEach(function(e){io.observe(e)});})();
</script>`;

type Page = { path: string; title: string; description: string; body: string; nav?: string; bilingual?: boolean };

const page = ({ path, title, description, body, nav, bilingual = true }: Page) => `<!doctype html>
<html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="https://${DOMAIN}${path}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://${DOMAIN}${path}"><meta property="og:type" content="website">
<meta property="og:image" content="https://${DOMAIN}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${NAME}: Know where every pound goes"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://${DOMAIN}/og.png">
<meta name="theme-color" content="#F5F6F8" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#0C0E13" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/Outfit_600SemiBold.ttf" as="font" type="font/ttf" crossorigin>
<style>${CSS}</style>
${bilingual ? LANG_JS : PLAIN_JS}
</head><body>
<header class="top"><div class="wrap">
  <a class="brand" href="/">${logo(32)}<span>${bilingual ? b(NAME, NAME_AR) : NAME}</span></a>
  <nav class="nav" aria-label="Main">
    <a href="/support/"${nav === 'support' ? ' aria-current="page"' : ''}>${bilingual ? b('Support', 'الدعم') : 'Support'}</a>
    <a class="opt" href="/privacy/"${nav === 'privacy' ? ' aria-current="page"' : ''}>${bilingual ? b('Privacy', 'الخصوصية') : 'Privacy'}</a>
    <a class="opt" href="/terms/"${nav === 'terms' ? ' aria-current="page"' : ''}>${bilingual ? b('Terms', 'الشروط') : 'Terms'}</a>
    ${bilingual ? `<button class="lang" type="button" onclick="fakkaLang()">${b('العربية', 'English')}</button>` : ''}
  </nav>
</div></header>
<main>${body}</main>
<footer><div class="wrap">
  <span>© ${YEAR} ${OWNER}. ${bilingual ? b(`${NAME} is a personal finance tracker, not a bank or financial adviser.`, `${NAME_AR} تطبيق لمتابعة فلوسك، مش بنك ولا مستشار مالي.`) : `${NAME} is a personal finance tracker, not a bank or financial adviser.`}</span>
  <nav aria-label="Footer"><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms of Service</a><a href="/delete-account/">Delete account</a><a href="mailto:${EMAIL}">${EMAIL}</a></nav>
  ${path === '/' ? `<span class="credit">Photos: Mohamed Marey and Ahmad Safwat on Unsplash.</span>` : ''}
</div></footer>
${REVEAL_JS}
</body></html>
`;

// ---------- Home ----------
const promises: [string, string, string][] = [
  ['fingerprint', 'Lock it with Face ID or your fingerprint', 'اقفله بـ Face ID أو البصمة'],
  ['device-mobile', 'Use it as a guest: nothing leaves your phone', 'استخدمه كضيف: مفيش حاجة بتخرج من موبايلك'],
  ['eye-slash', 'No ads, no tracking, and we never sell your data', 'من غير إعلانات ولا تتبع، وعمرنا ما بنبيع بياناتك'],
  ['lock-key', 'Never asks for your bank or card passwords', 'عمره ما بيطلب باسورد البنك أو الكارت'],
  ['trash', 'Delete your account any time, right in the app', 'امسح حسابك في أي وقت من جوه التطبيق'],
  ['shield-check', 'Your account data can only be read by you', 'بيانات حسابك محدش يقدر يشوفها غيرك'],
];

write('index.html', page({
  path: '/', title: `${NAME} · Your money, made simple`,
  description: `${NAME} (${NAME_AR}) tracks your installments, bills, gam'eya, gold and savings in one calm place. Made for Egypt.`,
  body: `
<section class="wrap hero">
  <div>
    <h1 class="rise">${b('Know where every <em>pound</em> goes', 'اعرف كل <em>جنيه</em> بيروح فين')}</h1>
    <p class="rise" style="--i:1">${b("Installments, bills, gam'eya, gold and savings, all in one calm place on your iPhone.", 'الأقساط والفواتير والجمعيات والدهب والادخار، كلها في مكان واحد هادي على الآيفون.')}</p>
    <div class="soon rise" style="--i:2">${icon('device-mobile', 20)}<span><small>${b('Coming soon', 'قريباً')}</small><strong>${b('On the App Store', 'على App Store')}</strong></span></div>
  </div>
  <figure>${img('coin', 'An Egyptian one pound coin standing on its edge', '', true)}</figure>
</section>

<section class="meaning"><div class="wrap">
  <p class="rise">${b(`In Egypt, <span class="ar-word">فكّة</span> means small change. <span class="quiet">${NAME} keeps track of it, and of everything bigger.</span>`, `<span class="ar-word">فكّة</span> يعني الفلوس الصغيرة. <span class="quiet">وفكّة بتتابعها، وتتابع كل حاجة أكبر منها كمان.</span>`)}</p>
</div></section>

<section class="sec" id="features"><div class="wrap">
  <h2 class="rise">${b('Everything you pay, in one place', 'كل اللي بتدفعه، في مكان واحد')}</h2>
  <div class="bento">
    <div class="tile score rise">
      <div class="scale" aria-hidden="true">0<small>${b('to', 'لـ')}</small>100</div>
      <h3>${b('Your Financial Health Score', 'مؤشر صحتك المالية')}</h3>
      <p>${b('One number that weighs what you owe against what you own, and tells you what to fix first.', 'رقم واحد بيوزن اللي عليك قصاد اللي ليك، ويقولك تصلّح إيه الأول.')}</p>
    </div>
    <div class="tile wide rise" style="--i:1">${icon('calendar-dots', 28)}
      <h3>${b('Installments and loans', 'الأقساط والقروض')}</h3>
      <p>${b("Installment apps, bank loans and mortgages in one list, and the month you'll be debt-free.", 'تطبيقات التقسيط وقروض البنوك والتمويل العقاري في قايمة واحدة، والشهر اللي هتخلص فيه.')}</p>
    </div>
    <div class="tile rise" style="--i:2">${icon('receipt', 28)}
      <h3>${b('Bills and reminders', 'الفواتير والتنبيهات')}</h3>
      <p>${b('Electricity, internet, school fees. A reminder the day before.', 'الكهرباء والإنترنت والمدارس. تنبيه قبلها بيوم.')}</p>
    </div>
    <div class="tile tall rise" style="--i:3">${img('ataba-market', '')}${icon('users-three', 28)}
      <h3>${b("Gam'eya", 'الجمعية')}</h3>
      <p>${b("Your turn, what you've paid and what you'll receive.", 'دورك، ودفعت كام، وهتقبض كام.')}</p>
    </div>
    <div class="tile tinted wide rise">${icon('chat-text', 28)}
      <h3>${b('Bank messages, logged for you', 'رسايل البنك بتتسجل لوحدها')}</h3>
      <p>${b("On iPhone, card payments add themselves from your bank's texts. Only the amount, shop and date are kept.", 'على الآيفون، مدفوعات الكارت بتضاف لوحدها من رسايل البنك. بنحفظ المبلغ والمحل والتاريخ بس.')}</p>
    </div>
    <div class="tile rise" style="--i:1">${icon('coins', 28)}
      <h3>${b('Gold and savings', 'الدهب والادخار')}</h3>
      <p>${b("Gold 21K and 24K, dollars and euros at today's prices.", 'دهب 21 و24 والدولار واليورو بأسعار النهارده.')}</p>
    </div>
  </div>
</div></section>
${shots.length === SHOTS.length ? `
<section class="sec"><div class="wrap">
  <h2 class="rise">${b('On your phone', 'على موبايلك')}</h2>
  <div class="shots">
    ${shots.map(([f, en, ar], i) => `<figure class="rise" style="--i:${i}"><img src="/img/screen-${f}.png" alt="${esc(en)}" loading="lazy" decoding="async"><figcaption>${b(en, ar)}</figcaption></figure>`).join('\n    ')}
  </div>
</div></section>` : ''}

<section class="egypt">
  ${img('ataba', 'Ataba Square in downtown Cairo at dusk, with shops, traffic and a Banque Misr branch')}
  <div class="wrap">
    <div class="rise"><span class="eyebrow">${b('Made for Egypt', 'معمول لمصر')}</span><h2>${b('Built for how Egypt pays', 'معمول على طريقة الدفع في مصر')}</h2></div>
    <div class="points">
      <div class="rise">${icon('coins', 24)}<div><strong>${b('Pounds first', 'الجنيه الأول')}</strong><p>${b('Every amount in L.E, with gold and dollars converted at live prices.', 'كل المبالغ بالجنيه، والدهب والدولار بيتحسبوا بالأسعار اللحظية.')}</p></div></div>
      <div class="rise" style="--i:1">${icon('users-three', 24)}<div><strong>${b("Gam'eya and installment apps", 'الجمعيات وتطبيقات التقسيط')}</strong><p>${b('The ways people here actually save and borrow, not a copy of a foreign app.', 'الطرق اللي الناس هنا بتدّخر وبتقسّط بيها فعلاً، مش نسخة من تطبيق أجنبي.')}</p></div></div>
      <div class="rise" style="--i:2">${icon('chat-text', 24)}<div><strong>${b('Arabic and English', 'عربي وإنجليزي')}</strong><p>${b('Switch any time, with right-to-left done properly.', 'غيّر في أي وقت، والعربي من اليمين للشمال مظبوط.')}</p></div></div>
    </div>
  </div>
</section>

<section class="sec"><div class="wrap privacy">
  <div class="rise"><h2>${b('Your money stays yours', 'فلوسك تفضل بتاعتك')}</h2>
    <p>${b(`${NAME} never connects to your bank. You decide what goes in, and you can take it all out.`, `${NAME_AR} عمرها ما بتتوصل ببنكك. إنت اللي بتقرر تدخّل إيه، وتقدر تطلّع كل حاجة.`)}</p></div>
  <div class="promises">
    ${promises.map(([ic, en, ar], i) => `<div class="promise rise" style="--i:${i % 2}">${icon(ic, 22)}<span>${b(en, ar)}</span></div>`).join('\n    ')}
  </div>
</div></section>

<section class="wrap ask">
  <h2 class="rise">${b('Questions?', 'عندك سؤال؟')}</h2>
  <p class="rise" style="--i:1">${b('A real person reads every email and answers as soon as possible.', 'شخص حقيقي بيقرا كل إيميل وبيرد في أقرب وقت.')}</p>
  <a class="pill solid rise" style="--i:2" href="mailto:${EMAIL}">${icon('envelope-simple', 20)}${b('Email us', 'ابعتلنا إيميل')}</a>
</section>`,
}));

// ---------- Support ----------
const faqs: [string, string, string, string][] = [
  ['How do I delete my account?', 'إزاي أمسح حسابي؟',
    `In the app: Profile → Settings → Legal & Privacy → Delete account. It deletes your account and all your data for good. Can't open the app? See <a href="/delete-account/">Delete your account</a>.`,
    `من التطبيق: حسابي ← الإعدادات ← القانوني والخصوصية ← امسح الحساب. بيمسح حسابك وكل بياناتك نهائياً. مش قادر تفتح التطبيق؟ شوف <a href="/delete-account/">مسح الحساب</a>.`],
  ['How do I sign in?', 'إزاي أسجل دخول؟',
    `With your Google account or your Apple ID, or as a guest without an account. ${NAME} has no passwords of its own, so there is nothing to forget.`,
    `بحساب جوجل أو Apple ID، أو كضيف من غير حساب. ${NAME_AR} مفيهاش باسورد خاص بيها، فمفيش حاجة تنساها.`],
  [`Does ${NAME} connect to my bank?`, `${NAME_AR} بتتوصل بحسابي في البنك؟`,
    `No. ${NAME} never connects to your bank and never asks for card numbers, bank passwords or PINs. You decide what to add.`,
    `لا. ${NAME_AR} عمرها ما بتتوصل ببنكك ولا بتطلب رقم كارت أو باسورد أو PIN. إنت اللي بتقرر تضيف إيه.`],
  ['Where is my data stored?', 'بياناتي محفوظة فين؟',
    `As a guest, only on your phone. With an account, on your phone and on secure servers in the EU, where only you can read it. Receipt photos always stay on your phone. Details are in our <a href="/privacy/">Privacy Policy</a>.`,
    `كضيف، على موبايلك بس. بحساب، على موبايلك وعلى سيرفرات آمنة في الاتحاد الأوروبي محدش يقدر يشوفها غيرك. صور الإيصالات دايماً على موبايلك. التفاصيل في <a href="/privacy/">سياسة الخصوصية</a>.`],
  ['How does automatic bank message logging work?', 'التسجيل التلقائي لرسائل البنك بيشتغل إزاي؟',
    `On iPhone, go to Settings → Bank messages → Automatic logging and follow the steps to set up a Shortcuts automation. Only the amount, shop and date are kept, never the message itself. You can turn it off any time.`,
    `على الآيفون، روح الإعدادات ← رسائل البنك ← التسجيل التلقائي واتبع الخطوات لعمل أتمتة في Shortcuts. بنحفظ المبلغ والمحل والتاريخ بس، مش الرسالة نفسها. وتقدر تقفله في أي وقت.`],
  [`Is ${NAME} free?`, `${NAME_AR} ببلاش؟`,
    `Yes, ${NAME} is free to download and use.`,
    `أيوه، ${NAME_AR} ببلاش تنزيل واستخدام.`],
  [`Is ${NAME} financial advice?`, `${NAME_AR} بتقدم نصيحة مالية؟`,
    `No. ${NAME} helps you keep track of your money. Figures are estimates based on what you enter. Check important numbers with your bank and talk to a professional before big decisions.`,
    `لا. ${NAME_AR} بتساعدك تتابع فلوسك. الأرقام تقديرية حسب اللي بتدخله. اتأكد من الأرقام المهمة مع بنكك واسأل متخصص قبل أي قرار كبير.`],
];

write('support/index.html', page({
  path: '/support/', nav: 'support', title: `Support · ${NAME}`,
  description: `Get help with ${NAME}: contact support, delete your account, and answers to common questions.`,
  body: `
<div class="wrap">
  <div class="page-head"><h1>${b('How can we help?', 'نقدر نساعدك إزاي؟')}</h1>
    <p>${b('Most answers are below. For anything else, email us.', 'أغلب الإجابات تحت. لأي حاجة تانية، ابعتلنا إيميل.')}</p></div>
  <div class="contact">
    <span><strong>${EMAIL}</strong>${b('We answer as soon as we can.', 'هنرد عليك في أقرب وقت.')}</span>
    <a class="pill solid" href="mailto:${EMAIL}">${icon('envelope-simple', 20)}${b('Email us', 'ابعتلنا إيميل')}</a>
  </div>
  <section class="faq">
    <h2>${b('Common questions', 'أسئلة شائعة')}</h2>
    ${faqs.map(([qe, qa, ae, aa]) => `<details><summary>${b(qe, qa)}</summary><p>${b(ae, aa)}</p></details>`).join('\n    ')}
  </section>
</div>`,
}));

// ---------- Privacy Policy & Terms (English; the English text is the one that applies) ----------
function legal(key: LegalDocKey, path: string) {
  const d = LEGAL_DOCS[key];
  let html = '';
  const toc: [string, string][] = [];
  let list = false;
  blocks(d.body.split('Fakka').join(NAME)).forEach((x, i) => {
    if (x.kind !== 'li' && list) { html += '</ul>'; list = false; }
    if (x.kind === 'li' && !list) { html += '<ul>'; list = true; }
    const text = esc(x.text).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, m => `<a href="mailto:${m}">${m}</a>`).replace(/https:\/\/[^\s<]+/g, m => `<a href="${m}">${m}</a>`);
    if (x.kind === 'h2') { const id = `s${toc.length + 1}`; toc.push([id, esc(x.text)]); html += `<h2 id="${id}">${text}</h2>`; }
    else html += x.kind === 'h3' ? `<h3>${text}</h3>` : x.kind === 'li' ? `<li>${text}</li>` : `<p${i === 0 ? ' class="meta"' : ''}>${text}</p>`;
  });
  if (list) html += '</ul>';
  write(`${path}/index.html`, page({
    path: `/${path}/`, nav: path, bilingual: false, title: `${d.title} · ${NAME}`, description: `${NAME} ${d.title}.`,
    body: `
<div class="wrap">
  <div class="page-head"><h1>${esc(d.title)}</h1></div>
  <div class="doc">
    <nav class="toc" aria-label="Contents"><strong>Contents</strong><ol>${toc.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('')}</ol></nav>
    <article>${html}</article>
  </div>
</div>`,
  }));
}
legal('privacy', 'privacy');
legal('terms', 'terms');

// ---------- Delete your account (Google Play asks for this page) ----------
write('delete-account/index.html', page({
  path: '/delete-account/', title: `Delete your account · ${NAME}`,
  description: `How to delete your ${NAME} account and data, and what gets deleted.`,
  body: `
<div class="wrap">
  <div class="page-head"><h1>${b(`Delete your ${NAME} account`, 'امسح حسابك')}</h1>
    <p>${b('You can delete your account and all data linked to it at any time.', 'تقدر تمسح حسابك وكل البيانات المرتبطة بيه في أي وقت.')}</p></div>
  <div class="doc" style="grid-template-columns:1fr">
  <article>
<div data-l="ar" dir="rtl" style="text-align:right" class="note">من التطبيق: حسابي ← الإعدادات ← القانوني والخصوصية ← امسح الحساب. مش قادر تفتح التطبيق؟ ابعت لـ ${EMAIL} من الإيميل المسجل بيه حسابك. التفاصيل الكاملة بالإنجليزي تحت.</div>
<p>${NAME} is developed by ${OWNER}.</p>
<h2>In the app</h2>
<ul><li>Open ${NAME} and sign in.</li><li>Go to Profile → Settings → Legal &amp; Privacy → Delete account.</li>
<li>Confirm by typing DELETE.</li></ul>
<p>Your account is deleted straight away and you return to the sign-in screen.</p>
<h2>Without the app</h2>
<p>Email <a href="mailto:${EMAIL}?subject=Delete%20my%20${NAME}%20account">${EMAIL}</a> from the email address linked to your account and ask us to delete it. We may ask you to confirm that the account is yours, and we will act on it within 30 days.</p>
<h2>What is deleted</h2>
<ul><li>Your sign-in account (the link to your Google or Apple account).</li>
<li>All financial information synced to your account: income, spending, installments, loans, bills, gam'eya, savings, goals, price alerts, shop categories and scores.</li>
<li>Bank-message transactions waiting in your inbox and your message-forwarding key.</li>
<li>Your shop category votes and your Terms / Privacy acceptance records.</li></ul>
<h2>What may be kept</h2>
<p>Deleted data may remain in encrypted backups held by our hosting provider for up to [BACKUP RETENTION PERIOD] before being overwritten. Aggregated shop category suggestions that no longer identify you may remain. We keep nothing else, unless the law requires it.</p>
<p>See our <a href="/privacy/">Privacy Policy</a> for details.</p>
  </article>
  </div>
</div>`,
}));

// ---------- 404 ----------
write('404.html', page({
  path: '/404.html', title: `Page not found · ${NAME}`, description: 'Page not found.',
  body: `<div class="wrap lost"><h1>${b('This page is not here', 'الصفحة دي مش موجودة')}</h1><p>${b('It may have moved, or the link has a typo.', 'ممكن تكون اتنقلت، أو اللينك فيه غلطة.')}</p><a class="pill solid" href="/">${b('Go to the home page', 'ارجع للرئيسية')}</a></div>`,
}));

writeFileSync(new URL('favicon.svg', root), favicon);
copyFileSync(new URL('../assets/og.png', import.meta.url), new URL('og.png', root)); // link preview (1200x630) for WhatsApp, X, etc.
writeFileSync(new URL('CNAME', root), `${DOMAIN}\n`); // GitHub Pages custom domain (ignored by other hosts)
writeFileSync(new URL('.nojekyll', root), ''); // GitHub Pages: serve the files exactly as they are
writeFileSync(new URL('robots.txt', root), `User-agent: *\nAllow: /\nSitemap: https://${DOMAIN}/sitemap.xml\n`);
writeFileSync(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', '/support/', '/privacy/', '/terms/', '/delete-account/'].map(p => `  <url><loc>https://${DOMAIN}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built website/ for ${DOMAIN}`);
