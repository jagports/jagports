import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const publicDir = new URL("../public/", import.meta.url);

async function readPublic(name) {
  return readFile(new URL(name, publicDir), "utf8");
}

test("VIEPS shell integrates the selected CSS kit and local styling", async () => {
  const html = await readPublic("index.html");

  assert.match(html, /@picocss\/pico@2\/css\/pico\.min\.css/);
  assert.match(html, /href="vieps\.css"/);
  assert.match(html, /id="partSearch"/);
  assert.match(html, /id="partCard"/);
  assert.match(html, /id="tree"/);
  assert.match(html, /id="visuals"/);
  assert.match(html, /id="fitment"/);
  assert.doesNotMatch(html, /<nav\b/i);
});

test("VIEPS styling preserves the Concept View-1 desktop hierarchy and responsive fallback", async () => {
  const css = await readPublic("vieps.css");

  assert.match(css, /\.concept-grid\s*\{/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*0\.85fr\).*minmax\(0,\s*1\.05fr\).*minmax\(0,\s*1\.35fr\)/s);
  assert.match(css, /\.fitment-panel\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  assert.match(css, /@media\s*\(max-width:\s*980px\)/);
  assert.match(css, /@media\s*\(max-width:\s*700px\)/);
  assert.match(css, /\.empty\s*\{/);
});
