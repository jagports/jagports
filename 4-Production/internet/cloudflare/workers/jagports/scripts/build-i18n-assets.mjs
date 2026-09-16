#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourceDirectory = resolve(
  process.cwd(),
  "../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n"
);
const locales = ["en", "fi"];
const resources = {};

for (const locale of locales) {
  const source = await readFile(resolve(sourceDirectory, `${locale}.json`), "utf8");
  resources[locale] = JSON.parse(source);
}

const output = `globalThis.VIEPS_I18N_RESOURCES = ${JSON.stringify(resources, null, 2)};\n`;
await writeFile(resolve(process.cwd(), "public/i18n-resources.js"), output, "utf8");
console.log("Generated public/i18n-resources.js from canonical VIEPS locale resources.");
