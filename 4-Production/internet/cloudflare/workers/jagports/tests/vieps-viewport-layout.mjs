import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/vieps-tailwind.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

function rule(selector, text = css.slice(0, css.indexOf("@media (max-width: 1100px)"))) {
  // Match a complete selector, not a substring of a grouped declaration.
  // Tablet intentionally overrides grouped defaults with later explicit rules.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...text.matchAll(new RegExp("(?:^|\\n)\\s*" + escaped + "\\s*\\{([^}]*)\\}", "g"))];
  assert.ok(matches.length, "Expected CSS rule: " + selector);
  return matches.at(-1)[1];
}
function mobileRules() { return css.slice(css.indexOf("@media (max-width: 760px)")); }

test("#875 desktop banner, search and regions occupy the approved three columns", () => {
  assert.match(rule(".app-shell"), /grid-template-columns:\s*var\(--vieps-columns\)/);
  assert.match(rule(".app-shell"), /grid-template-rows:\s*auto auto minmax\(0, 1fr\)/);
  assert.match(rule(".app-header"), /grid-template-columns:\s*var\(--vieps-columns\)/);
  assert.match(rule(".search-panel"), /grid-column:\s*3;\s*grid-row:\s*2/);
  assert.match(rule(".left-workspace"), /grid-column:\s*1;\s*grid-row:\s*2 \/ 4/);
  assert.match(rule(".centre-workspace"), /grid-column:\s*2;\s*grid-row:\s*2 \/ 4/);
  assert.match(rule(".right-workspace"), /grid-column:\s*3;\s*grid-row:\s*3/);
  assert.match(rule(".centre-detail"), /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1\.05fr\)/);
});

test("#875 instructions are inside banner and one Find form precedes scrollable content", () => {
  assert.match(html, /class="banner-block"[^>]*>[\s\S]*data-i18n="header\.instructions"/);
  assert.equal((html.match(/id="partSearch"/g) || []).length, 1);
  assert.ok(html.indexOf('class="panel search-panel"') > html.indexOf("</header>"));
  assert.ok(html.indexOf('class="panel search-panel"') < html.indexOf('id="result"'));
  assert.match(html, /id="partNumber"/);
  assert.match(html, /type="submit"[^>]*data-i18n="common\.search"/);
});

test("#875 mobile keeps banner and Find fixed and scrolls only the remaining workspace", () => {
  const mobile = mobileRules();
  assert.match(mobile, /html, body\s*\{\s*height:\s*100%;\s*overflow:\s*hidden/);
  assert.match(rule(".app-shell", mobile), /height:\s*100dvh/);
  assert.match(rule(".app-shell", mobile), /grid-template-rows:\s*auto auto minmax\(0, 1fr\)/);
  assert.match(rule(".app-header", mobile), /grid-row:\s*1/);
  assert.match(rule(".search-panel", mobile), /grid-row:\s*2/);
  assert.match(rule(".concept-grid", mobile), /grid-row:\s*3/);
  assert.match(rule(".concept-grid", mobile), /overflow-y:\s*auto/);
  assert.match(rule(".concept-grid", mobile), /overscroll-behavior:\s*contain/);
  assert.match(mobile, /\\.tree-panel #tree,[\\s\\S]*?\\.stock-section\\s*\\{\\s*overflow:\\s*visible/);
  assert.match(rule(".search-form", mobile), /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
});

test("#875 tablet retains two columns and readable scrollable panels", () => {
  const tablet = css.slice(css.indexOf("@media (max-width: 1100px)"), css.indexOf("@media (max-width: 760px)"));
  assert.match(tablet, /and \(min-width:\s*761px\)/);
  assert.match(rule(".app-shell", tablet), /display:\s*flex/);
  assert.match(rule(".concept-grid", tablet), /display:\s*grid/);
  assert.match(rule(".right-workspace", tablet), /grid-column:\s*1 \/ -1/);
  assert.match(rule(".centre-detail", tablet), /grid-template-columns:\s*minmax\(0, 1fr\)/);
});

test("#875 wide desktop preserves independent keyboard-scrolling lists and Stock Admin scope", () => {
  assert.match(rule("html"), /overflow:\s*hidden/);
  assert.match(rule(".app-shell"), /overflow:\s*hidden/);
  assert.match(css, /\.tree-panel #tree, \.results-panel \.results-scroll, \.ranges-panel \.ranges-scroll,[\s\S]*?overflow:\s*auto/);
  for (const id of ["tree", "searchResults", "ranges"]) {
    assert.match(html, new RegExp('id="' + id + '"[^>]*tabindex="0"'), id);
  }
  assert.ok(css.includes(".stock-admin-document,"), "Stock Admin retains its own scrolling rules");
});

test("#875 static shell contains exactly one of each permanent component", () => {
  for (const id of ["partSearch", "availabilitySelect", "tree", "searchResults", "ranges", "vehicleLocation", "partCard", "visuals", "fitment"]) {
    assert.equal((html.match(new RegExp('id="' + id + '"', "g")) || []).length, 1, id);
  }
});
