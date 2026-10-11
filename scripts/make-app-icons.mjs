// Draws the app icon, Android adaptive icon and launch-screen logo into assets/, from the same
// three-coin design as src/Logo.tsx (renders SVG with the installed Google Chrome).
//   node scripts/make-app-icons.mjs
// The iOS icon must have no transparency, so its alpha channel is removed after rendering.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BLUE = '#2B3BFF', SKY = '#8E97FF', PALE = '#D8DBFF';
const FONT = pathToFileURL(join(ROOT, 'node_modules/@expo-google-fonts/ibm-plex-sans-arabic/700Bold/IBMPlexSansArabic_700Bold.ttf')).href;

// The coin stack in a 100x100 box (coins span x 4-96, y 8-94, so its middle is 50,51)
const coins = (glow) => `
  ${glow ? `<circle cx="50" cy="50" r="50" fill="${BLUE}" opacity=".18"/>` : ''}
  <circle cx="35" cy="39" r="29.1" fill="${PALE}" stroke="${SKY}" stroke-width="3.7"/>
  <circle cx="35" cy="39" r="22.3" fill="none" stroke="${SKY}" stroke-width="1.2" opacity=".6"/>
  <circle cx="65" cy="37" r="29.1" fill="${SKY}" stroke="${BLUE}" stroke-width="3.7"/>
  <circle cx="65" cy="37" r="22.3" fill="none" stroke="${BLUE}" stroke-width="1.2" opacity=".6"/>
  <g filter="url(#lift)">
    <circle cx="50" cy="63" r="29.1" fill="#fff" stroke="${BLUE}" stroke-width="3.7"/>
    <circle cx="50" cy="63" r="22.3" fill="none" stroke="${BLUE}" stroke-width="1.2" opacity=".6"/>
    <text x="50" y="63.5" text-anchor="middle" dominant-baseline="central" font-size="31" font-family="Plex" fill="${BLUE}">ف</text>
  </g>`;

const svg = (size, { bg, scale, glow = false, rings = false }) => {
  const s = (size / 100) * scale, x = size / 2 - 50 * s, y = size / 2 - 51 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><filter id="lift" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.4" flood-color="#0B1499" flood-opacity=".35"/></filter></defs>
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  ${rings ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.47}" fill="none" stroke="${SKY}" stroke-width="${size * 0.004}" opacity=".10"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.36}" fill="none" stroke="${SKY}" stroke-width="${size * 0.004}" opacity=".14"/>` : ''}
  <g transform="translate(${x} ${y}) scale(${s})">${coins(glow)}</g>
</svg>`;
};

const page = (body, size) => `<!doctype html><html><head><style>
@font-face { font-family: Plex; src: url(${FONT}); }
html, body { margin: 0; width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
svg { display: block; }
</style></head><body>${body}</body></html>`;

const tmp = mkdtempSync(join(tmpdir(), 'fakka-icons-'));
function render(name, size, opts) {
  const html = join(tmp, `${name}.html`);
  writeFileSync(html, page(svg(size, opts), size));
  const out = join(ROOT, 'assets', `${name}.png`);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--default-background-color=00000000', `--window-size=${size},${size}`, `--screenshot=${out}`, pathToFileURL(html).href], { stdio: 'ignore' });
  return out;
}

// ---- PNG: drop the alpha channel (RGBA -> RGB) for the iOS icon ----
function crcTable() { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; }
const CRC = crcTable();
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };

function opaque(file) {
  const png = readFileSync(file);
  let pos = 8, w = 0, h = 0, type = 0, depth = 0; const idat = [];
  while (pos < png.length) {
    const len = png.readUInt32BE(pos), t = png.toString('ascii', pos + 4, pos + 8), data = png.subarray(pos + 8, pos + 8 + len);
    if (t === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; }
    if (t === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  if (depth !== 8 || (type !== 6 && type !== 2)) throw new Error(`Unexpected PNG format in ${file}`);
  if (type === 2) return; // already RGB
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { // undo PNG row filters
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = px.subarray(y * stride, (y + 1) * stride), up = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, b = up ? up[i] : 0, c = up && i >= bpp ? up[i - bpp] : 0;
      let v = src[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      row[i] = v & 0xff;
    }
  }
  const rgb = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = y * stride + x * 4, d = y * (w * 3 + 1) + 1 + x * 3, al = px[s + 3] / 255;
    for (let k = 0; k < 3; k++) rgb[d + k] = Math.round(px[s + k] * al + 255 * (1 - al)); // flatten onto white (icon is full-bleed anyway)
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  writeFileSync(file, Buffer.concat([png.subarray(0, 8), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rgb, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

mkdirSync(join(ROOT, 'assets'), { recursive: true });
opaque(render('icon', 1024, { bg: BLUE, scale: 0.66, rings: true }));         // iOS + default icon, full-bleed blue
render('adaptive-icon', 1024, { scale: 0.5 });                              // Android foreground, inside the safe zone
render('splash-icon', 420, { scale: 0.9, glow: true });                    // launch screen logo (shown at 140pt, like Splash.tsx)
rmSync(tmp, { recursive: true, force: true });
console.log('Wrote assets/icon.png, assets/adaptive-icon.png, assets/splash-icon.png');
