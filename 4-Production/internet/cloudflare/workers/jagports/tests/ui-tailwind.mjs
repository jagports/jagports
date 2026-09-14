import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexUrl = new URL('../public/index.html', import.meta.url);
const packageUrl = new URL('../package.json', import.meta.url);
const sourceCssUrl = new URL('../styles/vieps-tailwind.css', import.meta.url);

test('VIEPS UI uses only a local built Tailwind stylesheet and no Pico/Tailwind CDN', async () => {
  const html = await readFile(indexUrl, 'utf8');
  assert.match(html, /href="vieps-tailwind\.css"/);
  assert.doesNotMatch(html, /picocss|pico\.min\.css|cdn\.jsdelivr\.net\/npm\/@picocss/i);
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com|tailwindcss\.com\/.*(?:\.css|\.js)|https?:\/\/[^"']*(?:tailwind|stylesheet)/i);
});

test('Tailwind build uses pinned local project dependencies for development and deployment', async () => {
  const pkg = JSON.parse(await readFile(packageUrl, 'utf8'));
  assert.match(pkg.scripts['build:css'], /^tailwindcss\b/);
  assert.match(pkg.scripts.dev, /npm run build:css/);
  assert.match(pkg.scripts.deploy, /npm run build:css/);
  assert.equal(pkg.devDependencies.tailwindcss, '4.1.13');
  assert.equal(pkg.devDependencies['@tailwindcss/cli'], '4.1.13');
});

test('Tailwind source defines VIEPS design tokens and Concept layout regions', async () => {
  const css = await readFile(sourceCssUrl, 'utf8');
  assert.match(css, /--color-jagports-teal:/);
  assert.match(css, /grid-template-areas:/);
  assert.match(css, /"tree search ranges"/);
  assert.match(css, /\.selected-path/);
});
