// #891: browser-rendered evidence for the merged #888 interface.
// Static built UI isolates layout/interaction behavior from live STOCK or catalogue data.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const publicDir = resolve(fileURLToPath(new URL("../public/", import.meta.url)));
const evidenceDir = fileURLToPath(new URL("../browser-evidence/", import.meta.url));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" };
const extension = (name) => name.slice(name.lastIndexOf("."));

async function localServer() {
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname.startsWith("/api/")) {
      response.writeHead(503, { "Content-Type": "application/json" });
      response.end('{"error":"Browser layout fixture: catalogue API not supplied"}');
      return;
    }
    const target = resolve(publicDir, "." + (pathname === "/" ? "/index.html" : pathname));
    if (target !== publicDir && !target.startsWith(publicDir + sep)) {
      response.writeHead(403); response.end(); return;
    }
    try {
      const body = await readFile(target);
      response.writeHead(200, { "Content-Type": mime[extension(target)] || "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404); response.end();
    }
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return { server, url: "http://127.0.0.1:" + server.address().port + "/" };
}

async function geometry(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height };
    };
    const content = document.querySelector("#result");
    return {
      viewport: { width: innerWidth, height: innerHeight },
      pageWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      top: rect(".mobile-top"),
      find: rect(".search-panel"),
      content: rect("#result"),
      contentScrollable: content.scrollHeight > content.clientHeight,
      contentScrollTop: content.scrollTop,
      locationHeight: rect(".location-panel").height,
      fitmentHeight: rect(".fitment-panel").height,
      visualHeight: rect(".visual-panel").height,
    };
  });
}

const base = process.env.VIEPS_BROWSER_URL;
let local;
let browser;
await mkdir(evidenceDir, { recursive: true });
try {
  if (!base) local = await localServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(base || local.url, { waitUntil: "load" });
  await page.locator(".fixture-guide summary").waitFor();

  // Desktop Concept-11 layout and image evidence.
  let g = await geometry(page);
  assert.ok(g.pageWidth <= g.viewport.width + 1, "desktop horizontal overflow");
  const desktopTree = await page.locator(".tree-panel").boundingBox();
  const desktopSearch = await page.locator(".search-panel").boundingBox();
  assert.ok(desktopTree.x < desktopSearch.x, "desktop tree remains left of Find");
  await page.screenshot({ path: evidenceDir + "desktop.png", fullPage: true });
  const stock = page.locator("#availabilitySelect");
  const button = page.locator("#stockHelpButton");
  const popover = page.locator("#stockHelpPopover");
  const initialStock = await stock.isChecked();
  await button.hover();
  assert.ok(await popover.isVisible(), "desktop hover exposes Stock help");
  await button.click();
  assert.ok(await popover.isVisible(), "desktop click pins Stock help");
  assert.equal(await stock.isChecked(), initialStock, "help must not toggle Stock-only");
  await page.keyboard.press("Escape");
  assert.ok(!(await popover.isVisible()), "Escape dismisses help after restoring focus");
  await button.press("Space");
  assert.ok(await popover.isVisible(), "Space opens help");
  await button.press("Enter");
  assert.ok(!(await popover.isVisible()), "Enter closes pinned help");

  // Mobile snapshots prove the upper controls stay put while lower panels scroll.
  for (const width of [220, 320]) {
    await page.setViewportSize({ width, height: 780 });
    await page.goto(base || local.url, { waitUntil: "load" });
    g = await geometry(page);
    assert.ok(g.pageWidth <= width + 1 && g.bodyWidth <= width + 1, width + "px horizontal overflow");
    assert.ok(g.contentScrollable, width + "px lower content must be independently scrollable");
    assert.ok(g.content.height >= 50, width + "px lower content is trapped");
    assert.ok(g.locationHeight >= 170 && g.fitmentHeight >= 170 && g.visualHeight >= 300,
      width + "px reserved content panels shrank");
    await page.screenshot({ path: evidenceDir + "mobile-" + width + ".png" });
    const topBefore = g.top.top;
    const findBefore = g.find.top;
    await page.locator("#result").evaluate((node) => { node.scrollTop = 500; });
    g = await geometry(page);
    assert.ok(g.contentScrollTop > 0, width + "px lower content failed to scroll");
    assert.ok(Math.abs(g.top.top - topBefore) < 2 && Math.abs(g.find.top - findBefore) < 2,
      width + "px persistent header moved while lower content scrolled");
    await page.screenshot({ path: evidenceDir + "mobile-" + width + "-scrolled.png" });
    await page.locator("#stockHelpButton").click();
    const helpBox = await popover.boundingBox();
    const findBox = await page.locator(".search-form").boundingBox();
    assert.ok(helpBox.x >= 0 && helpBox.x + helpBox.width <= width + 1, width + "px Stock help exceeds viewport");
    assert.ok(helpBox.y >= findBox.y + findBox.height - 1, width + "px Stock help covers Find");
    assert.equal(await stock.isChecked(), initialStock, "help changed checkbox on mobile");
    await page.screenshot({ path: evidenceDir + "mobile-" + width + "-stock-help.png" });
    await page.locator(".fixture-guide summary").click();
    assert.ok(await page.locator(".fixture-guide").evaluate((node) => node.open), "instructions expand");
    await page.screenshot({ path: evidenceDir + "mobile-" + width + "-instructions.png" });
    await page.locator('[data-language="fi"]').click();
    assert.ok((await button.getAttribute("aria-label"))?.trim(), "Finnish help accessible label missing");
    await page.locator('[data-language="en"]').click();
    assert.ok((await button.getAttribute("aria-label"))?.trim(), "English help accessible label missing");
  }

  // Responsive orientation is simulated; a physical soft keyboard is not.
  await page.setViewportSize({ width: 640, height: 360 });
  g = await geometry(page);
  assert.ok(g.pageWidth <= g.viewport.width + 1, "landscape horizontal overflow");
  assert.ok(g.content.height >= 40, "landscape content became inaccessible");
  await page.screenshot({ path: evidenceDir + "mobile-landscape.png" });
  console.log("PASS: browser geometry, independent scrolling, Stock help, translation controls and screenshots");
  console.log("Evidence directory: " + evidenceDir);
  if (!base) console.log("Scope: built local UI, not a verified deployed Worker or real device soft keyboard");
} finally {
  await browser?.close();
  if (local) await new Promise((done) => local.server.close(done));
}
