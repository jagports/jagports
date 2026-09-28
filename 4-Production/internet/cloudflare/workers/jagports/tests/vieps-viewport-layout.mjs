import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/vieps-tailwind.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
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

test("#875 desktop fits three workspaces while preserving #888 compact spacing", () => {
  assert.match(rule("html"), /overflow:\s*hidden/);
  assert.match(rule("body"), /overflow:\s*hidden/);
  assert.match(rule(".app-shell"), /height:\s*100dvh/);
  assert.match(rule(".app-shell"), /grid-template-columns:\s*minmax\(13rem, \.9fr\) minmax\(0, 2fr\) minmax\(18rem, 1\.1fr\)/);
  assert.match(rule(".app-shell"), /grid-template-rows:\s*auto auto minmax\(0, 1fr\)/);
  assert.match(rule(".mobile-top, .concept-grid"), /display:\s*contents/);
  // The later rule must override .panel's display:flex on desktop.
  assert.match(rule(".search-panel, .search-availability-strip"), /display:\s*contents/);
  for (const [selector, column, row] of [
    [".availability-block", "1", "2"],
    [".left-workspace", "1", "3"],
    [".centre-workspace", "2", "2 / 4"],
    [".search-block", "3", "2"],
    [".right-workspace", "3", "3"],
  ]) {
    const declarations = rule(selector);
    assert.ok(declarations.includes("grid-column: " + column), selector + " column");
    assert.ok(declarations.includes("grid-row: " + row), selector + " row");
  }
  assert.match(rule(".centre-detail"), /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1\.05fr\)/);
  assert.match(rule(".results-panel .results-scroll, .ranges-panel .ranges-scroll"), /overflow:\s*auto/);
  assert.match(rule(".tree-panel #tree, .ranges-panel #ranges, .fitment-panel #fitment, .visual-panel #visuals"), /overflow:\s*auto/);
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
  assert.match(rule(".stock-help", mobile), /position:\s*static/);
  for (const declaration of ["left: .35rem", "right: .35rem", "width: auto", "top: calc(100% + .2rem)"]) {
    assert.ok(rule(".stock-help-popover", mobile).includes(declaration), "mobile help: " + declaration);
  }
  assert.match(rule(".search-panel", mobile), /position:\s*relative/);
  assert.match(app, /event\.key === "Escape"[\s\S]*button\.focus\?\.\(\);[\s\S]*show\(false\)/);
  assert.match(css, /@media \(max-width: 320px\)/);
});

test("#875 tablet and keyboard-scroll regions remain available", () => {
  assert.match(rule(".concept-grid", tablet), /display:\s*grid/);
  assert.match(rule(".concept-grid", tablet), /grid-template-areas:\s*"left centre" "right right"/);
  assert.match(rule(".left-workspace", tablet), /grid-area:\s*left/);
  assert.match(rule(".centre-workspace", tablet), /grid-area:\s*centre/);
  assert.match(rule(".right-workspace", tablet), /grid-area:\s*right/);
  assert.match(rule(".tree-panel #tree, .ranges-panel #ranges, .fitment-panel #fitment, .visual-panel #visuals"), /overflow:\s*auto/);
  assert.match(rule(".results-panel .results-scroll, .ranges-panel .ranges-scroll"), /overflow:\s*auto/);
  assert.match(html, /id="tree"[^>]*tabindex="0"/);
  for (const id of ["partSearch", "availabilitySelect", "tree", "searchResults", "ranges", "vehicleLocation", "fitment", "partCard", "visuals"]) {
    assert.equal((html.match(new RegExp('id="' + id + '"', "g")) || []).length, 1, id);
  }
});
