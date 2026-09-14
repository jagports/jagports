import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerRoot = join(__dirname, "..");
const css = readFileSync(join(workerRoot, "public", "vieps.css"), "utf8");
const html = readFileSync(join(workerRoot, "public", "index.html"), "utf8");

test("desktop VIEPS shell fits the viewport without page-level scrolling", () => {
  assert.match(css, /html\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(css, /body\s*\{[^}]*min-height:\s*100dvh;[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.app-shell\s*\{[^}]*height:\s*100dvh;[^}]*display:\s*flex;[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.concept-grid\s*\{[^}]*min-height:\s*0;[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.panel\s*\{[^}]*min-height:\s*0;[^}]*display:\s*flex;[^}]*overflow:\s*hidden;/s);
});

test("long default content scrolls inside permanent Concept View-1 regions", () => {
  assert.match(css, /\.tree-panel #tree,\s*\.ranges-panel #ranges,\s*\.fitment-panel #fitment,\s*\.visual-panel #visuals\s*\{[^}]*overflow:\s*auto;/s);
  assert.match(css, /\.stock-section\s*\{[^}]*overflow:\s*auto;/s);
  assert.match(css, /\.fixture-guide\s*\{[^}]*overflow:\s*auto;/s);
});

test("narrow responsive layouts remain scrollable instead of clipped", () => {
  assert.match(css, /@media \(max-width:\s*980px\)\s*\{[^}]*html,\s*body\s*\{[^}]*overflow:\s*auto;/s);
  assert.match(css, /@media \(max-width:\s*980px\)\s*\{[^}]*\.app-shell\s*\{[^}]*height:\s*auto;[^}]*overflow:\s*visible;/s);
});

test("Concept View-1 permanent regions remain present in the static shell", () => {
  for (const id of ["partSearch", "tree", "locationStatus", "partCard", "visuals", "ranges", "fitment"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /class="panel tree-panel"/);
  assert.match(html, /class="panel visual-panel"/);
  assert.match(html, /class="panel ranges-panel"/);
  assert.match(html, /class="panel fitment-panel"/);
});
