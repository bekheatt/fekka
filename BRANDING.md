# Renaming the app

Everything the user sees comes from **brand.json**:

| Field     | What it changes |
|-----------|-----------------|
| `name`    | Name on the home screen, splash, login, settings, Face ID / camera messages, and every sentence that says "Fakka" |
| `nameAr`  | The Arabic name (فكّة) wherever it appears |
| `tagline` | The line under the logo on the login screen |

Change those three, save, restart Expo — done.

`scheme`, `slug` and `bundleId` are technical IDs. Leave them alone unless you're
publishing under a brand-new store listing: changing `bundleId` after release makes
the stores treat it as a different app, and changing `scheme` breaks old iPhone Shortcuts.
