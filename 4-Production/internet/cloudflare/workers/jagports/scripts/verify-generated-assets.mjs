#!/usr/bin/env node

import { stat } from "node:fs/promises";
import { resolve } from "node:path";

const expectedAssets = [
  "public/i18n-resources.js",
  "public/vieps-tailwind.css",
];

let failed = false;

for (const relativePath of expectedAssets) {
  try {
    const info = await stat(resolve(relativePath));
    if (!info.isFile() || info.size <= 0) {
      console.error(`Generated asset is missing or empty: ${relativePath}`);
      failed = true;
      continue;
    }
    console.log(`Generated asset OK: ${relativePath} (${info.size} bytes)`);
  } catch {
    console.error(`Generated asset is missing or unreadable: ${relativePath}`);
    failed = true;
  }
}

if (failed) process.exit(1);
