#!/usr/bin/env node

const baseUrl = (process.env.VIEPS_BASE_URL || "https://vieps.parts-5ec.workers.dev").replace(/\/$/, "");
const checks = [
  { path: "/vieps-tailwind.css", contentType: "text/css" },
];

let failed = false;

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  try {
    const response = await fetch(url, { redirect: "follow" });
    const body = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      console.error(`Deployed asset failed: ${url} -> HTTP ${response.status}`);
      failed = true;
      continue;
    }
    if (!contentType.toLowerCase().includes(check.contentType)) {
      console.error(`Deployed asset has unexpected content type: ${url} -> ${contentType || "<missing>"}`);
      failed = true;
      continue;
    }
    if (!body.trim()) {
      console.error(`Deployed asset is empty: ${url}`);
      failed = true;
      continue;
    }

    console.log(`Deployed asset OK: ${url} (${contentType})`);
  } catch (error) {
    console.error(`Deployed asset request failed: ${url}: ${error.message}`);
    failed = true;
  }
}

if (failed) process.exit(1);
