// Fakka's Privacy Policy and Terms of Service. One source for the in-app screens and fakkaeg.com
// (scripts/build-website.mts builds website/ from this file, so keep it free of imports).
//
// Format: "## " heading, "### " subheading, "- " bullet, blank line between paragraphs.
// Anything in [SQUARE BRACKETS] is a placeholder the owner still has to fill in.
//
// Changing either document in a way people should agree to again: bump its version below.
// Everyone is then asked to accept the new version the next time they open the app.

export const PRIVACY_VERSION = '2026-10-09';
export const TERMS_VERSION = '2026-10-09';

export type LegalDocKey = 'privacy' | 'terms';

const PRIVACY = `
Effective date: [EFFECTIVE DATE]
Version: ${PRIVACY_VERSION}

This Privacy Policy explains how Ahmed Hesham Bekheat ("we", "us", "our") collects, uses, stores, shares and protects personal information when you use the Fakka mobile application (the "App") and its related online services (together, the "Service"). It also explains the choices and rights you have.

Please read this Policy together with our Terms of Service. By creating an account, continuing as a guest, or otherwise using the Service after confirming that you accept this Policy, you acknowledge that you have read and understood it. If you do not agree, please do not use the Service.

## 1. Who we are

The Service is provided by Ahmed Hesham Bekheat, an independent developer based in Egypt (the "Controller"). References to "we", "us" and "our" in this Policy mean Ahmed Hesham Bekheat. We are responsible for deciding how and why your personal information is processed as described in this Policy.

For any privacy question or request, contact us at support@fakkaeg.com.

## 2. Summary

- Fakka is a personal finance tracker. You decide what to enter. We do not connect to your bank accounts and we never ask for card numbers, bank passwords or PINs.
- You can use Fakka as a guest. In guest mode your information stays on your device and is not sent to our servers.
- If you create an account, the financial information you enter is stored on our cloud database so it can be backed up and kept in step across your devices. Each account can only access its own data.
- We do not sell your personal information. We do not show ads, and we do not use third-party analytics or advertising trackers in the current version of the App.
- You can delete your account and your server-side data at any time from Settings → Legal & Privacy → Delete account.

## 3. Information we collect

### 3.1 Information you give us when you create an account

- Email sign-up: your email address and a password. Passwords are handled by our authentication provider and stored only in hashed form; we cannot see your password.
- Sign in with Google: your email address and your Google account identifier. Google may also share your name and profile picture address with our authentication provider; we do not use them in the App.
- Sign in with Apple (when offered): your Apple account identifier and the email address Apple shares with us, which may be a private relay address chosen by you.
- A record that you accepted our Terms of Service and this Privacy Policy: the version of each document, the date and time you accepted, the sign-in method, your device platform (iOS or Android) and the App version.

### 3.2 Information you enter in the App

The App works with the information you choose to type in. Depending on the features you use, this may include:

- Profile: the name you give yourself, your type of work (for example employee, freelancer or student) and the date you started using Fakka.
- Income: sources and amounts of income, pay day, one-off income and whether money arrived by transfer.
- Spending: expenses with amount, category, note, date and, for bank-message entries, the shop name.
- Installments: the installment provider (for example a buy-now-pay-later app), the item, the monthly amount, months left and due day.
- Loans: loan type, lender, monthly payment, remaining balance, due day and, for mortgages, a property nickname, price and amount paid.
- Bills: bill type, name, amount and due day.
- Gam'eya (rotating savings groups): name, monthly amount, number of members, your turn and start month.
- Savings and goals: savings held (for example gold, foreign currency or custom items) with quantities and prices, savings goals with targets, deadlines and progress.
- Price alerts: the gold or currency price at which you want to be notified.
- Payment status: which payments you marked as paid each month.
- Shop categories: the category you chose for a shop so future entries from that shop are sorted automatically.
- Scores: your monthly Financial Health Score and its parts, calculated on your device from the information above.
- Preferences: language, theme, colour, whether amounts are hidden, whether reminders are on, and similar settings.

Together we call this "Financial Information". It is information you provide about your own finances. It is not obtained from your bank.

### 3.3 Bank text messages (optional, iPhone only)

If you turn on Automatic logging (Settings → Bank messages), you can set up an Apple Shortcuts automation on your iPhone that forwards bank and wallet text messages to our server, using a personal link that contains a secret key. The App itself does not read your text messages and does not request SMS permissions on any platform.

When a message arrives at our server:

- It is read in memory to find a payment or income. The full text of the message is not saved.
- If it is a payment or income, we store only the extracted transaction: whether it is money in or out, the amount, the currency, the name of the shop or the other party as written by your bank (this can be a person's name for transfers), the payment channel (for example card, InstaPay, wallet, transfer or ATM) and the date.
- The transaction waits in a private inbox linked to your account until you open the App. It is then added to your records or discarded, and removed from the inbox. At most 300 transactions can wait at a time.
- Your secret key is stored only as a one-way cryptographic hash. You can reset or turn off the link at any time, which stops it working immediately.

Messages may contain information about people you transact with. Only forward messages you are entitled to share.

### 3.4 Shared shop categories

When you are signed in and choose a category for a shop that came from a card payment, we store that choice (a simplified version of the shop name, the category and your account identifier) so that the App can suggest the most common category for that shop to other users. Other users only ever see an aggregated result (a category and a vote count), only once at least two people agree, and never your identity. We never share people's names, phone or wallet numbers from transfers, InstaPay, wallet or ATM transactions in this way.

### 3.5 Information that stays on your device

- Receipt photos you take or attach are saved only inside the App's private storage on your device. They are not uploaded to our servers. Note that your device's own backup service (for example iCloud or Google backup) may include App data according to your device settings.
- Face ID, Touch ID, fingerprint or device passcode checks used for the App lock are performed entirely by your device's operating system. We never receive biometric information; the App only learns whether the check succeeded.
- Payment reminders are scheduled locally on your device. We do not collect push notification tokens.
- In guest mode, all Financial Information stays on your device.

### 3.6 Information collected automatically

- Service and security logs: when the App communicates with our servers, our hosting provider records technical information such as IP address, request time, the address requested, response status and device or browser type. These logs are used to operate, secure and troubleshoot the Service and are kept for a short period set by our hosting provider.
- Exchange rates and gold prices: to show current prices, the App requests public data directly from open.er-api.com and api.gold-api.com. These requests do not include your Financial Information or account details, but, like any internet request, they reveal your IP address and basic request information to those providers.

We do not use cookies, advertising identifiers, device fingerprinting, location data, contacts, or third-party analytics in the current version of the App.

## 4. Financial information

We understand that financial information is sensitive. We handle it as follows:

- We only process the Financial Information you choose to enter or forward, and only to provide the Service to you.
- We do not have access to your bank, card, wallet or installment accounts, and we cannot move money or make payments on your behalf.
- We do not use your Financial Information to make credit decisions, to profile you for marketing, or to sell or share with lenders, banks, data brokers or advertisers.
- Staff access to production data is limited to what is strictly necessary to operate, secure or support the Service (for example to investigate a fault you report), and is subject to confidentiality obligations.

## 5. How we use information

We use personal information only for these purposes:

- To provide the Service: creating and managing your account, storing your Financial Information, syncing it across your devices and showing you totals, scores and reminders.
- To process bank messages you forward, if you turn on Automatic logging.
- To suggest shop categories using aggregated choices from users.
- To keep the Service secure: preventing fraud and abuse, protecting accounts and investigating security incidents.
- To maintain and improve the Service: fixing errors and making the App work better.
- To communicate with you: responding to your requests and sending essential service messages such as email confirmation, password reset, or important changes to our Terms or this Policy.
- To comply with law: meeting legal obligations, responding to lawful requests from authorities and enforcing our Terms.
- To keep a record of your acceptance of our Terms and this Policy.

## 6. Legal bases for processing

Where the law requires a legal basis for processing, we rely on:

- Performance of a contract: to provide the Service you asked for under our Terms of Service.
- Consent: for optional features such as Automatic logging, and where the law requires consent for processing financial information. You may withdraw consent at any time by turning the feature off or deleting your account; this does not affect processing that took place before withdrawal.
- Legitimate interests: to keep the Service secure, prevent abuse, and improve the App, where these interests are not overridden by your rights.
- Legal obligation: where we must process or keep information to comply with the law.

Where Egyptian Personal Data Protection Law No. 151 of 2020 and its executive regulations apply, we process personal data in line with that law, including any requirements for consent, licensing or registration applicable to us.

## 7. How information is stored and secured

- Your account and the Financial Information you sync are stored with our database and authentication provider, Supabase, on servers located in the European Union (Frankfurt, Germany).
- Data is encrypted in transit between the App and our servers using TLS, and is encrypted at rest by our hosting provider.
- Our database enforces row-level security: each signed-in account can only read and change its own records. Requests without a valid sign-in cannot read any personal records.
- Personal keys for bank message forwarding are stored only as one-way hashes.
- You can protect the App with Face ID, fingerprint or your device passcode, hide amounts on screen, and the App hides its content in the app switcher.

No method of transmission or storage is completely secure. While we use reasonable administrative, technical and organisational measures to protect your information, we cannot guarantee absolute security. Please keep your device, email account and password secure, and contact us immediately if you believe your account has been compromised.

## 8. Third-party service providers

We share personal information only with service providers that help us run the Service, under contracts that require them to protect it and use it only on our instructions, and only to the extent needed:

- Supabase Inc. (authentication, database and server functions; data hosted on Amazon Web Services in the EU). Supabase processes your account details, Financial Information you sync, forwarded bank-message transactions, consent records and service logs.
- Google LLC, if you choose Sign in with Google. Google's handling of your Google account data is governed by Google's privacy policy.
- Apple Inc., if you choose Sign in with Apple (when offered) or use Apple Shortcuts to forward messages. Apple's handling of that data is governed by Apple's privacy policy.
- open.er-api.com and api.gold-api.com, which receive anonymous price requests from your device as described in section 3.6.
- Apple App Store and Google Play, which handle App downloads, updates and any purchases under their own terms and privacy policies.

We may also disclose information:

- If required by law, regulation, court order or a lawful request by public authorities.
- To protect the rights, property or safety of our users, the public or us, including to prevent fraud or abuse.
- If the Service is transferred to a company we set up to run it, or in connection with a merger, acquisition, financing or sale of all or part of the Service, in which case the recipient must honour this Policy or notify you of changes.
- With your explicit consent or at your direction.

We do not sell personal information, and we do not share it for cross-context behavioural advertising.

## 9. Data retention

- Account and Financial Information: kept for as long as your account exists. When you delete your account, it is deleted from our primary database immediately.
- Bank-message inbox: each transaction is removed as soon as you review it in the App, and is deleted with your account.
- Shop category choices: kept while your account exists and deleted with your account. Aggregated category suggestions that no longer identify you may remain.
- Consent records: kept while your account exists and deleted with your account, unless we must keep them longer to comply with the law or to establish, exercise or defend legal claims.
- Backups: deleted data may persist in encrypted backups held by our hosting provider for up to [BACKUP RETENTION PERIOD] before being permanently overwritten. Backups are not used for any other purpose.
- Service logs: kept for a short period set by our hosting provider for security and troubleshooting.
- Guest mode and on-device data: stays on your device until you delete it in the App or uninstall the App.

## 10. Deleting your account

You can delete your account at any time in the App: Settings → Legal & Privacy → Delete account. You will be asked to confirm, and for security we may ask for your password again.

When you delete your account we permanently delete your sign-in account and all server-side data linked to it: your synced Financial Information, any bank-message inbox items, your personal message-forwarding key, your shop category choices and your consent records. We also clear Fakka's data from the device you used to delete the account, including receipt photos saved by the App. If you use Fakka on other devices, they will be signed out, but information already saved on them stays on those devices until you delete it in the App there or uninstall the App.

Deletion cannot be undone. If you sign in again later with the same email or provider, a new, empty account will be created.

If you cannot access the App, you can ask us to delete your account by emailing support@fakkaeg.com from the email address linked to your account, or by using our web request page at https://fakkaeg.com/delete-account. We may need to verify your identity before acting on the request.

## 11. Your privacy rights

Depending on where you live, you may have some or all of the following rights:

- Access: to know whether we process your personal information and to receive a copy.
- Correction: to correct inaccurate information. You can edit most information directly in the App.
- Deletion: to have your information deleted. You can delete your account directly in the App.
- Portability: to receive the information you provided in a structured, machine-readable format.
- Restriction and objection: to ask us to limit or stop certain processing, including processing based on legitimate interests.
- Withdrawal of consent: to withdraw consent at any time, without affecting earlier lawful processing.
- Complaint: to complain to a data protection authority, such as Egypt's Personal Data Protection Center or the supervisory authority in your country of residence.

To exercise a right, contact us at support@fakkaeg.com. We will respond within the time required by applicable law, and in any case within 30 days where possible. We may need to verify your identity, and we may decline requests that are manifestly unfounded or excessive or that the law allows us to refuse. We will not discriminate against you for exercising your rights.

## 12. Children's privacy

The Service is intended for adults aged 18 or over (or the age of legal majority where you live, if higher). It is not directed to children, and we do not knowingly collect personal information from anyone under 18. If you believe a child has provided us with personal information, please contact us at support@fakkaeg.com and we will delete it.

## 13. International data transfers

We are based in Egypt, and our servers are located in the European Union. If you create an account, your information will therefore be transferred from Egypt, or from wherever you use the Service, to the European Union, and may be processed in other countries where our service providers operate. These countries may have data protection laws different from those in your country.

Where required, we put appropriate safeguards in place for such transfers, such as the standard contractual clauses included in our service providers' data processing agreements, and we comply with any additional cross-border transfer requirements of applicable law, including Egyptian Personal Data Protection Law No. 151 of 2020.

## 14. Data breaches

If we become aware of a security breach that affects your personal information, we will investigate promptly, take steps to contain it and reduce its effects, and notify the competent data protection authorities and affected users where and when required by applicable law (for example, within 72 hours of becoming aware of a breach where the law requires it). Notices to you will describe what happened, the information involved, what we are doing and what you can do to protect yourself.

## 15. Changes to this Policy

We may update this Policy from time to time, for example to reflect new features, legal requirements or the introduction of advertising or paid plans. The version and effective date at the top show when it last changed. If we make material changes, we will notify you in the App and ask you to review and accept the updated Policy before you continue using the Service. Where the law requires your consent to a change, we will not apply the change without it.

## 16. Contact us

Ahmed Hesham Bekheat, independent developer, Egypt
Email (privacy questions, requests and support): support@fakkaeg.com

## 17. Financial disclaimer

Fakka is a personal record-keeping and budgeting tool. We are not a bank, lender, payment service, investment adviser, tax adviser or other licensed financial institution. Totals, scores, exchange rates, gold prices, reminders and other figures shown in the App are estimates based on the information you enter and on third-party price sources, and may be incomplete, delayed or inaccurate. Transactions read from bank messages may be misread. Nothing in the App is financial, investment, tax or legal advice. Always check important figures with your bank or provider and consult a qualified professional before making financial decisions. See our Terms of Service for full details.

Installment providers, banks, wallets and other company names shown in the App are trademarks of their owners. Fakka is not affiliated with or endorsed by them.
`;

const TERMS = `
Effective date: [EFFECTIVE DATE]
Version: ${TERMS_VERSION}

These Terms of Service (the "Terms") form a legally binding agreement between you and Ahmed Hesham Bekheat, an independent developer based in Egypt ("we", "us", "our") and govern your use of the Fakka mobile application (the "App") and its related online services (together, the "Service").

By ticking the box to accept these Terms and creating an account or continuing as a guest, or by otherwise using the Service, you agree to these Terms and confirm that you have read our Privacy Policy. If you do not agree, you must not use the Service.

## 1. Eligibility

You must be at least 18 years old (or the age of legal majority where you live, if higher) and able to enter into a binding contract to use the Service. By using the Service you confirm that you meet these requirements. You may not use the Service if you are barred from doing so under applicable law.

## 2. The Service

Fakka helps you keep track of your own income, spending, installments, loans, bills, gam'eya, savings and goals, and shows totals, reminders, prices and scores based on what you enter. The Service is a record-keeping and budgeting tool only. It does not hold money, make or receive payments, connect to your bank accounts, or provide credit.

We may add, change or remove features from time to time. Some features may be offered only on certain devices or in certain regions. We may offer optional paid features in the future; if we do, their price and terms will be shown to you before you buy, and purchases made through the Apple App Store or Google Play are also subject to their terms.

## 3. Accounts

### 3.1 Guest mode

You may use the App without an account. In guest mode your information is stored only on your device. We cannot back it up, recover it or move it to another device, and it will be lost if you delete the App, lose your device or reset it.

### 3.2 Creating an account

You may create an account with an email address and password, with Sign in with Google, or with Sign in with Apple where offered. You agree to:

- Provide accurate information and keep your email address up to date.
- Create only one account for yourself and not create an account for anyone else without their permission.
- Keep your password and devices secure and not share your account with others.
- Tell us promptly at support@fakkaeg.com if you suspect unauthorised use of your account.

You are responsible for activity that takes place under your account, except to the extent caused by our breach of these Terms.

### 3.3 Personal message-forwarding link

If you turn on Automatic logging, you receive a personal link containing a secret key. Treat it like a password. Anyone with the link can add transactions to your inbox. You can reset or turn it off at any time in the App.

## 4. Your responsibilities

You are responsible for:

- The accuracy and completeness of the information you enter or forward, and for checking transactions created from bank messages.
- Making sure you are entitled to enter or forward any information about other people, such as names that appear in transfers or gam'eya details.
- Keeping your own records of important financial documents. The App is not a substitute for official statements from your bank or provider.
- Your own financial decisions and their consequences.
- Complying with all laws that apply to your use of the Service.

## 5. Acceptable use

You agree not to:

- Use the Service for any unlawful, fraudulent or harmful purpose, or to store or transmit unlawful content.
- Access or attempt to access another person's account or data, or probe, scan or test the vulnerability of the Service or bypass its security.
- Send automated, excessive or abusive requests to our servers, including the message-forwarding link, or interfere with the operation of the Service.
- Submit false or misleading shop categories with the aim of manipulating suggestions shown to others.
- Copy, modify, distribute, sell or lease any part of the Service, or reverse engineer, decompile or attempt to extract its source code, except where the law expressly permits this.
- Use the Service to build a competing product, or scrape or harvest data from it.
- Remove or alter any proprietary notices.

## 6. Financial disclaimer and no professional advice

The Service is provided for general information and personal organisation only.

- We are not a bank, lender, payment institution, broker, investment adviser, tax adviser, accountant or legal adviser, and we are not licensed or regulated as any of these.
- Nothing in the Service, including the Financial Health Score, totals, projections, spending or affordability estimates, reminders, categories, prices or any other content, is financial, investment, credit, tax or legal advice, or a recommendation to buy, sell, borrow, save or take any other action.
- Figures are calculated from the information you enter and from third-party sources and may be incomplete, out of date or wrong. Exchange rates and gold prices come from third-party sources, may be delayed, and may differ from the prices offered by banks, dealers or exchange offices.
- Transactions read from bank messages are created automatically and may be misread, duplicated, missed or wrongly categorised.
- Payment reminders depend on your device settings and may not be delivered. You remain responsible for paying your installments, loans, bills and other obligations on time.

You should verify important information with your bank or provider and seek advice from a suitably qualified professional before making financial decisions. You use the Service and rely on its content at your own risk.

## 7. Third-party services

The Service relies on or links to services provided by others, including Supabase (hosting and accounts), Google and Apple (sign-in and app distribution, and Apple Shortcuts for message forwarding), and public price data providers. We do not control and are not responsible for third-party services, their availability, accuracy or content, or their privacy practices. Your use of them may be subject to their own terms.

Installment providers, banks, wallets and other company names and logos referred to in the App are trademarks of their respective owners. Their use is for identification only and does not imply any affiliation with or endorsement by them.

## 8. Intellectual property

The Service, including its software, design, text, graphics, logos and the name Fakka, is owned by us or our licensors and is protected by intellectual property laws. Subject to these Terms, we grant you a personal, limited, non-exclusive, non-transferable, revocable licence to download and use the App on devices you own or control, for your personal, non-commercial use.

You keep all rights in the information you enter ("Your Content"). You grant us a worldwide, non-exclusive, royalty-free licence to host, store, process and display Your Content only as needed to provide, secure and improve the Service for you, as described in our Privacy Policy. For shop categories you choose, you also grant us a perpetual, irrevocable licence to use them in aggregated, non-identifying form to suggest categories to other users.

If you send us feedback or suggestions, we may use them without any obligation to you.

## 9. Privacy

Our Privacy Policy explains how we collect and use personal information. It forms part of these Terms.

## 10. Suspension and termination

You may stop using the Service at any time. You can delete your account in the App under Settings → Legal & Privacy → Delete account. Deleting your account permanently deletes your account and server-side data as described in our Privacy Policy and cannot be undone.

We may suspend or terminate your access to the Service, or delete an account, if:

- You materially or repeatedly breach these Terms.
- We are required to do so by law or by a competent authority.
- Your use creates a security risk, harms other users or third parties, or could expose us to legal liability.
- Your account has been inactive for an extended period of [INACTIVE ACCOUNT PERIOD], after we have tried to notify you at your email address.
- We discontinue the Service, in which case we will give reasonable advance notice where possible so you can record your information.

Where reasonable, we will tell you the reason and give you a chance to resolve the issue before acting. Sections that by their nature should survive termination (including sections 6, 8, 11, 12, 13 and 14) will survive.

## 11. Availability and changes to the Service

We aim to keep the Service available and working but do not guarantee that it will be uninterrupted, timely, secure or error-free, or that data will never be lost. Maintenance, network problems, third-party outages or events beyond our control may affect the Service. We recommend you keep your own records of important information.

## 12. Disclaimer of warranties

To the fullest extent permitted by law, the Service is provided "as is" and "as available", without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, accuracy, and non-infringement. Nothing in these Terms excludes or limits any warranty, right or remedy that cannot be excluded or limited under applicable consumer protection law.

## 13. Limitation of liability

To the fullest extent permitted by law:

- We are not liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of profits, revenue, savings, data or goodwill, or for late fees, penalties, interest or credit consequences, arising out of or related to your use of or inability to use the Service, or reliance on any figures, reminders or content in it.
- Our total liability for all claims arising out of or related to the Service or these Terms is limited to the greater of (a) the amount you paid us for the Service in the 12 months before the event giving rise to the claim, and (b) [LIABILITY CAP AMOUNT].

These limitations do not apply to liability that cannot be limited or excluded by law, such as liability for death or personal injury caused by negligence, fraud or wilful misconduct.

## 14. Indemnity

To the extent permitted by law, you agree to indemnify and hold us harmless from claims, losses and expenses (including reasonable legal fees) arising from your breach of these Terms, your misuse of the Service, or your violation of any law or the rights of a third party.

## 15. Governing law

These Terms and any dispute or claim arising out of or in connection with them or the Service are governed by the laws of [GOVERNING LAW COUNTRY], without regard to its conflict of law rules. If you are a consumer, you also benefit from any mandatory protections of the law of the country where you live.

## 16. Dispute resolution

If you have a concern, please contact us first at support@fakkaeg.com. We will try in good faith to resolve the issue informally within 30 days.

If a dispute is not resolved informally, it will be submitted to the competent courts of [DISPUTE VENUE CITY], [GOVERNING LAW COUNTRY], unless mandatory law gives you the right to bring proceedings in the courts of the place where you live. Nothing in this section prevents either party from seeking urgent interim relief from a competent court, or prevents you from contacting a consumer protection authority.

## 17. Changes to these Terms

We may update these Terms from time to time, for example to reflect changes to the Service or the law. The version and effective date at the top show when they last changed. If we make material changes, we will notify you in the App and ask you to accept the updated Terms before you continue using the Service. If you do not agree to the updated Terms, you must stop using the Service and you may delete your account.

## 18. Apple App Store terms

If you downloaded the App from the Apple App Store, you and we acknowledge that:

- These Terms are between you and us only, not Apple, and we, not Apple, are solely responsible for the App and its content.
- Your licence to use the App is limited to use on Apple-branded products you own or control, as permitted by the Usage Rules in the Apple Media Services Terms and Conditions.
- Apple has no obligation to provide any maintenance or support for the App.
- To the maximum extent permitted by law, Apple has no warranty obligation for the App. If the App fails to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price (if any) for the App.
- We, not Apple, are responsible for addressing any claims relating to the App, including product liability claims, claims that the App fails to conform to legal or regulatory requirements, and consumer protection, privacy or similar claims.
- We, not Apple, are responsible for the investigation, defence, settlement and discharge of any third-party claim that the App infringes intellectual property rights.
- You confirm that you are not located in a country subject to a U.S. Government embargo or designated as a "terrorist supporting" country, and you are not on any U.S. Government list of prohibited or restricted parties.
- Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.

## 19. General

- These Terms, together with the Privacy Policy, are the entire agreement between you and us about the Service.
- If any part of these Terms is found unenforceable, the rest remains in effect.
- Our failure to enforce a provision is not a waiver of our right to do so later.
- You may not transfer your rights under these Terms without our consent. We may transfer ours to a company we set up to run the Service, or as part of a merger, acquisition or sale of assets, provided your rights are not reduced. We will tell you if this happens.
- These Terms are written in English. If we provide a translation, the English version prevails to the extent permitted by law.

## 20. Contact

Ahmed Hesham Bekheat, independent developer, Egypt
Email: support@fakkaeg.com
`;

export const LEGAL_DOCS: Record<LegalDocKey, { title: string; version: string; body: string }> = {
  privacy: { title: 'Privacy Policy', version: PRIVACY_VERSION, body: PRIVACY.trim() },
  terms: { title: 'Terms of Service', version: TERMS_VERSION, body: TERMS.trim() },
};

export type Block = { kind: 'h2' | 'h3' | 'p' | 'li'; text: string };

// Turns a document into headings, paragraphs and bullet points
export function blocks(body: string): Block[] {
  const out: Block[] = [];
  for (const chunk of body.split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
    let para: string[] = [];
    const flush = () => { if (para.length) out.push({ kind: 'p', text: para.join('\n') }); para = []; };
    for (const l of lines) {
      if (l.startsWith('## ')) { flush(); out.push({ kind: 'h2', text: l.slice(3) }); }
      else if (l.startsWith('### ')) { flush(); out.push({ kind: 'h3', text: l.slice(4) }); }
      else if (l.startsWith('- ')) { flush(); out.push({ kind: 'li', text: l.slice(2) }); }
      else para.push(l);
    }
    flush();
  }
  return out;
}
