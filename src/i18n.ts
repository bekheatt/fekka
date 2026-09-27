// Simple translation: English text is the key, Arabic is looked up here.
let lang: 'en' | 'ar' = 'en';
export const setLang = (l: 'en' | 'ar') => { lang = l; };
export const getLang = () => lang;
export const locale = () => (lang === 'ar' ? 'ar-EG' : 'en-GB');

export function t(s: string, v?: Record<string, string | number>) {
  let out = lang === 'ar' ? AR[s] ?? s : s;
  if (v) for (const k in v) out = out.split(`{${k}}`).join(String(v[k]));
  return out;
}

const AR: Record<string, string> = {
  // tabs & titles
  'Home': 'الرئيسية', 'Spend': 'المصاريف', 'Pay': 'المدفوعات', 'Save': 'الادخار', 'Profile': 'حسابي', 'Settings': 'الإعدادات',
  'Spending': 'المصاريف', 'Payments': 'المدفوعات', 'Savings': 'الادخار',
  // greetings
  'Good morning': 'صباح الخير', 'Good afternoon': 'مساء الخير', 'Good evening': 'مساء الخير',
  // dashboard
  "What you're worth": 'صافي ثروتك', 'Everything you own minus everything you owe': 'كل ما تملكه ناقص كل ما عليك',
  'You own': 'تملك', 'You owe': 'عليك', 'Expense': 'مصروف', 'Income': 'دخل', 'Payment': 'قسط', 'Goal': 'هدف',
  'Get started': 'ابدأ من هنا', 'Add your salary': 'أضف مرتبك', 'So Fakka knows your monthly budget': 'علشان فكّة تعرف ميزانيتك الشهرية',
  'Add installments & bills': 'أضف الأقساط والفواتير', 'valU, Souhoola, electricity, internet…': 'فاليو، سهولة، الكهرباء، الإنترنت…',
  'Set a savings goal': 'حدد هدف ادخار', 'Wedding, car, Sahel summer…': 'فرح، عربية، صيف الساحل…',
  'This month': 'الشهر ده', 'You still have': 'لسه معاك', "You're over budget by": 'تعديت الميزانية بـ',
  'out of {x} income': 'من دخل {x}', 'Installments': 'الأقساط', 'Loans': 'القروض', 'Bills': 'الفواتير', "Gam'eya": 'الجمعية',
  'Spent': 'اتصرف', 'Left': 'الباقي', 'Monthly payments': 'مدفوعات شهرية', 'Next payments': 'المدفوعات الجاية', 'See all': 'عرض الكل',
  'No payments added yet': 'لا توجد مدفوعات بعد', 'Where your money went': 'فلوسك راحت فين', 'Details': 'التفاصيل',
  'Your goals': 'أهدافك', 'due today': 'مستحق النهارده', 'due tomorrow': 'مستحق بكرة', 'due in {n} days': 'مستحق بعد {n} يوم',
  'Paid': 'مدفوع', 'paid': 'مدفوع',
  // spending
  'Track what comes in and goes out': 'تابع الداخل والخارج', 'Today': 'النهارده', 'Tap to add a spend': 'اضغط لإضافة مصروف',
  'Monthly income': 'الدخل الشهري', '+ Add': '+ إضافة', 'Add': 'إضافة', 'Add your salary or any monthly income': 'أضف مرتبك أو أي دخل شهري',
  'Add income': 'أضف دخل', 'Every month': 'كل شهر', 'Recent spending': 'آخر المصاريف',
  'Nothing yet. Tap a category above to log your first spend.': 'لسه مفيش. اضغط على فئة فوق لتسجيل أول مصروف.',
  'Tip: swipe left on any item to delete it': 'نصيحة: اسحب أي عنصر لليسار لحذفه',
  'New expense': 'مصروف جديد', 'Category': 'الفئة', 'How much? (L.E)': 'المبلغ؟ (ج.م)', 'Note (optional)': 'ملاحظة (اختياري)',
  'e.g. Koshary, Uber, electricity': 'مثلاً كشري، أوبر، كهرباء', 'New income': 'دخل جديد', 'Where does it come from?': 'مصدره إيه؟',
  'Salary': 'المرتب', 'Monthly amount (L.E)': 'المبلغ الشهري (ج.م)',
  'Food': 'أكل', 'Transport': 'مواصلات', 'Shopping': 'تسوق', 'Health': 'صحة', 'Fun': 'خروجات', 'Other': 'أخرى',
  // payments
  'Installments, loans, bills and gam\'eya': 'الأقساط والقروض والفواتير والجمعيات', 'You pay every month': 'بتدفع كل شهر',
  'Due this month': 'مستحق الشهر ده', 'Tap the circle when you pay': 'اضغط على الدائرة لما تدفع',
  'All paid this month 🎉': 'كله مدفوع الشهر ده 🎉', 'Nothing due yet': 'مفيش مستحقات لسه',
  'Installment': 'قسط', 'Loan': 'قرض', 'Bill': 'فاتورة',
  'Installment apps': 'تطبيقات التقسيط', 'valU, Souhoola, Klivvr, Sympl, Contact, Aman…': 'فاليو، سهولة، كليفر، سيمبل، كونتكت، أمان…',
  'Mortgage, car loan, personal loan or credit card': 'تمويل عقاري، قرض عربية، قرض شخصي أو كارت ائتمان',
  'Electricity, gas, water, internet, mobile, school…': 'كهرباء، غاز، مياه، إنترنت، موبايل، مدارس…',
  '{n} months left': 'باقي {n} شهر', 'Paid off 🎉': 'خلص 🎉', 'day {n}': 'يوم {n}', '{x} left': 'باقي {x}',
  'New installment': 'قسط جديد', 'Which app?': 'أنهي تطبيق؟', 'What did you buy?': 'اشتريت إيه؟', 'e.g. iPhone, fridge, course': 'مثلاً موبايل، تلاجة، كورس',
  'Months left': 'الشهور الباقية', 'Pay on which day of the month?': 'بتدفع يوم كام في الشهر؟',
  "We'll remind you before it's due": 'هنفكرك قبل الميعاد', 'New loan': 'قرض جديد', 'Type of loan': 'نوع القرض', 'Bank': 'البنك',
  'e.g. NBE, CIB, Banque Misr': 'مثلاً الأهلي، CIB، بنك مصر', 'Monthly payment (L.E)': 'القسط الشهري (ج.م)',
  'How much is left to pay? (L.E)': 'باقي كام؟ (ج.م)',
  // mortgage as an asset
  'Nickname': 'اسم مميز', 'Or type your own': 'أو اكتب اسم من عندك', 'e.g. Sahel chalet': 'مثلاً شاليه الساحل',
  'Primary home': 'البيت الأساسي', 'Sahel chalet': 'شاليه الساحل', 'Rental apartment': 'شقة للإيجار', 'Family house': 'بيت العيلة',
  'Apartment price (L.E)': 'سعر الشقة (ج.م)', 'How much have you paid so far? (L.E)': 'دفعت كام لحد دلوقتي؟ (ج.م)',
  'How much do you still owe? (L.E)': 'لسه عليك كام؟ (ج.م)', 'You own {x} of {y}': 'تملك {x} من {y}',
  'This counts in what you own and grows every time you mark a payment as paid.': 'ده بيتحسب في اللي تملكه وبيزيد كل ما تعلّم على قسط إنه اتدفع.', 'New bill': 'فاتورة جديدة', 'Type of bill': 'نوع الفاتورة',
  'Name (optional)': 'الاسم (اختياري)', 'e.g. WE home internet': 'مثلاً إنترنت WE', 'Usual amount (L.E)': 'المبلغ المعتاد (ج.م)',
  'Mortgage': 'تمويل عقاري', 'Car Loan': 'قرض عربية', 'Personal': 'قرض شخصي', 'Credit Card': 'كارت ائتمان',
  'Electricity': 'كهرباء', 'Gas': 'غاز', 'Water': 'مياه', 'Internet': 'إنترنت', 'Mobile': 'موبايل', 'School': 'مدارس', 'Rent': 'إيجار', 'Club': 'النادي',
  // gam'eya
  "Add gam'eya": 'أضف جمعية', "New gam'eya": 'جمعية جديدة', "Track your gam'eya: who pays, when it's your turn": 'تابع جمعيتك: الدفع وميعاد دورك',
  'Name': 'الاسم', "e.g. Office gam'eya": 'مثلاً جمعية الشغل', 'Monthly share (L.E)': 'القسط الشهري (ج.م)',
  'Number of members': 'عدد الأعضاء', 'Your turn (number)': 'رقم دورك', 'First month': 'أول شهر',
  'Format: YYYY-MM, e.g. 2026-09': 'بالشكل: سنة-شهر، مثلاً 2026-09', 'Pay day of the month': 'يوم الدفع في الشهر',
  'Month {r} of {n}': 'شهر {r} من {n}', "It's your turn this month! You get {x}": 'دورك الشهر ده! هتقبض {x}',
  'Your turn in {n} months · {x}': 'دورك بعد {n} شهر · {x}', 'You received {x}': 'قبضت {x}', 'Finished ✓': 'خلصت ✓',
  'Not started yet': 'لسه مبدأتش',
  // savings
  'Gold, foreign currency and more': 'دهب وعملات أجنبية وأكتر', 'All your savings are worth': 'قيمة كل مدخراتك',
  'Savings goals': 'أهداف الادخار', 'What you have': 'اللي معاك',
  'Add your gold, dollars, euros, cash — or anything else you save': 'أضف دهبك، دولاراتك، يوروهاتك، الكاش — أو أي حاجة بتدخرها',
  'Add savings': 'أضف مدخرات', "Today's prices in L.E": 'أسعار النهارده بالجنيه', 'Updating prices…': 'بنحدث الأسعار…',
  "Couldn't update — showing last saved prices": 'مقدرناش نحدث — دي آخر أسعار محفوظة', 'Live prices · updated {x}': 'أسعار مباشرة · آخر تحديث {x}',
  'Prices not updated yet': 'الأسعار لسه متحدثتش', 'price of 1 gram': 'سعر الجرام', 'price of 1 {u}': 'سعر 1 {u}',
  'Prices update automatically when you open the app. Gold is the world price — shop prices in Egypt can differ a little, so you can tap any price to adjust it.':
    'الأسعار بتتحدث لوحدها لما تفتح التطبيق. سعر الدهب عالمي — سعر المحلات في مصر ممكن يختلف شوية، فتقدر تضغط على أي سعر وتعدله.',
  'What type?': 'النوع؟', 'Other…': 'حاجة تانية…', 'What is it?': 'إيه هي؟', "e.g. Silver, stocks, car": 'مثلاً فضة، أسهم، عربية',
  'Total value (L.E)': 'القيمة الكلية (ج.م)', 'Or enter a quantity here and a price per unit below': 'أو اكتب الكمية هنا وسعر الوحدة تحت',
  'Price per unit in L.E (optional)': 'سعر الوحدة بالجنيه (اختياري)', 'Leave empty if you entered the total': 'سيبه فاضي لو كتبت القيمة الكلية',
  '≈ {x} in total': '≈ {x} إجمالي', "≈ {x} at today's price": "≈ {x} بسعر النهارده", 'How much? ({u})': 'الكمية؟ ({u})',
  'Your own savings': 'مدخرات خاصة', 'Cash / bank': 'كاش / بنك', '{n} grams': '{n} جرام',
  'Gold 21K': 'دهب عيار 21', 'Gold 24K': 'دهب عيار 24', 'US Dollar': 'دولار أمريكي', 'Euro': 'يورو', 'Cash / Bank': 'كاش / بنك',
  'grams': 'جرام', 'USD': 'دولار', 'EUR': 'يورو', 'L.E': 'ج.م',
  // goals
  'New goal': 'هدف جديد', 'Add goal': 'أضف هدف', 'Save for a wedding, car, trip or Umrah — in pounds, gold or dollars':
    'ادخر لفرح، عربية، سفرية أو عمرة — بالجنيه أو الدهب أو الدولار',
  "What are you saving for?": 'بتحوش لإيه؟', 'e.g. Wedding, Car, Umrah': 'مثلاً فرح، عربية، عمرة', 'Save in': 'الادخار بـ',
  'Target ({u})': 'المستهدف ({u})', 'Already saved ({u})': 'اللي اتحوش ({u})', 'Deadline (optional)': 'الميعاد (اختياري)',
  '{p}% · {x} to go': '{p}% · باقي {x}', 'Goal reached 🎉': 'وصلت للهدف 🎉', 'Save {x}/month to reach it by {d}': 'حوّش {x} في الشهر علشان توصل قبل {d}',
  'Add money': 'أضف فلوس', 'Add to "{g}"': 'أضف لـ "{g}"', 'Amount ({u})': 'المبلغ ({u})', 'Icon': 'الأيقونة',
  // profile
  'Your money at a glance': 'فلوسك في لمحة', 'Tap to add your name': 'اضغط لإضافة اسمك', 'Member since {d}': 'عضو من {d}',
  'Net worth': 'صافي الثروة', 'Saved this month': 'اتحوش الشهر ده', 'Savings rate': 'نسبة الادخار', 'Debt-free in': 'هتخلص ديونك بعد',
  '{n} months': '{n} شهر', 'No debt 🎉': 'مفيش ديون 🎉', 'Your numbers': 'أرقامك', 'Expenses logged': 'مصاريف مسجلة',
  'Active installments': 'أقساط شغالة', 'Goals': 'الأهداف', 'Your name': 'اسمك',
  // settings
  'Personalise Fakka': 'خصص فكّة', 'Appearance': 'المظهر', 'Language': 'اللغة', 'Theme': 'الثيم', 'System': 'تلقائي', 'Light': 'فاتح', 'Dark': 'داكن',
  'Security': 'الأمان', 'Lock with Face ID / fingerprint': 'قفل بالوجه / البصمة', 'Ask every time you open Fakka': 'يطلبها كل ما تفتح فكّة', 'Locks the moment you leave the app, like a banking app': 'بيقفل أول ما تخرج من التطبيق، زي تطبيقات البنوك',
  'Notifications': 'الإشعارات', 'Payment reminders': 'تذكير بالمدفوعات', 'The day before and on the due day, at 10 AM': 'قبلها بيوم ويوم الميعاد، الساعة 10 الصبح',
  'Data': 'البيانات', 'Delete all data': 'مسح كل البيانات', 'This removes everything you entered. It cannot be undone.': 'هيمسح كل حاجة دخلتها. مينفعش ترجعها.',
  'Cancel': 'إلغاء', 'Delete': 'حذف', 'Save ': 'حفظ', 'About': 'عن التطبيق', 'Version': 'الإصدار', 'Made for Egypt 🇪🇬': 'معمول لمصر 🇪🇬',
  'Restart needed': 'محتاج إعادة تشغيل', 'Close Fakka and open it again to switch the layout direction.': 'اقفل فكّة وافتحها تاني علشان يتغير اتجاه الشاشة.',
  "Your device has no Face ID, fingerprint or passcode set up.": 'جهازك مفيهوش بصمة أو قفل.',
  'Notifications are off for Fakka in your phone settings.': 'الإشعارات مقفولة لفكّة في إعدادات موبايلك.',
  // lock
  'Fakka is locked': 'فكّة مقفولة', 'Unlock': 'افتح', 'Unlock Fakka': 'افتح فكّة',
  // notifications
  '{name} due tomorrow': '{name} مستحق بكرة', '{name} due today': '{name} مستحق النهارده', 'Payment of {x}': 'دفعة {x}',

  // onboarding
  'Welcome to Fakka': 'أهلاً بيك في فكّة', "Let's set up your money in 2 minutes. Everything stays on your phone.": 'يلا نظبط فلوسك في دقيقتين. كل حاجة بتفضل على موبايلك.',
  "Let's start": 'يلا نبدأ', 'Continue': 'كمّل', 'Skip': 'تخطي', 'Go to my dashboard': 'روح للوحة التحكم',
  'What should we call you?': 'نناديك بإيه؟', 'Just your first name is fine': 'اسمك الأول كفاية',
  'What do you do?': 'بتشتغل إيه؟', 'So Fakka asks the right questions': 'علشان فكّة تسأل الأسئلة الصح',
  'Employee': 'موظف', 'Fixed monthly salary': 'مرتب شهري ثابت', 'Freelancer': 'فريلانسر', 'Income changes month to month': 'الدخل بيتغير من شهر لشهر',
  'Business owner': 'صاحب بيزنس', 'Shop, company or trade': 'محل، شركة أو تجارة', 'Student': 'طالب', 'Allowance or part-time': 'مصروف أو شغل جزئي',
  'Retired': 'على المعاش', 'Pension': 'المعاش', 'Something else': 'حاجة تانية',
  'How much comes in?': 'بيدخلك كام؟',
  'Monthly salary after tax (L.E)': 'المرتب الشهري بعد الضرايب (ج.م)', 'What actually reaches your account': 'اللي بيوصل حسابك فعلاً',
  'Usual monthly income (L.E)': 'متوسط دخلك الشهري (ج.م)', 'Use a normal month. You can log each payment as it arrives later.': 'استخدم شهر عادي. تقدر تسجل كل دفعة لما توصل بعدين.',
  'What you take home each month (L.E)': 'اللي بتاخده لنفسك كل شهر (ج.م)', 'Your personal share of the profit, not the sales': 'نصيبك من الربح، مش المبيعات',
  'Monthly allowance (L.E)': 'المصروف الشهري (ج.م)', 'Pocket money, part-time job or scholarship': 'مصروف، شغل جزئي أو منحة',
  'Monthly pension (L.E)': 'المعاش الشهري (ج.م)', 'Include any regular support from family': 'ضيف أي مساعدة ثابتة من العيلة',
  'Monthly income (L.E)': 'الدخل الشهري (ج.م)', 'Roughly how much comes in every month': 'تقريباً بيدخلك كام كل شهر',
  'Freelance': 'فريلانس', 'Business': 'البيزنس', 'Allowance': 'المصروف',
  'Which day do you get paid?': 'بتقبض يوم كام؟', 'Any other monthly income? (optional)': 'أي دخل شهري تاني؟ (اختياري)',
  'e.g. Rent, side job': 'مثلاً إيجار، شغل جانبي', 'Other income': 'دخل تاني',
  'Do you pay any installments?': 'بتدفع أقساط؟', 'Tap the apps you use, then fill in the monthly amount': 'اختار التطبيقات اللي بتستخدمها واكتب القسط الشهري',
  'Monthly (L.E)': 'شهري (ج.م)', 'Any bank loans?': 'عندك قروض بنكية؟', 'Mortgage, car, personal loan or credit card': 'تمويل عقاري، عربية، قرض شخصي أو كارت ائتمان',
  'Left to pay (L.E)': 'الباقي (ج.م)', 'Your monthly bills': 'فواتيرك الشهرية', 'Tap the ones you pay and enter the usual amount': 'اختار اللي بتدفعها واكتب المبلغ المعتاد',
  "Are you in a gam'eya?": 'داخل جمعية؟', "Fakka tracks your payments and tells you when it's your turn": 'فكّة بتتابع دفعك وتقولك إمتى دورك',
  'Yes': 'أيوه', 'No': 'لأ', 'Members': 'الأعضاء', 'Your turn': 'دورك', 'Starting this month. You can change it later.': 'بتبدأ الشهر ده. تقدر تغيرها بعدين.',
  'What have you saved?': 'حوشت إيه؟', 'Fill in only what you have — we convert it to L.E with live prices': 'اكتب اللي عندك بس — هنحوله لجنيه بأسعار النهارده',
  'Cash / bank (L.E)': 'كاش / بنك (ج.م)', 'Gold 21K (grams)': 'دهب 21 (جرام)', 'Gold 24K (grams)': 'دهب 24 (جرام)', 'US Dollars': 'دولارات', 'Euros': 'يورو',
  'Saving for something?': 'بتحوش لحاجة؟', 'Pick one to start — you can add more later': 'اختار واحد للبداية — تقدر تضيف أكتر بعدين',
  'Emergency fund': 'فلوس الطوارئ', 'Wedding': 'فرح', 'Car': 'عربية', 'Umrah': 'عمرة', 'Travel': 'سفر',
  'Goal name': 'اسم الهدف', 'Target (L.E)': 'المستهدف (ج.م)',
  "You're all set, {n}!": 'كله جاهز يا {n}!', "You're all set!": 'كله جاهز!', "Here's your month at a glance": 'ده شهرك في لمحة',
  'Left for daily spending': 'الباقي للمصاريف اليومية', 'Log your daily spending on the Spend tab to see where it goes.': 'سجل مصاريفك اليومية في تاب المصاريف علشان تعرف فلوسك بتروح فين.',
  'Redo setup': 'إعادة الإعداد', 'Go through the welcome questions again': 'جاوب على أسئلة البداية تاني',
  // income types
  'Income this month': 'دخل الشهر ده', 'One-time': 'مرة واحدة', 'Payment received': 'دفعة وصلت',
  'A single payment: a freelance job, bonus or Eid money': 'دفعة واحدة: شغلانة فريلانس، بونص أو عيدية',
  'Salary, pension, rent — anything that comes every month': 'مرتب، معاش، إيجار — أي حاجة بتيجي كل شهر',
  'e.g. Logo design for client': 'مثلاً تصميم لوجو لعميل', 'Amount (L.E)': 'المبلغ (ج.م)',
  // editing
  'Edit expense': 'تعديل مصروف', 'Edit income': 'تعديل دخل', 'Edit installment': 'تعديل قسط', 'Edit bill': 'تعديل فاتورة',
  "Edit gam'eya": 'تعديل جمعية', 'Edit loan': 'تعديل قرض', 'Edit savings': 'تعديل مدخرات', 'Edit goal': 'تعديل الهدف',
  'Tip: tap an item to edit it, swipe left to delete': 'نصيحة: اضغط على أي عنصر لتعديله، واسحبه لليسار لحذفه',
  'Take out': 'سحب', 'Add to goal': 'أضف للهدف', 'of {x}': 'من {x}', 'New total: {x}': 'الإجمالي الجديد: {x}', 'History': 'السجل', '+ / −': '+ / −',
  // privacy, quick add, receipts, alerts
  'Hide amounts': 'إخفاء المبالغ', 'Show ••••• instead of numbers. Tap the eye on Home to switch quickly.': 'يظهر ••••• بدل الأرقام. اضغط على العين في الرئيسية للتبديل بسرعة.',
  'Quick expense': 'مصروف سريع', 'Save expense': 'احفظ المصروف',
  'Receipt (optional)': 'الإيصال (اختياري)', 'Take photo': 'صوّر', 'From photos': 'من الصور', 'Remove receipt': 'احذف الإيصال',
  'Price alerts': 'تنبيهات الأسعار', 'Get a notification when gold or the dollar hits your price': 'يوصلك إشعار لما الدهب أو الدولار يوصل للسعر اللي عايزه',
  'Add alert': 'أضف تنبيه', 'New price alert': 'تنبيه سعر جديد', 'What to watch': 'تراقب إيه',
  'Goes above': 'يطلع فوق', 'Drops below': 'ينزل تحت', 'Price in L.E': 'السعر بالجنيه', 'Now: {x}': 'دلوقتي: {x}',
  '{k} above {p}': '{k} فوق {p}', '{k} below {p}': '{k} تحت {p}', '{k} is above {p}': '{k} بقى فوق {p}', '{k} is below {p}': '{k} نزل تحت {p}',
  'Watching · now {x}': 'بنراقب · دلوقتي {x}', 'Reached on {d} · tap to watch again': 'وصل يوم {d} · اضغط للمراقبة تاني',
  'Fakka checks prices whenever you open the app. Checking in the background comes with the App Store version.': 'فكّة بتشيك الأسعار كل ما تفتح التطبيق. الفحص في الخلفية هييجي مع نسخة الـ App Store.',
  // misc
  'Language, theme, Face ID, reminders': 'اللغة، الثيم، البصمة، التذكيرات',
  'Every pound, in its place.': 'كل جنيه في مكانه.',
};
