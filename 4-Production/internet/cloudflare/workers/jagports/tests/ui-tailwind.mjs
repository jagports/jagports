import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexUrl = new URL('../public/index.html', import.meta.url);
const packageUrl = new URL('../package.json', import.meta.url);
const sourceCssUrl = new URL('../styles/vieps-tailwind.css', import.meta.url);

test('VIEPS UI uses built Tailwind CSS and no Pico CDN', async () => {
  const html = await readFile(indexUrl, 'utf8');
  assert.match(html, /href="vieps-tailwind\.css"/);
  assert.doesNotMatch(html, /picocss|pico\.min\.css|cdn\.jsdelivr\.net\/npm\/@picocss/i);
});

test('Tailwind build is part of local development and deployment', async () => {
  const pkg = JSON.parse(await readFile(packageUrl, 'utf8'));
  assert.match(pkg.scripts['build:css'], /tailwindcss/);
  assert.match(pkg.scripts.dev, /npm run build:css/);
  assert.match(pkg.scripts.deploy, /npm run build:css/);
  assert.ok(pkg.devDependencies.tailwindcss);
  assert.ok(pkg.devDependencies['@tailwindcss/cli']);
});

test('Tailwind source defines VIEPS design tokens and Concept layout regions', async () => {
  const css = await readFile(sourceCssUrl, 'utf8');
  assert.match(css, /--color-jagports-teal:/);
  assert.match(css, /grid-template-areas:/);
  assert.match(css, /"tree search ranges"/);
  assert.match(css, /\.selected-path/);
});
