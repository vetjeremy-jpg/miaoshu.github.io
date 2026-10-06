import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CANONICAL_TOUCH = '/miaoshu.github.io/apple-touch-icon.png?v=20261006-goldcat1';
const ICON_VERSION = '20261006-goldcat1';

function fail(message) {
  console.error('App icon contract failed:', message);
  process.exitCode = 1;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'playwright-report' || entry.name === 'test-results') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

function pngDimensions(buffer) {
  const sig = buffer.subarray(0, 8).toString('hex');
  if (sig !== '89504e470d0a1a0a' || buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('not a PNG with a valid IHDR header');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const allFiles = await walk(ROOT);
const htmlFiles = allFiles.filter(file => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  if (!html.includes(`rel="apple-touch-icon"`) || !html.includes(`href="${CANONICAL_TOUCH}"`)) {
    fail(`${path.relative(ROOT, file)} must reference the canonical versioned Apple touch icon`);
  }
  if (html.includes('href="/miaoshu.github.io/apple-touch-icon.png"')) {
    fail(`${path.relative(ROOT, file)} still contains the unversioned Apple touch icon URL`);
  }
}

const manifest = JSON.parse(await readFile(path.join(ROOT, 'site.webmanifest'), 'utf8'));
const expectedManifestIcons = new Map([
  ['192x192', `/miaoshu.github.io/assets/icons/icon-192.png?v=${ICON_VERSION}`],
  ['512x512', `/miaoshu.github.io/assets/icons/icon-512.png?v=${ICON_VERSION}`]
]);
for (const [sizes, src] of expectedManifestIcons) {
  const icon = manifest.icons?.find(item => item.sizes === sizes);
  if (!icon || icon.src !== src || icon.type !== 'image/png') {
    fail(`manifest ${sizes} icon must be ${src}`);
  }
}

const touchPaths = [
  'apple-touch-icon.png',
  'apple-touch-icon-precomposed.png',
  'assets/icons/apple-touch-icon.png'
];
const touchBuffers = await Promise.all(touchPaths.map(p => readFile(path.join(ROOT, p))));
for (let i = 1; i < touchBuffers.length; i++) {
  if (!touchBuffers[0].equals(touchBuffers[i])) fail(`${touchPaths[i]} must be byte-identical to apple-touch-icon.png`);
}
for (let i = 0; i < touchBuffers.length; i++) {
  try {
    const { width, height } = pngDimensions(touchBuffers[i]);
    if (width !== 180 || height !== 180) fail(`${touchPaths[i]} must be 180x180, got ${width}x${height}`);
  } catch (error) {
    fail(`${touchPaths[i]}: ${error.message}`);
  }
}

for (const [p, size] of [['assets/icons/icon-192.png', 192], ['assets/icons/icon-512.png', 512]]) {
  try {
    const { width, height } = pngDimensions(await readFile(path.join(ROOT, p)));
    if (width !== size || height !== size) fail(`${p} must be ${size}x${size}, got ${width}x${height}`);
  } catch (error) {
    fail(`${p}: ${error.message}`);
  }
}

const sw = await readFile(path.join(ROOT, 'sw.js'), 'utf8');
for (const url of [CANONICAL_TOUCH, ...expectedManifestIcons.values()]) {
  const relative = url.replace('/miaoshu.github.io/', '');
  if (!sw.includes(`SCOPE+'${relative}'`)) fail(`service worker must version and cache ${url}`);
}

if (!process.exitCode) {
  console.log(`App icon contract OK: ${htmlFiles.length} HTML pages use the same versioned gold-cat icon family.`);
}
