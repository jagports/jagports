import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexUrl = new URL('../public/index.html', import.meta.url);
const packageUrl = new URL('../package.json', import.meta.url);
const sourceCssUrl = new URL('../styles/vieps-tailwind.css', import.meta.url);
const libraryRoot = new URL('../../../../../../6-Development/libraries/css/tailwind/4.1.13/', import.meta.url);

test('VIEPS UI uses only a local built Tailwind stylesheet and no Pico/Tailwind CDN', async () => {
  const html = await readFile(indexUrl, 'utf8');
  assert.match(html, /href="vieps-tailwind\.css"/);
  assert.doesNotMatch(html, /picocss|pico\.min\.css|cdn\.jsdelivr\.net\/npm\/@picocss/i);
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com|tailwindcss\.com\/.*(?:\.css|\.js)|https?:\/\/[^"']*(?:tailwind|stylesheet)/i);
});

test('Tailwind build uses pinned local project dependencies for development and deployment', async () => {
  const pkg = JSON.parse(await readFile(packageUrl, 'utf8'));
  assert.match(pkg.scripts['build:css'], /^tailwindcss\b/);
  assert.match(pkg.scripts.build, /npm run build:css/);
  assert.match(pkg.scripts.build, /npm run verify:generated-assets/);
  assert.match(pkg.scripts.dev, /npm run build/);
  assert.match(pkg.scripts.deploy, /npm run build/);
  assert.match(pkg.scripts['verify:deployed-assets'], /verify-deployed-assets\.mjs/);
  assert.equal(pkg.devDependencies.tailwindcss, '4.1.13');
  assert.equal(pkg.devDependencies['@tailwindcss/cli'], '4.1.13');
});

test('versioned Tailwind source and documentation mirror is present locally', async () => {
  const [sourceRecord, userGuide, license, tailwindPackage, cliPackage] = await Promise.all([
    readFile(new URL('SOURCE_PACKAGE.md', libraryRoot), 'utf8'),
    readFile(new URL('USER_GUIDE.md', libraryRoot), 'utf8'),
    readFile(new URL('LICENSE', libraryRoot), 'utf8'),
    readFile(new URL('tailwindcss/package.json', libraryRoot), 'utf8'),
    readFile(new URL('@tailwindcss-cli/package.json', libraryRoot), 'utf8'),
  ]);

  assert.match(sourceRecord, /v4\.1\.13/);
  assert.match(sourceRecord, /1334c99/);
  assert.match(userGuide, /npm run build:css/);
  assert.match(license, /MIT License/);
  assert.equal(JSON.parse(tailwindPackage).version, '4.1.13');
  assert.equal(JSON.parse(cliPackage).version, '4.1.13');
});

test('Tailwind source follows the merged Concept-11 geometry', async () => {
  const css = await readFile(sourceCssUrl, 'utf8');
  assert.match(css, /--color-jagports-teal:/);
  assert.match(css, /grid-template-areas:/);
  assert.match(css, /"tree search search"/);
  assert.match(css, /"tree ranges ranges"/);
  assert.match(css, /"tree location suitability"/);
  assert.match(css, /"tree details details"/);
  assert.match(css, /\.selected-path/);
  assert.match(css, /CSS-Kit-2ndRound-Tailwind-CSS\.jpg/);
});

test('static shell keeps merged Concept-11 semantic regions without inventing unsupported behavior', async () => {
  const html = await readFile(indexUrl, 'utf8');
  assert.match(html, /class="search-availability-strip"/);
  assert.match(html, /id="availabilitySelect" disabled/);
  assert.match(html, /id="vehicleLocation" class="vehicle-location-canvas"/);
  assert.match(html, /<h2 id="ranges-heading" data-i18n="ranges\.heading"><\/h2>/);
  assert.match(html, /<h2 id="fitment-heading" data-i18n="fitment\.heading"><\/h2>/);
  assert.match(html, /<h2 id="visual-heading" data-i18n="visual\.heading"><\/h2>/);
  assert.doesNotMatch(html, />Top view</);
  assert.doesNotMatch(html, />Side view</);
});
