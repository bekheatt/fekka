// Built-in list of common Egyptian shops and services → category, matched against the shop name in a bank SMS.
// Order matters: the first category that matches wins (e.g. "Vodafone Cash" is skipped by Bills, "apple.com/bill" is Fun).
// Add new shops to the right line; \b keeps short names from matching inside other words.

const RULES: [string, RegExp][] = [
  ['Food', new RegExp([
    // restaurants and fast food
    'ibn ?al ?sham', 'ابن الشام', "mo'?men", 'مؤمن', 'cook ?door', 'كوك دور', 'buffalo ?burger', 'zooba', 'زوبا',
    'abou ?tarek', 'abu ?tarek', 'ابو طارق', '\\bgad\\b', 'جاد', 'bazooka', 'بازوكا', 'el ?shabrawy', 'shabrawi', 'شبراوي',
    'felfela', 'koshary', 'كشري', 'el ?tahrir', 'hadramout', 'hadramot', 'حضرموت', 'kasr ?el ?asafra', 'asafra', 'عصفرة',
    'wahmy', 'وهمي', 'maison ?thomas', 'primos', 'sachi', 'peking', 'smash', 'fuddruckers', 'chili.?s', '\\btgi',
    '\\bkfc\\b', 'mcdonald', 'hardee', 'burger ?king', 'pizza ?hut', 'domino', 'papa ?john', 'little ?caesar',
    '\\bsubway\\b', "wendy'?s", 'popeyes', 'texas ?chicken', 'shawarma', 'شاورما', 'restaurant', 'مطعم', 'grill', 'burger', 'pizza',
    // cafés, bakeries and desserts
    'starbucks', '\\bcosta\\b', 'cilantro', "beano'?s", 'tabali', 'espresso ?lab', '\\btbs\\b', 'cinnabon', 'dunkin', 'krispy',
    'mandarine', 'koueider', 'el ?abd', 'العبد', 'tseppas', 'la ?poire', 'breadway', '\\bcafe\\b', 'café', 'coffee', 'كافيه', 'bakery', 'مخبز', 'حلواني',
    // groceries and supermarkets
    'carrefour', 'كارفور', 'spinneys', 'سبينس', 'seoudi', 'سعودي', 'metro ?mar', 'kazyon', 'كازيون', 'gourmet', '\\boscar\\b',
    'hyper ?one', 'hyperone', '\\bhyper\\b', 'kheir ?zaman', 'خير زمان', 'awlad ?ragab', 'اولاد رجب', 'fathalla', 'فتح الله',
    '\\blulu\\b', 'el ?mahlawy', 'supermarket', 'سوبر ماركت', 'ماركت', 'بقاله', 'grocery',
    // food delivery
    'talabat', 'طلبات', 'elmenus', 'breadfast', 'بريدفاست', 'instashop', '\\brabbit\\b', 'mrsool',
  ].join('|'), 'i')],
  ['Transport', new RegExp([
    '\\buber\\b', 'careem', 'didi', 'indrive', 'in ?drive', '\\bswvl\\b', '\\bbolt\\b', 'taxi', 'تاكسي',
    'wataniya', 'watanya', 'وطنية', 'chill ?out', 'misr ?petroleum', 'مصر للبترول', '\\bmobil\\b', '\\bshell\\b', 'total ?energies',
    'emarat ?misr', 'gas ?station', 'petrol', 'fuel', 'بنزين', 'وقود', 'parking', 'موقف', '\\btoll\\b', 'cairo ?metro', 'go ?bus', 'blue ?bus',
    'egypt ?air', 'مصر للطيران', 'air ?cairo', 'nile ?air', 'airline', 'airways',
  ].join('|'), 'i')],
  ['Fun', new RegExp([
    'netflix', 'spotify', 'anghami', 'انغامي', 'shahid', 'شاهد', '\\bosn\\b', 'watch ?it', 'yango ?play', 'youtube', 'google ?play',
    'apple\\.com/bill', 'itunes', 'app ?store', 'playstation', '\\bpsn\\b', 'sony ?interactive', 'steam', '\\bxbox\\b', 'nintendo',
    'cinema', 'سينما', '\\bvox\\b', 'imax', 'ticketsmarche', 'tazkarti', 'تذكرتي', 'kidzania', 'magic ?planet', 'bowling',
    '\\bgym\\b', 'fitness', "gold'?s ?gym", '\\bclub\\b', 'نادي', 'booking\\.com', 'airbnb', '\\bhotel\\b', 'فندق', 'hilton', 'marriott',
    'steigenberger', 'resort', 'aqua ?park',
  ].join('|'), 'i')],
  ['Bills', new RegExp([
    'vodafone(?! ?cash)', 'فودافون(?! كاش)', 'orange(?! ?(cash|money))', 'اورنج(?! كاش)', 'etisalat(?! ?cash)', '\\be&', '\\bwe\\b',
    'telecom ?egypt', 'المصرية للاتصالات', 'te ?data', 'fawry', 'فوري', 'electric', 'كهرباء', '\\beehc\\b', 'water', 'مياه',
    'natural ?gas', 'petrotrade', 'town ?gas', 'egypt ?gas', 'internet', 'انترنت', 'school', 'مدرس', 'tuition', 'university', 'جامعه',
    'insurance', 'تأمين', 'openai', 'chatgpt', 'anthropic', 'claude\\.ai', 'google ?one', 'icloud', 'adobe', 'canva', 'microsoft', 'oracle',
  ].join('|'), 'i')],
  ['Health', new RegExp([
    'pharma', 'صيدلي', 'el ?ezaby', 'ezaby', 'العزبي', '\\bseif\\b', 'سيف', 'misr ?pharmacies', '19011', 'roshdy', 'رشدي',
    'hospital', 'مستشفي', 'مستشفى', 'clinic', 'عياده', 'عيادة', 'alfa ?lab', 'al ?borg', 'البرج', 'mokhtabar', 'المختبر', '\\blab\\b', 'معمل',
    'dental', 'اسنان', 'doctor', 'دكتور', 'vezeeta', 'فيزيتا', 'cleopatra ?hosp', 'dar ?al ?fouad', 'dar ?el ?fouad', 'andalusia', 'saudi ?german',
  ].join('|'), 'i')],
  ['Shopping', new RegExp([
    'amazon', 'امازون', '\\bnoon\\b', 'نون', 'jumia', 'جوميا', 'shein', 'شي ان', '\\bzara\\b', 'h ?& ?m', 'lc ?waikiki', 'waikiki',
    'defacto', 'de ?facto', 'max ?fashion', 'town ?team', 'concrete', 'adidas', '\\bnike\\b', '\\bpuma\\b', 'skechers', 'bershka',
    'pull ?& ?bear', '\\bmango\\b', 'massimo', 'stradivarius', 'american ?eagle', 'cottonil', "o'?five", 'splash', 'centrepoint',
    'b\\.? ?tech', 'بي تك', '\\b2b\\b', '\\braya\\b', 'el ?araby', 'العربي', 'dubai ?phone', 'cairo ?sales', 'apple ?store', 'samsung',
    'ikea', 'home ?cent', 'in ?& ?out', 'virgin ?mega', 'diwan', 'ديوان', '\\bmall\\b', 'مول', 'city ?stars', 'cairo ?festival',
    'mall ?of ?egypt', 'mall ?of ?arabia', 'ملابس', 'fashion', 'store',
  ].join('|'), 'i')],
];

// Category for a shop name from the built-in list, or undefined if it isn't a known shop
export function dictionaryCategory(name: string): string | undefined {
  for (const [cat, re] of RULES) if (re.test(name)) return cat;
  return undefined;
}

// Shop name of an expense logged from a bank SMS. Older expenses only have the note ("Ibn Al Sham", "Netflix (USD 9.99)").
export const shopOf = (e: { shop?: string; src?: string; note: string }) =>
  e.shop ?? (e.src && e.note && !/^(Transfer|Money received|Cash withdrawal|Card payment|تحويل|فلوس وصلتك|سحب كاش|دفع بالكارت)/.test(e.note)
    ? e.note.replace(/ \([A-Z]{3} [\d.,]+\)$/, '') : undefined);

// Shop name → lookup key ("IBN AL SHAM", "Ibn Al-Sham" → "ibn al sham")
export const merchantKey = (party?: string) => (party ?? '').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();
