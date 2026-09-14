import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerRoot = join(__dirname, "..");
const css = readFileSync(join(workerRoot, "styles", "vieps-tailwind.css"), "utf8");
const html = readFileSync(join(workerRoot, "public", "index.html"), "utf8");

function expectRule(selector, declarations) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`, "s").exec(css);
  assert.ok(rule, `${selector} rule should exist`);

  for (const declaration of declarations) {
    assert.match(rule.groups.body, declaration);
  }
}

test("desktop Tailwind VIEPS shell fits the viewport without page-level scrolling", () => {
  expectRule("html", [/height:\s*100%;/, /overflow:\s*hidden;/]);
  expectRule("body", [/height:\s*100%;/, /min-height:\s*100dvh;/, /overflow:\s*hidden;/]);
  expectRule(".app-shell", [/height:\s*100dvh;/, /display:\s*flex;/, /overflow:\s*hidden;/]);
  expectRule(".concept-grid", [/flex:\s*1 1 auto;/, /min-height:\s*0;/, /overflow:\s*hidden;/]);
  expectRule(".panel", [/min-height:\s*0;/, /display:\s*flex;/, /overflow:\s*hidden;/]);
});

test("long default content scrolls inside permanent Concept-11 regions", () => {
  assert.match(css, /\.tree-panel #tree,\s*\.ranges-panel #ranges,\s*\.fitment-panel #fitment,\s*\.visual-panel #visuals\s*\{[^}]*overflow:\s*auto;/s);
  expectRule(".stock-section", [/overflow:\s*auto;/]);
  expectRule(".fixture-guide", [/overflow:\s*auto;/]);
});

test("Concept-11 desktop ordering keeps ranges upper-right and PART/image below suitability", () => {
  expectRule(".concept-grid", [
    /"tree search ranges"/,
    /"tree location ranges"/,
    /"tree suitability ranges"/,
    /"tree details \."/
  ]);
  assert.ok(css.indexOf('"tree suitability ranges"') < css.indexOf('"tree details ."'));
});

test("Concept-11 search and availability share the top strip", () => {
  assert.match(html, /class="search-availability-strip"/);
  assert.match(html, /id="partSearch"/);
  assert.match(html, /id="availabilitySelect"/);
  assert.match(html, /id="availabilitySelect" disabled/);
  assert.match(css, /\.search-availability-strip\s*\{/);
});

test("Concept-11 uses one vehicle-location canvas rather than permanent Top and Side panels", () => {
  assert.match(html, /id="vehicleLocation" class="vehicle-location-canvas"/);
  assert.doesNotMatch(html, />Top view</);
  assert.doesNotMatch(html, />Side view</);
  assert.doesNotMatch(html, /class="vehicle-views"|class="vehicle-view"/);
  expectRule(".vehicle-location-canvas", [/flex:\s*1 1 auto;/, /display:\s*grid;/, /overflow:\s*hidden;/]);
});

test("Concept-11 lower region is explicitly PART / Image / Status", () => {
  assert.match(html, /<h2 id="visual-heading">PART \/ Image \/ Status<\/h2>/);
  assert.match(html, /<h2 id="fitment-heading">Suitability \/ Filter<\/h2>/);
});

test("narrow responsive layouts remain scrollable instead of clipped", () => {
  const responsiveRules = css.slice(css.indexOf("@media (max-width: 1100px)"));

  assert.match(responsiveRules, /html,\s*body\s*\{[^}]*height:\s*auto;[^}]*overflow:\s*auto;/s);
  assert.match(responsiveRules, /\.app-shell\s*\{[^}]*height:\s*auto;[^}]*min-height:\s*100dvh;[^}]*overflow:\s*visible;/s);
  assert.match(responsiveRules, /\.concept-grid\s*\{[^}]*overflow:\s*visible;/s);
  assert.match(responsiveRules, /\.panel\s*\{[^}]*overflow:\s*visible;/s);
});

test("Concept-11 permanent regions remain present in the static shell", () => {
  for (const id of ["partSearch", "availabilitySelect", "tree", "vehicleLocation", "locationStatus", "partCard", "visuals", "ranges", "fitment"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /class="panel tree-panel"/);
  assert.match(html, /class="panel visual-panel"/);
  assert.match(html, /class="panel ranges-panel"/);
  assert.match(html, /class="panel fitment-panel"/);
});
