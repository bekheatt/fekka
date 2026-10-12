// Builds fakkaeg.com into website/: home, support, privacy, terms, delete-account and a 404 page.
// The Privacy Policy and Terms come from the same text the app shows (src/features/Legal/documents.ts),
// so the website and the app can never disagree. Run after changing either document:
//   node scripts/build-website.mts
// Plain HTML + CSS with self-hosted fonts, icons (Phosphor, MIT) and real app screenshots: no trackers, no cookies, no outside requests.
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

// Real app screenshots (iPhone, portrait) in assets/website/screens/. Until they exist the frames show a placeholder,
// so the site must not be published before they are all there.
const SHOTS = { home: 'Fakka home screen with the Financial Health Score', pay: 'Fakka payments screen with installments and loans', save: 'Fakka savings screen with gold and dollars', spend: 'Fakka spending screen with the week chart' } as const;
type Shot = keyof typeof SHOTS;
const missing = (Object.keys(SHOTS) as Shot[]).filter(f => !existsSync(asset(`screens/${f}.png`)));
for (const f of Object.keys(SHOTS) as Shot[]) if (!missing.includes(f)) copy(asset(`screens/${f}.png`), `img/${f}.png`);
if (missing.length) console.warn(`App screenshots missing: ${missing.join(', ')}. Add them to assets/website/screens/ before publishing.`);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// The same text in English and Arabic; the page shows one, by the visitor's choice or phone language
const b = (en: string, ar: string) => `<span data-l="en">${en}</span><span data-l="ar">${ar}</span>`;
// Phosphor icon, inlined so it takes the text colour
const icon = (name: string, size = 22) => readFileSync(asset(`icons/${name}.svg`), 'utf8').trim()
  .replace('<svg ', `<svg class="ic" width="${size}" height="${size}" aria-hidden="true" focusable="false" `);
// A phone frame around a real screenshot (828 x 1792, iPhone)
const phone = (f: Shot, eager = false) => missing.includes(f)
  ? `<div class="phone"><div class="screen ph">${b('App screenshot', 'صورة من التطبيق')}</div></div>`
  : `<div class="phone"><img class="screen" src="/img/${f}.png" width="828" height="1792" alt="${SHOTS[f]}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></div>`;

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

// Bright and minimal: near-white, one accent (the app's Electric Blue). Light only, by choice.
// Shapes: phones and soft panels rounded, everything you tap is a full pill.
const CSS = `
@font-face { font-family: Outfit; font-weight: 400; font-display: swap; src: url(/fonts/Outfit_400Regular.ttf) format("truetype"); }
@font-face { font-family: Outfit; font-weight: 600; font-display: swap; src: url(/fonts/Outfit_600SemiBold.ttf) format("truetype"); }
@font-face { font-family: "IBM Plex Sans Arabic"; font-weight: 400; font-display: swap; src: url(/fonts/IBMPlexSansArabic_400Regular.ttf) format("truetype"); }
@font-face { font-family: "IBM Plex Sans Arabic"; font-weight: 600; font-display: swap; src: url(/fonts/IBMPlexSansArabic_600SemiBold.ttf) format("truetype"); }
:root { --bg: #FDFDFE; --soft: #F3F4F7; --ink: #111318; --sub: #5E6572; --line: #E6E8ED; --accent: #2B3BFF; --ease: cubic-bezier(.16, 1, .3, 1); color-scheme: light; }
* { box-sizing: border-box; }
html[lang=en] [data-l=ar], html[lang=ar] [data-l=en] { display: none; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 17px/1.6 Outfit, "IBM Plex Sans Arabic", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
html[lang=ar] body { font-family: "IBM Plex Sans Arabic", Outfit, system-ui, sans-serif; }
img { display: block; max-width: 100%; height: auto; }
a { color: var(--accent); text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }
h1, h2, h3 { font-weight: 600; margin: 0; text-wrap: balance; }
p { margin: 0; }
.ic { flex: none; }
.wrap { width: 100%; max-width: 1120px; margin: 0 auto; padding: 0 24px; }
@media (max-width: 767px) { .wrap { padding: 0 20px; } }

/* Header */
.top { position: sticky; top: 0; z-index: 10; background: rgb(253 253 254 / .86); backdrop-filter: saturate(1.6) blur(16px); -webkit-backdrop-filter: saturate(1.6) blur(16px); }
.top .wrap { display: flex; align-items: center; justify-content: space-between; height: 60px; gap: 16px; }
.brand { display: inline-flex; align-items: center; gap: 9px; color: var(--ink); text-decoration: none; font-weight: 600; font-size: 19px; letter-spacing: -.02em; }
.nav { display: flex; align-items: center; gap: 22px; font-size: 15px; }
.nav a { color: var(--sub); text-decoration: none; transition: color .2s; }
.nav a:hover, .nav a[aria-current] { color: var(--ink); }
.lang { border: 0; background: var(--soft); color: var(--ink); border-radius: 999px; padding: 7px 14px; font: inherit; font-size: 14px; cursor: pointer; transition: background-color .2s, transform .15s var(--ease); }
.lang:hover { background: var(--line); }
.lang:active { transform: scale(.97); }
@media (max-width: 640px) { .nav .opt { display: none; } .nav { gap: 14px; } }

/* Buttons */
.pill { display: inline-flex; align-items: center; gap: 10px; white-space: nowrap; border-radius: 999px; padding: 13px 24px; font-weight: 600; font-size: 16px; text-decoration: none; background: var(--accent); color: #FDFDFE; transition: transform .2s var(--ease), background-color .2s; }
.pill:hover { background: #1F2EE6; }
.pill:active { transform: scale(.98); }
.soon { display: inline-flex; align-items: center; gap: 8px; margin-top: 28px; padding: 9px 18px; border-radius: 999px; background: var(--soft); color: var(--ink); font-size: 15px; font-weight: 600; }
.soon .ic { color: var(--accent); }

/* Phone frame around a real screenshot */
.phone { width: min(290px, 74vw); margin: 0 auto; padding: 9px; border-radius: 48px; background: #15171C; box-shadow: 0 0 0 1px #2A2D35 inset, 0 50px 90px -40px rgb(17 19 40 / .45); }
.screen { width: 100%; aspect-ratio: 828 / 1792; object-fit: cover; border-radius: 39px; background: var(--soft); }
.screen.ph { display: grid; place-items: center; color: var(--sub); font-size: 14px; }

/* Hero: centred message, the app below it, cropped by a soft fade */
.hero { text-align: center; padding-top: clamp(56px, 9vh, 96px); }
.hero h1 { font-size: clamp(44px, 7vw, 84px); line-height: 1.02; letter-spacing: -.04em; max-width: 12ch; margin: 0 auto; }
html[lang=ar] .hero h1 { line-height: 1.25; letter-spacing: 0; }
.hero p { margin: 22px auto 0; color: var(--sub); font-size: clamp(18px, 1.7vw, 21px); max-width: 34ch; }
.trio { display: flex; justify-content: center; align-items: flex-start; gap: 28px; margin-top: 64px; height: clamp(420px, 52vw, 620px); overflow: hidden; -webkit-mask-image: linear-gradient(to bottom, #000 72%, transparent); mask-image: linear-gradient(to bottom, #000 72%, transparent); }
.trio .phone { margin: 0; flex: none; }
.trio > :nth-child(2) .phone { width: min(330px, 80vw); }
.trio > :nth-child(1), .trio > :nth-child(3) { margin-top: 72px; }
@media (max-width: 860px) { .trio > :nth-child(1), .trio > :nth-child(3) { display: none; } .trio { height: 520px; } }

/* Feature rows: words beside a phone */
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; padding-block: clamp(72px, 11vh, 128px); }
.row.flip > :first-child { order: 2; }
.row h2 { font-size: clamp(32px, 4.2vw, 52px); line-height: 1.06; letter-spacing: -.035em; max-width: 13ch; }
html[lang=ar] .row h2 { line-height: 1.35; letter-spacing: 0; }
.row p { margin-top: 18px; color: var(--sub); font-size: 19px; max-width: 34ch; }
@media (max-width: 860px) {
  .row { grid-template-columns: 1fr; gap: 44px; text-align: center; padding-block: 64px; }
  .row.flip > :first-child { order: 0; }
  .row h2, .row p { margin-inline: auto; }
}

/* Everything else: a quiet grid, no boxes */
.more { padding-block: clamp(72px, 10vh, 120px); border-top: 1px solid var(--line); }
.more h2 { font-size: clamp(30px, 3.6vw, 44px); letter-spacing: -.03em; line-height: 1.1; text-align: center; }
html[lang=ar] .more h2 { letter-spacing: 0; line-height: 1.4; }
.list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px 40px; margin-top: 56px; }
.list .ic { color: var(--accent); }
.list h3 { margin-top: 14px; font-size: 19px; letter-spacing: -.01em; }
.list p { margin-top: 6px; color: var(--sub); font-size: 16px; }
@media (max-width: 860px) { .list { grid-template-columns: 1fr 1fr; gap: 40px 28px; } }
@media (max-width: 520px) { .list { grid-template-columns: 1fr; } }

/* Privacy, on a soft band */
.privacy { background: var(--soft); padding-block: clamp(72px, 10vh, 112px); }
.privacy h2 { font-size: clamp(30px, 3.6vw, 44px); letter-spacing: -.03em; line-height: 1.1; text-align: center; }
html[lang=ar] .privacy h2 { letter-spacing: 0; line-height: 1.4; }
.privacy .wrap > p { margin: 14px auto 0; color: var(--sub); text-align: center; max-width: 46ch; }
.checks { list-style: none; margin: 44px auto 0; padding: 0; max-width: 820px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px 40px; }
.checks li { display: flex; gap: 12px; align-items: flex-start; }
.checks .ic { color: var(--accent); margin-top: 3px; }
@media (max-width: 640px) { .checks { grid-template-columns: 1fr; } }

/* Questions */
.ask { text-align: center; padding-block: clamp(72px, 10vh, 120px); }
.ask h2 { font-size: clamp(28px, 3.4vw, 40px); letter-spacing: -.02em; }
.ask p { color: var(--sub); margin: 12px auto 28px; max-width: 40ch; }

/* Footer */
footer { border-top: 1px solid var(--line); padding: 28px 0 40px; color: var(--sub); font-size: 14px; }
footer .wrap { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 14px 32px; }
footer nav { display: flex; flex-wrap: wrap; gap: 8px 20px; }
footer a { color: var(--sub); text-decoration: none; }
footer a:hover { color: var(--ink); text-decoration: underline; }

/* Inner pages: support, legal documents, delete account */
.page-head { padding: 64px 0 36px; }
.page-head h1 { font-size: clamp(36px, 5vw, 56px); letter-spacing: -.035em; line-height: 1.05; }
html[lang=ar] .page-head h1 { letter-spacing: 0; line-height: 1.3; }
.page-head p { margin-top: 14px; color: var(--sub); font-size: 18px; max-width: 52ch; }
.contact { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; padding: 28px; border-radius: 24px; background: var(--soft); margin-bottom: 56px; }
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
.doc { display: grid; grid-template-columns: 240px 1fr; gap: 56px; align-items: start; padding-bottom: 48px; }
.doc.single { grid-template-columns: 1fr; }
.toc { position: sticky; top: 84px; font-size: 14px; }
.toc strong { display: block; margin-bottom: 10px; font-weight: 600; }
.toc ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; }
.toc a { display: block; color: var(--sub); text-decoration: none; padding: 5px 0; line-height: 1.35; }
.toc a:hover { color: var(--accent); }
article { max-width: 72ch; direction: ltr; text-align: left; }
article h2 { font-size: 24px; letter-spacing: -.01em; margin: 44px 0 10px; scroll-margin-top: 84px; }
article h3 { font-size: 18px; margin: 24px 0 6px; }
article p { white-space: pre-line; margin: 0 0 14px; }
article .meta { color: var(--sub); }
article ul { padding-inline-start: 22px; margin: 0 0 14px; }
article li { margin-bottom: 6px; }
.note { padding: 14px 18px; border-radius: 16px; background: var(--soft); margin-bottom: 28px; }
@media (max-width: 860px) {
  .doc { grid-template-columns: 1fr; gap: 24px; }
  .toc { position: static; padding: 18px; border-radius: 16px; background: var(--soft); }
}
.lost { min-height: 60dvh; display: grid; align-content: center; justify-items: center; text-align: center; gap: 18px; padding: 64px 0; }
.lost h1 { font-size: clamp(36px, 5vw, 56px); letter-spacing: -.03em; }

/* Motion: a gentle settle as things come into view (skipped when the phone asks for less motion) */
@media (prefers-reduced-motion: no-preference) {
  .js .rise { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease), transform .9s var(--ease); transition-delay: calc(var(--i, 0) * 80ms); }
  .js .rise.in { opacity: 1; transform: none; }
}
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
<meta name="theme-color" content="#FDFDFE">
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
</div></footer>
${REVEAL_JS}
</body></html>
`;

// ---------- Home ----------
const others: [string, string, string, string, string][] = [
  ['heartbeat', 'Financial Health Score', 'مؤشر صحتك المالية', 'One number from 0 to 100, and what to fix first.', 'رقم واحد من 0 لـ 100، وتصلّح إيه الأول.'],
  ['calendar-dots', 'Installments and loans', 'الأقساط والقروض', "Installment apps, bank loans and mortgages, and the month you'll be debt-free.", 'تطبيقات التقسيط وقروض البنوك والتمويل العقاري، والشهر اللي هتخلص فيه.'],
  ['receipt', 'Bills and reminders', 'الفواتير والتنبيهات', 'Electricity, internet, school fees. A reminder the day before.', 'الكهرباء والإنترنت والمدارس. تنبيه قبلها بيوم.'],
  ['users-three', "Gam'eya", 'الجمعية', "Your turn, what you've paid and what you'll receive.", 'دورك، ودفعت كام، وهتقبض كام.'],
  ['chat-text', 'Bank messages', 'رسايل البنك', "Card payments add themselves from your bank's texts.", 'مدفوعات الكارت بتضاف لوحدها من رسايل البنك.'],
  ['device-mobile', 'Arabic and English', 'عربي وإنجليزي', 'Switch any time, right-to-left done properly.', 'غيّر في أي وقت، والعربي مظبوط.'],
];
const checks: [string, string][] = [
  ['Locks with Face ID the moment you leave', 'بيتقفل بـ Face ID أول ما تخرج'],
  ['Never connects to your bank', 'عمره ما بيتوصل ببنكك'],
  ['Never asks for card or bank passwords', 'عمره ما بيطلب باسورد الكارت أو البنك'],
  ['No ads, no tracking, never sold', 'من غير إعلانات ولا تتبع، ومش بنبيع بياناتك'],
  ['Use it as a guest: nothing leaves your phone', 'استخدمه كضيف: مفيش حاجة بتخرج من موبايلك'],
  ['Your account data can only be read by you', 'بيانات حسابك محدش يقدر يشوفها غيرك'],
  ['Delete your account any time, in the app', 'امسح حسابك في أي وقت من التطبيق'],
];

write('index.html', page({
  path: '/', title: `${NAME} · Your money, made simple`,
  description: `${NAME} (${NAME_AR}) tracks your installments, bills, gam'eya, gold and savings in one calm place. Made for Egypt.`,
  body: `
<section class="wrap hero">
  <h1 class="rise">${b('Know where every pound goes.', 'اعرف كل جنيه بيروح فين.')}</h1>
  <p class="rise" style="--i:1">${b("Installments, bills, gam'eya, gold and savings. One calm app, made for Egypt.", 'الأقساط والفواتير والجمعيات والدهب والادخار. تطبيق واحد هادي، معمول لمصر.')}</p>
  <span class="soon rise" style="--i:2">${icon('device-mobile', 18)}${b('Coming soon on iPhone', 'قريباً على الآيفون')}</span>
  <div class="trio">
    <div class="rise" style="--i:3">${phone('spend')}</div>
    <div class="rise" style="--i:2">${phone('home', true)}</div>
    <div class="rise" style="--i:4">${phone('pay')}</div>
  </div>
</section>

<section class="wrap row">
  <div class="rise"><h2>${b("Gold and savings, at today's prices.", 'الدهب والادخار، بأسعار النهارده.')}</h2>
    <p>${b('Gold 21K and 24K, dollars and euros, all valued in pounds with live prices.', 'دهب 21 و24 والدولار واليورو، كلهم بيتحسبوا بالجنيه بالأسعار اللحظية.')}</p></div>
  <div class="rise" style="--i:1">${phone('save')}</div>
</section>

<section class="wrap more">
  <h2 class="rise">${b('And the rest of your money.', 'وباقي فلوسك.')}</h2>
  <div class="list">
    ${others.map(([ic, en, ar, pen, par], i) => `<div class="rise" style="--i:${i % 3}">${icon(ic, 26)}<h3>${b(en, ar)}</h3><p>${b(pen, par)}</p></div>`).join('\n    ')}
  </div>
</section>

<section class="privacy"><div class="wrap">
  <h2 class="rise">${b('Private by design.', 'خصوصيتك أولاً.')}</h2>
  <p class="rise" style="--i:1">${b('You decide what goes in, and you can take it all out.', 'إنت اللي بتقرر تدخّل إيه، وتقدر تطلّع كل حاجة.')}</p>
  <ul class="checks">
    ${checks.map(([en, ar], i) => `<li class="rise" style="--i:${i % 2}">${icon('shield-check', 20)}<span>${b(en, ar)}</span></li>`).join('\n    ')}
  </ul>
</div></section>

<section class="wrap ask">
  <h2 class="rise">${b('Questions?', 'عندك سؤال؟')}</h2>
  <p class="rise" style="--i:1">${b('A real person reads every email.', 'شخص حقيقي بيقرا كل إيميل.')}</p>
  <a class="pill rise" style="--i:2" href="mailto:${EMAIL}">${icon('envelope-simple', 20)}${b('Email us', 'ابعتلنا إيميل')}</a>
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
    <a class="pill" href="mailto:${EMAIL}">${icon('envelope-simple', 20)}${b('Email us', 'ابعتلنا إيميل')}</a>
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
  <div class="doc single">
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
  body: `<div class="wrap lost"><h1>${b('This page is not here', 'الصفحة دي مش موجودة')}</h1><p>${b('It may have moved, or the link has a typo.', 'ممكن تكون اتنقلت، أو اللينك فيه غلطة.')}</p><a class="pill" href="/">${b('Go to the home page', 'ارجع للرئيسية')}</a></div>`,
}));

writeFileSync(new URL('favicon.svg', root), favicon);
copyFileSync(new URL('../assets/og.png', import.meta.url), new URL('og.png', root)); // link preview (1200x630) for WhatsApp, X, etc.
writeFileSync(new URL('CNAME', root), `${DOMAIN}\n`); // GitHub Pages custom domain (ignored by other hosts)
writeFileSync(new URL('.nojekyll', root), ''); // GitHub Pages: serve the files exactly as they are
writeFileSync(new URL('robots.txt', root), `User-agent: *\nAllow: /\nSitemap: https://${DOMAIN}/sitemap.xml\n`);
writeFileSync(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', '/support/', '/privacy/', '/terms/', '/delete-account/'].map(p => `  <url><loc>https://${DOMAIN}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built website/ for ${DOMAIN}`);
