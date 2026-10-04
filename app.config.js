// The app's real config. The name shown on the phone comes from brand.json,
// so renaming the app only means editing brand.json (see BRANDING.md).
const brand = require('./brand.json');
const base = require('./app.json').expo;
const say = s => s.split('Fakka').join(brand.name);

module.exports = {
  ...base,
  name: brand.name,
  slug: brand.slug,
  scheme: brand.scheme,
  ios: {
    ...base.ios,
    bundleIdentifier: brand.bundleId,
    infoPlist: { ...base.ios.infoPlist, NSFaceIDUsageDescription: say(base.ios.infoPlist.NSFaceIDUsageDescription) },
  },
  android: { ...base.android, package: brand.bundleId },
  plugins: base.plugins.map(p => Array.isArray(p)
    ? [p[0], Object.fromEntries(Object.entries(p[1]).map(([k, v]) => [k, typeof v === 'string' ? say(v) : v]))]
    : p),
};
