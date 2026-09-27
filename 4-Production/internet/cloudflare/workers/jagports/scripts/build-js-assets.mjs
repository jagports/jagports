#!/usr/bin/env node

import { copyFile } from "node:fs/promises";

const browserAssets = [
  ["js/vieps.js", "public/app.js"],
  ["js/admin-stock.js", "public/stock-admin.js"],
  ["js/vieps-i18n-runtime.js", "public/i18n-runtime.js"],
];

for (const [source, destination] of browserAssets) {
  await copyFile(new URL(`../${source}`, import.meta.url), new URL(`../${destination}`, import.meta.url));
  console.log(`Built ${destination} from ${source}`);
}
