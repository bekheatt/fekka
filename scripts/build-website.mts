// Builds fakkaeg.com into website/: home, support, privacy, terms, delete-account and a 404 page.
// The Privacy Policy and Terms come from the same text the app shows (src/features/Legal/documents.ts),
// so the website and the app can never disagree. Run after changing either document:
//   node scripts/build-website.mts
// Everything is plain HTML with self-hosted fonts: no trackers, no cookies, no outside requests.
import { writeFileSync, mkdirSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { LEGAL_DOCS, blocks, type LegalDocKey } from '../src/features/Legal/documents.ts';

const brand = JSON.parse(readFileSync(new URL('../brand.json', import.meta.url), 'utf8'));
const NAME: string = brand.name, NAME_AR: string = brand.nameAr;
const DOMAIN = 'fakkaeg.com';
const EMAIL = 'support@fakkaeg.com';
const OWNER = 'Ahmed Hesham Bekheat';
const YEAR = new Date().getFullYear();

const root = new URL('../website/', import.meta.url);
rmSync(root, { recursive: true, force: true });
const write = (path: string, html: string) => {
  const url = new URL(path, root);
  mkdirSync(new URL('./', url), { recursive: true });
  writeFileSync(url, html);
};

// Fonts from the app's own packages (SIL Open Font License)
const FONTS = [
  ['outfit', 'Outfit_400Regular.ttf', '400Regular'], ['outfit', 'Outfit_600SemiBold.ttf', '600SemiBold'],
  ['ibm-plex-sans-arabic', 'IBMPlexSansArabic_400Regular.ttf', '400Regular'], ['ibm-plex-sans-arabic', 'IBMPlexSansArabic_600SemiBold.ttf', '600SemiBold'],
];
mkdirSync(new URL('fonts/', root), { recursive: true });
for (const [pkg, file, dir] of FONTS) copyFileSync(new URL(`../node_modules/@expo-google-fonts/${pkg}/${dir}/${file}`, import.meta.url), new URL(`fonts/${file}`, root));

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// The same text in English and Arabic; the page shows one, by the visitor's choice or phone language
const b = (en: string, ar: string) => `<span data-l="en">${en}</span><span data-l="ar">${ar}</span>`;

// The app's logo: three coins, the front one with ف (drawn the same way as src/Logo.tsx)
const logo = (size: number) => `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="50" fill="var(--accent)" opacity=".18"/>
  <g><circle cx="35" cy="39" r="29.1" fill="var(--pale)" stroke="var(--sky)" stroke-width="3.7"/><circle cx="35" cy="39" r="22.3" fill="none" stroke="var(--sky)" stroke-width="1.2" opacity=".6"/></g>
  <g><circle cx="65" cy="37" r="29.1" fill="var(--sky)" stroke="var(--accent)" stroke-width="3.7"/><circle cx="65" cy="37" r="22.3" fill="none" stroke="var(--accent)" stroke-width="1.2" opacity=".6"/></g>
  <g><circle cx="50" cy="63" r="29.1" fill="#fff" stroke="var(--accent)" stroke-width="3.7"/><circle cx="50" cy="63" r="22.3" fill="none" stroke="var(--accent)" stroke-width="1.2" opacity=".6"/>
  <text x="50" y="66" text-anchor="middle" dominant-baseline="middle" font-size="31" font-weight="700" fill="#2B3BFF" font-family="IBM Plex Sans Arabic, Tahoma, sans-serif">ف</text></g>
</svg>`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<circle cx="35" cy="39" r="29.1" fill="#D8DBFF" stroke="#8E97FF" stroke-width="3.7"/>
<circle cx="65" cy="37" r="29.1" fill="#8E97FF" stroke="#2B3BFF" stroke-width="3.7"/>
<circle cx="50" cy="63" r="29.1" fill="#fff" stroke="#2B3BFF" stroke-width="3.7"/>
<text x="50" y="66" text-anchor="middle" dominant-baseline="middle" font-size="31" font-weight="700" fill="#2B3BFF" font-family="Tahoma, sans-serif">ف</text>
</svg>`;

const CSS = `
@font-face { font-family: Outfit; font-weight: 400; font-display: swap; src: url(/fonts/Outfit_400Regular.ttf) format("truetype"); }
@font-face { font-family: Outfit; font-weight: 600; font-display: swap; src: url(/fonts/Outfit_600SemiBold.ttf) format("truetype"); }
@font-face { font-family: "IBM Plex Sans Arabic"; font-weight: 400; font-display: swap; src: url(/fonts/IBMPlexSansArabic_400Regular.ttf) format("truetype"); }
@font-face { font-family: "IBM Plex Sans Arabic"; font-weight: 600; font-display: swap; src: url(/fonts/IBMPlexSansArabic_600SemiBold.ttf) format("truetype"); }
:root { --bg:#EEEFF2; --card:#fff; --ink:#121726; --sub:#6E7480; --line:#E2E4E9; --soft:#F3F4F6; --accent:#2B3BFF; --sky:#8E97FF; --pale:#D8DBFF; --hero:#2B3BFF; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root { --bg:#0B0D12; --card:#151821; --ink:#EEF0F6; --sub:#8A909C; --line:#252A35; --soft:#1C2029; --accent:#4D5BFF; --sky:#9AA2FF; --pale:#D3D7FF; --hero:#3B4BFF; color-scheme: dark; } }
* { box-sizing: border-box; }
html[lang=en] [data-l=ar], html[lang=ar] [data-l=en] { display: none; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 17px/1.6 Outfit, "IBM Plex Sans Arabic", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
html[lang=ar] body { font-family: "IBM Plex Sans Arabic", Outfit, system-ui, sans-serif; }
a { color: var(--accent); }
.wrap { max-width: 1040px; margin: 0 auto; padding: 0 16px; }
header { position: sticky; top: 0; z-index: 5; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--line); }
header .wrap { display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 12px; }
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--ink); font-weight: 600; font-size: 20px; letter-spacing: -.3px; }
nav { display: flex; align-items: center; gap: 18px; font-size: 15px; }
nav a { color: var(--sub); text-decoration: none; } nav a:hover, nav a[aria-current] { color: var(--ink); }
.lang { border: 1px solid var(--line); background: var(--card); color: var(--ink); border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 14px; cursor: pointer; }
@media (max-width: 560px) { nav .hide-sm { display: none; } }
.hero { text-align: center; padding: 72px 0 56px; }
.hero h1 { font-size: clamp(38px, 7vw, 64px); line-height: 1.05; letter-spacing: -.03em; font-weight: 600; margin: 22px 0 14px; }
.hero p { color: var(--sub); font-size: clamp(17px, 2.4vw, 20px); max-width: 560px; margin: 0 auto; }
.pill { display: inline-flex; align-items: center; gap: 8px; margin-top: 28px; background: var(--accent); color: #fff; border-radius: 999px; padding: 14px 24px; font-weight: 600; text-decoration: none; }
.small { display: block; margin-top: 14px; font-size: 14px; color: var(--sub); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 24px; padding: 24px; }
.card h3 { margin: 14px 0 6px; font-size: 19px; font-weight: 600; letter-spacing: -.2px; }
.card p { margin: 0; color: var(--sub); font-size: 16px; }
.icon { width: 44px; height: 44px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); display: grid; place-items: center; font-size: 22px; }
section { padding: 28px 0; }
h2.section { font-size: clamp(26px, 4vw, 36px); letter-spacing: -.02em; font-weight: 600; margin: 0 0 18px; }
.band { background: var(--hero); color: #fff; border-radius: 24px; padding: 32px 24px; }
.band h2 { margin: 0 0 14px; font-size: clamp(24px, 4vw, 32px); font-weight: 600; }
.band ul { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px 24px; }
.band li { padding-inline-start: 28px; position: relative; color: #E7E9FF; }
.band li::before { content: "✓"; position: absolute; inset-inline-start: 0; color: #fff; font-weight: 600; }
footer { border-top: 1px solid var(--line); margin-top: 48px; padding: 28px 0 40px; color: var(--sub); font-size: 14px; }
footer .row { display: flex; flex-wrap: wrap; gap: 8px 20px; justify-content: space-between; }
footer a { color: var(--sub); }
.doc { max-width: 760px; margin: 32px auto 0; }
.doc article { background: var(--card); border: 1px solid var(--line); border-radius: 24px; padding: 28px 24px; direction: ltr; text-align: left; }
.doc h1 { font-size: clamp(30px, 5vw, 40px); line-height: 1.15; letter-spacing: -.02em; font-weight: 600; margin: 0 0 12px; }
.doc h2 { font-size: 21px; font-weight: 600; margin: 30px 0 8px; } .doc h3 { font-size: 17px; font-weight: 600; margin: 18px 0 6px; }
.doc p { white-space: pre-line; margin: 0 0 12px; } .doc .meta { color: var(--sub); font-size: 15px; } .doc li { margin-bottom: 6px; }
.note { background: var(--soft); border-radius: 14px; padding: 12px 14px; color: var(--sub); font-size: 15px; margin-bottom: 14px; }
details { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 16px 20px; margin-bottom: 10px; }
summary { cursor: pointer; font-weight: 600; } details p { color: var(--sub); margin: 10px 0 0; }
.mail { font-size: clamp(20px, 4vw, 26px); font-weight: 600; text-decoration: none; word-break: break-all; }
`;

// Picks Arabic or English from the last choice or the phone's language; the button switches
const LANG_JS = `<script>
(function(){var h=document.documentElement,k='fakka-lang',l;try{l=localStorage.getItem(k)}catch(e){}
if(!l)l=(navigator.language||'').slice(0,2)==='ar'?'ar':'en';
function set(x){h.lang=x;h.dir=x==='ar'?'rtl':'ltr';try{localStorage.setItem(k,x)}catch(e){}}
set(l);window.fakkaLang=function(){set(h.lang==='ar'?'en':'ar')};})();
</script>`;

type Page = { path: string; title: string; description: string; body: string; nav?: string; bilingual?: boolean };

const page = ({ path, title, description, body, nav, bilingual = true }: Page) => `<!doctype html>
<html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="https://${DOMAIN}${path}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://${DOMAIN}${path}"><meta property="og:type" content="website">
<meta name="theme-color" content="#2B3BFF">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${CSS}</style>
${bilingual ? LANG_JS : ''}
</head><body>
<header><div class="wrap">
  <a class="brand" href="/">${logo(34)}<span>${bilingual ? b(NAME, NAME_AR) : NAME}</span></a>
  <nav aria-label="Main">
    <a href="/support/"${nav === 'support' ? ' aria-current="page"' : ''}>${bilingual ? b('Support', 'الدعم') : 'Support'}</a>
    <a class="hide-sm" href="/privacy/"${nav === 'privacy' ? ' aria-current="page"' : ''}>${bilingual ? b('Privacy', 'الخصوصية') : 'Privacy'}</a>
    <a class="hide-sm" href="/terms/"${nav === 'terms' ? ' aria-current="page"' : ''}>${bilingual ? b('Terms', 'الشروط') : 'Terms'}</a>
    ${bilingual ? `<button class="lang" type="button" onclick="fakkaLang()">${b('العربية', 'English')}</button>` : ''}
  </nav>
</div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">
  <div class="row">
    <span>© ${YEAR} ${OWNER}. ${bilingual ? b(`${NAME} is a personal finance tracker, not a bank or financial adviser.`, `${NAME_AR} تطبيق لمتابعة فلوسك، مش بنك ولا مستشار مالي.`) : `${NAME} is a personal finance tracker, not a bank or financial adviser.`}</span>
    <span><a href="/privacy/">Privacy Policy</a> · <a href="/terms/">Terms of Service</a> · <a href="/delete-account/">Delete account</a> · <a href="mailto:${EMAIL}">${EMAIL}</a></span>
  </div>
</div></footer>
</body></html>
`;

// Line icons in the style of the app's Ionicons
const svg = (d: string) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  calendar: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  bulb: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
  people: svg('<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15.5 14.2c3 .2 5.5 2.6 5.5 5.8"/>'),
  coins: svg('<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 18c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.6-2.4-2.9-5.5-3"/>'),
  chat: svg('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
};

// ---------- Home ----------
const features: [string, string, string, string, string][] = [
  [ICON.calendar, 'Installments & loans', 'الأقساط والقروض', 'Installment apps, bank loans and mortgages: see what is due, and when you will be debt-free.', 'تطبيقات التقسيط وقروض البنوك والتمويل العقاري: اعرف المستحق، وهتخلص إمتى.'],
  [ICON.bulb, 'Bills & reminders', 'الفواتير والتنبيهات', 'Electricity, internet, school fees. A reminder the day before and on the day.', 'الكهرباء والإنترنت والمدارس. تنبيه قبلها بيوم وفي يومها.'],
  [ICON.people, "Gam'eya", 'الجمعية', "Track your turn, what you have paid and what you will receive.", 'تابع دورك، ودفعت كام، وهتقبض كام.'],
  [ICON.coins, 'Gold & savings', 'الدهب والادخار', 'Gold 21K and 24K, dollars and euros, valued at today\'s prices.', 'دهب 21 و24 والدولار واليورو، بأسعار النهارده.'],
  [ICON.chat, 'Bank messages, logged for you', 'رسائل البنك بتتسجل لوحدها', 'On iPhone, turn on automatic logging and card payments add themselves.', 'على الآيفون، شغّل التسجيل التلقائي ومدفوعات الكارت بتضاف لوحدها.'],
  [ICON.chart, 'Financial Health Score', 'مؤشر صحتك المالية', 'One number each month that shows how you are doing, and what to improve.', 'رقم واحد كل شهر يوريك ماشي إزاي، وتحسّن إيه.'],
];

write('index.html', page({
  path: '/', title: `${NAME} · Your money, made simple`,
  description: `${NAME} (${NAME_AR}) tracks your installments, bills, gam'eya, gold and savings in one calm place. Made for Egypt.`,
  body: `
<div class="hero">
  ${logo(112)}
  <h1>${b('Know where every<br>pound goes', 'اعرف كل جنيه<br>بيروح فين')}</h1>
  <p>${b("Installments, bills, gam'eya, gold and savings, all in one calm place. Made for Egypt.", 'الأقساط والفواتير والجمعيات والدهب والادخار، كلها في مكان واحد هادي. معمول لمصر.')}</p>
  <span class="pill">${b('Coming soon on iPhone', 'قريباً على الآيفون')}</span>
  <span class="small">${b('Questions?', 'عندك سؤال؟')} <a href="mailto:${EMAIL}">${EMAIL}</a></span>
</div>
<section>
  <h2 class="section">${b('Everything you pay, in one place', 'كل اللي بتدفعه، في مكان واحد')}</h2>
  <div class="grid">
    ${features.map(([icon, en, ar, pen, par]) => `<div class="card"><div class="icon" aria-hidden="true">${icon}</div><h3>${b(en, ar)}</h3><p>${b(pen, par)}</p></div>`).join('\n    ')}
  </div>
</section>
<section>
  <div class="band">
    <h2>${b('Private by design', 'خصوصيتك أولاً')}</h2>
    <ul>
      <li>${b('Lock it with Face ID or your fingerprint', 'اقفله بـ Face ID أو البصمة')}</li>
      <li>${b('Use it as a guest: nothing leaves your phone', 'استخدمه كضيف: مفيش حاجة بتخرج من موبايلك')}</li>
      <li>${b('No ads, no tracking, and we never sell your data', 'من غير إعلانات ولا تتبع، وعمرنا ما بنبيع بياناتك')}</li>
      <li>${b('Never asks for your bank or card passwords', 'عمره ما بيطلب باسورد البنك أو الكارت')}</li>
      <li>${b('Delete your account any time, right in the app', 'امسح حسابك في أي وقت من جوه التطبيق')}</li>
      <li>${b('Your account data can only be read by you', 'بيانات حسابك محدش يقدر يشوفها غيرك')}</li>
    </ul>
  </div>
</section>`,
}));

// ---------- Support ----------
const faqs: [string, string, string, string][] = [
  ['How do I delete my account?', 'إزاي أمسح حسابي؟',
    `In the app: Profile → Settings → Legal & Privacy → Delete account. It deletes your account and all your data for good. Can't open the app? See <a href="/delete-account/">Delete your account</a>.`,
    `من التطبيق: حسابي ← الإعدادات ← القانوني والخصوصية ← امسح الحساب. بيمسح حسابك وكل بياناتك نهائياً. مش قادر تفتح التطبيق؟ شوف <a href="/delete-account/">مسح الحساب</a>.`],
  ['I forgot my password', 'نسيت الباسورد',
    `Email us from the address you signed up with and we will help you get back in.`,
    `ابعتلنا إيميل من نفس الإيميل اللي سجلت بيه وهنساعدك ترجع لحسابك.`],
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
<div class="doc">
  <h1 style="font-size:clamp(32px,5vw,44px);letter-spacing:-.02em;font-weight:600;margin:0 0 8px">${b('How can we help?', 'نقدر نساعدك إزاي؟')}</h1>
  <div class="card" style="margin:18px 0 26px">
    <p style="margin:0 0 6px">${b('Email us and we will get back to you as soon as we can.', 'ابعتلنا إيميل وهنرد عليك في أقرب وقت.')}</p>
    <a class="mail" href="mailto:${EMAIL}">${EMAIL}</a>
  </div>
  <h2 class="section" style="font-size:24px">${b('Common questions', 'أسئلة شائعة')}</h2>
  ${faqs.map(([qe, qa, ae, aa]) => `<details><summary>${b(qe, qa)}</summary><p>${b(ae, aa)}</p></details>`).join('\n  ')}
</div>`,
}));

// ---------- Privacy Policy & Terms (English; the English text is the one that applies) ----------
function legal(key: LegalDocKey, path: string) {
  const d = LEGAL_DOCS[key];
  let html = `<h1>${esc(d.title)}</h1>`;
  let list = false;
  blocks(d.body.split('Fakka').join(NAME)).forEach((x, i) => {
    if (x.kind !== 'li' && list) { html += '</ul>'; list = false; }
    if (x.kind === 'li' && !list) { html += '<ul>'; list = true; }
    const text = esc(x.text).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, m => `<a href="mailto:${m}">${m}</a>`).replace(/https:\/\/[^\s<]+/g, m => `<a href="${m}">${m}</a>`);
    html += x.kind === 'h2' ? `<h2>${text}</h2>` : x.kind === 'h3' ? `<h3>${text}</h3>` : x.kind === 'li' ? `<li>${text}</li>` : `<p${i === 0 ? ' class="meta"' : ''}>${text}</p>`;
  });
  if (list) html += '</ul>';
  write(`${path}/index.html`, page({
    path: `/${path}/`, nav: path, bilingual: false, title: `${d.title} · ${NAME}`,
    description: `${NAME} ${d.title}.`, body: `<div class="doc"><article>${html}</article></div>`,
  }));
}
legal('privacy', 'privacy');
legal('terms', 'terms');

// ---------- Delete your account (Google Play asks for this page) ----------
write('delete-account/index.html', page({
  path: '/delete-account/', title: `Delete your account · ${NAME}`,
  description: `How to delete your ${NAME} account and data, and what gets deleted.`,
  body: `
<div class="doc"><article>
<div data-l="ar" dir="rtl" style="text-align:right" class="note">من التطبيق: حسابي ← الإعدادات ← القانوني والخصوصية ← امسح الحساب. مش قادر تفتح التطبيق؟ ابعت لـ ${EMAIL} من الإيميل المسجل بيه حسابك. التفاصيل الكاملة بالإنجليزي تحت.</div>
<h1>Delete your ${NAME} account</h1>
<p>${NAME} is developed by ${OWNER}. You can delete your account and all data linked to it at any time.</p>
<h2>In the app</h2>
<ul><li>Open ${NAME} and sign in.</li><li>Go to Profile → Settings → Legal &amp; Privacy → Delete account.</li>
<li>Confirm with your password (email accounts) or by typing DELETE (Google accounts).</li></ul>
<p>Your account is deleted straight away and you return to the sign-in screen.</p>
<h2>Without the app</h2>
<p>Email <a href="mailto:${EMAIL}?subject=Delete%20my%20${NAME}%20account">${EMAIL}</a> from the email address linked to your account and ask us to delete it. We may ask you to confirm that the account is yours, and we will act on it within 30 days.</p>
<h2>What is deleted</h2>
<ul><li>Your sign-in account (email, or the Google account link).</li>
<li>All financial information synced to your account: income, spending, installments, loans, bills, gam'eya, savings, goals, price alerts, shop categories and scores.</li>
<li>Bank-message transactions waiting in your inbox and your message-forwarding key.</li>
<li>Your shop category votes and your Terms / Privacy acceptance records.</li></ul>
<h2>What may be kept</h2>
<p>Deleted data may remain in encrypted backups held by our hosting provider for up to [BACKUP RETENTION PERIOD] before being overwritten. Aggregated shop category suggestions that no longer identify you may remain. We keep nothing else, unless the law requires it.</p>
<p>See our <a href="/privacy/">Privacy Policy</a> for details.</p>
</article></div>`,
}));

// ---------- 404 ----------
write('404.html', page({
  path: '/404.html', title: `Page not found · ${NAME}`, description: 'Page not found.',
  body: `<div class="hero">${logo(90)}<h1 style="font-size:40px">${b('Page not found', 'الصفحة مش موجودة')}</h1><p><a href="/">${b('Back to the home page', 'ارجع للرئيسية')}</a></p></div>`,
}));

writeFileSync(new URL('favicon.svg', root), favicon);
writeFileSync(new URL('CNAME', root), `${DOMAIN}\n`); // GitHub Pages custom domain (ignored by other hosts)
writeFileSync(new URL('robots.txt', root), `User-agent: *\nAllow: /\nSitemap: https://${DOMAIN}/sitemap.xml\n`);
writeFileSync(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', '/support/', '/privacy/', '/terms/', '/delete-account/'].map(p => `  <url><loc>https://${DOMAIN}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built website/ for ${DOMAIN}`);
