import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/vieps-tailwind.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const desktop = css.slice(0, css.indexOf("@media (max-width: 1100px)"));
const tablet = css.slice(css.indexOf("@media (max-width: 1100px)"), css.indexOf("@media (max-width: 760px)"));
const mobile = css.slice(css.indexOf("@media (max-width: 760px)"), css.indexOf("@media (max-width: 320px)"));

function rule(selector, source = desktop) {
  // Match the complete CSS selector, never a prefix of a longer selector.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...source.matchAll(new RegExp("(?:^|\\n)\\s*" + escaped + "\\s*\\{([^}]*)\\}", "g"))];
  assert.ok(matches.length, "Missing CSS rule " + selector);
  return matches.at(-1)[1];
}

test("#888 desktop retains #886 Concept-11 arrangement and viewport-fit", () => {
  assert.match(rule("html"), /overflow:\s*hidden/);
  assert.match(rule("body"), /overflow:\s*hidden/);
  assert.match(rule(".app-shell"), /height:\s*100dvh/);
  assert.match(rule(".app-shell"), /grid-template-rows:\s*auto auto auto minmax\(0, 1fr\) minmax\(0, 1\.05fr\)/);
  assert.match(rule(".mobile-top, .concept-grid"), /display:\s*contents/);
  for (const [selector, col, row] of [
    [".search-panel", "2 / -1", "2"], [".tree-panel", "1", "2 / 6"],
    [".ranges-panel", "2 / -1", "3"], [".location-panel", "2", "4"],
    [".fitment-panel", "3", "4"], [".visual-panel", "2 / -1", "5"],
  ]) {
    assert.ok(rule(selector).includes("grid-column: " + col), selector + " column");
    assert.ok(rule(selector).includes("grid-row: " + row), selector + " row");
  }
});

test("#888 reduces panel spacing and #886 tree indentation without shrinking reserved panels", () => {
  assert.match(rule(".app-shell"), /--vieps-gap:\s*\.5rem/);
  assert.match(rule(".panel"), /bg-jagports-panel p-2/);
  assert.match(rule(".tree-children"), /margin-left:\s*\.2rem;\s*padding-left:\s*\.4rem/);
  assert.match(rule(".tree-node-row, .tree-part-row"), /py-1/);
  assert.match(rule(".tree-children"), /border-left:\s*1px/);
  assert.match(rule(".selected-path a"), /underline/);
  assert.match(rule(".location-panel", mobile), /min-height:\s*12rem/);
  assert.match(rule(".fitment-panel", mobile), /min-height:\s*12rem/);
  assert.match(rule(".visual-panel", mobile), /min-height:\s*22rem/);
});

test("#888 moves one expandable fixture guide into the branded banner", () => {
  assert.equal((html.match(/class="fixture-guide"/g) || []).length, 1);
  assert.ok(html.indexOf('class="fixture-guide"') < html.indexOf("</header>"));
  assert.ok(html.indexOf('class="fixture-guide"') < html.indexOf('class="panel tree-panel"'));
  assert.match(html, /<details class="fixture-guide"[^>]*><summary data-i18n="header\.instructions"><\/summary>/);
  assert.match(html, /data-i18n="fixture\.randomized_note"/);
  assert.match(rule(".banner-block .fixture-guide"), /overflow:\s*auto/);
});

test("#888 mobile keeps one fixed banner/Find/Stock region above sole content scroller", () => {
  assert.match(rule("html, body", mobile), /height:\s*100%;\s*overflow:\s*hidden/);
  assert.match(rule(".app-shell", mobile), /grid-template-rows:\s*minmax\(0, auto\) minmax\(0, 1fr\)/);
  assert.match(rule(".mobile-top", mobile), /grid-row:\s*1/);
  assert.match(rule(".mobile-top", mobile), /max-height:\s*53dvh/);
  assert.match(rule(".concept-grid", mobile), /grid-row:\s*2/);
  assert.match(rule(".concept-grid", mobile), /overflow-y:\s*auto/);
  assert.match(rule(".concept-grid", mobile), /overscroll-behavior:\s*contain/);
  assert.ok(html.indexOf('id="partSearch"') < html.indexOf('id="result"'));
  assert.ok(html.indexOf('id="availabilitySelect"') < html.indexOf('id="result"'));
});

test("#888 stock help is touch accessible and does not consume mobile top height", () => {
  assert.match(html, /id="stockHelpButton"[^>]*aria-expanded="false"[^>]*aria-controls="stockHelpPopover"/);
  assert.match(html, /id="stockHelpPopover"[^>]*role="tooltip" hidden/);
  assert.match(rule(".stock-help-popover"), /position:\s*absolute/);
  assert.match(rule(".stock-help-popover"), /width:\s*min\(19rem, calc\(100vw - 1rem\)\)/);
  assert.match(rule(".stock-help-popover"), /overflow:\s*auto/);
  assert.match(rule(".stock-help-popover", mobile), /max-height:\s*min\(30dvh, 9rem\)/);
  assert.match(css, /@media \(max-width: 320px\)/);
});

test("#888 tablet and keyboard-scroll regions remain available", () => {
  assert.match(rule(".concept-grid", tablet), /display:\s*grid/);
  assert.match(rule(".tree-panel", tablet), /grid-area:\s*tree/);
  assert.match(rule(".ranges-panel", tablet), /grid-area:\s*ranges/);
  assert.match(desktop, /\.tree-panel #tree, \.ranges-panel #ranges, \.fitment-panel #fitment, \.visual-panel #visuals\s*\{[^}]*overflow:\s*auto/s);
  assert.match(html, /id="tree" tabindex="0"/);
  for (const id of ["partSearch", "availabilitySelect", "tree", "ranges", "vehicleLocation", "fitment", "partCard", "visuals"]) {
    assert.equal((html.match(new RegExp('id="' + id + '"', "g")) || []).length, 1, id);
  }
});
