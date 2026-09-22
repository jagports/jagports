import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/vieps-tailwind.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

function rule(selector) {
  const start = css.indexOf(selector + " {");
  assert.notEqual(start, -1, "Expected CSS rule: " + selector);
  const end = css.indexOf("}", start);
  return css.slice(start, end);
}

test("#875 header and body share desktop layout columns", () => {
  assert.match(rule(".app-shell"), /--vieps-columns:\s*minmax\(14rem, 0\.9fr\) minmax\(0, 2fr\) minmax\(18rem, 1\.1fr\)/);
  assert.match(rule(".app-header, .concept-grid"), /grid-template-columns:\s*var\(--vieps-columns\)/);
  assert.match(rule(".centre-detail"), /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1\.05fr\)/);
  for (const region of ["left", "centre", "right"]) assert.ok(html.includes('class="' + region + '-workspace"'));
});

test("#875 retains fitted desktop and independent tree, results and model scrolling", () => {
  for (const selector of ["html", "body", ".app-shell", ".concept-grid", ".panel"]) {
    assert.ok(rule(selector).includes("overflow: hidden"), selector);
  }
  assert.match(rule(".app-shell"), /height:\s*100dvh/);
  assert.match(css, /\.tree-panel #tree, \.results-panel \.results-scroll, \.ranges-panel \.ranges-scroll,[\s\S]*?overflow:\s*auto/);
  for (const id of ["tree", "searchResults", "ranges"]) {
    const region = new RegExp('id="' + id + '"[^>]*tabindex="0"');
    assert.match(html, region, id + " must be a keyboard-scrollable region");
  }
});

test("#875 aligns the header and workspace at tablet width and stacks on mobile", () => {
  const tablet = css.slice(css.indexOf("@media (max-width: 1100px)"), css.indexOf("@media (max-width: 760px)"));
  const mobile = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(tablet, /--vieps-columns:\s*minmax\(13rem, 0\.9fr\) minmax\(0, 2fr\)/);
  assert.match(tablet, /\.right-workspace\s*\{\s*grid-column:\s*1 \/ -1/);
  assert.match(tablet, /\.concept-grid\s*\{\s*overflow:\s*visible/);
  assert.match(mobile, /\.app-header, \.concept-grid\s*\{\s*display:\s*block/);
  assert.match(mobile, /\.centre-detail/);
});

test("#875 CSS has one shared source for header and locale styles", () => {
  const desktop = css.slice(0, css.indexOf("@media (max-width: 1100px)"));
  for (const selector of [".app-header {", ".locale-button {", ".locale-control {", ".eyebrow {"]) {
    assert.equal(desktop.split(selector).length - 1, 1, selector);
  }
  assert.ok(css.includes(".stock-admin-document,"), "Stock Admin remains separately scoped");
  assert.ok(!css.includes("search-availability-strip"), "Legacy search strip must not return");
  assert.ok(!css.includes('"tree search search"'), "Legacy grid placement must not return");
});

test("#875 semantic permanent regions remain in the static shell", () => {
  for (const id of ["partSearch", "availabilitySelect", "tree", "searchResults", "ranges", "vehicleLocation", "partCard", "visuals", "fitment"]) {
    assert.ok(html.includes('id="' + id + '"'), "Missing region " + id);
  }
  for (const panel of ["availability", "tree", "vin", "location", "visual", "search", "results", "ranges"]) {
    assert.ok(html.includes('class="panel ' + panel + '-panel"'), "Missing panel " + panel);
  }
});
