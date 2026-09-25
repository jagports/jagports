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

// Browser-only PART responses exercise existing search/selection UI, not new APIs.
const browserParts = [
  { id: 101, part_number_normalized: "BRTEST1", description: "Left fixture PART" },
  { id: 102, part_number_normalized: "BRTEST2", description: "Right fixture PART" },
];
const browserRoots = [{ node_id: 1, label: "XK Range (browser fixture)", sort_order: 1 }];
const browserPaths = [
  { part_id: 101, node_id: 2, nodes: [
    { node_id: 1, label: "XK Range (browser fixture)" }, { node_id: 2, label: "Front" },
  ] },
  { part_id: 102, node_id: 3, nodes: [
    { node_id: 1, label: "XK Range (browser fixture)" }, { node_id: 3, label: "Rear" },
  ] },
];


// Synthetic source-qualified API fixture for the browser layout harness.
// Independent D1/endpoint assertions are exercised on implementation PR #892.
const browserSuitability = [
  ["body", [["coupe", "Coupe", "Coupé"], ["convertible", "Convertible", "Avoauto"]], "Body", "Kori"],
  ["engine_aspiration", [["na", "NA", "Vapaasti hengittävä"], ["supercharged", "Supercharged", "Mekaanisesti ahdettu"]], "Engine aspiration", "Moottorin ahtaminen"],
  ["seat_equipment", [["memory_seat", "Memory Seat", "Muisti-istuin"], ["powered_seats", "Powered Seats", "Sähkösäätöiset istuimet"]], "Seat equipment", "Istuinvarusteet"],
  ["steering", [["LHD", "LHD", "Vasemmalta ohjattava"], ["RHD", "RHD", "Oikealta ohjattava"]], "Steering", "Ohjaus"],
];
const browserOccurrences = [
  { part_id: 101, occurrence_id: 1001, occurrence_key: "BR-O-A", values: [
    "body:coupe", "steering:LHD", "engine_aspiration:supercharged",
    "seat_equipment:memory_seat", "seat_equipment:powered_seats",
  ] },
  { part_id: 102, occurrence_id: 1002, occurrence_key: "BR-O-B", values: [
    "body:convertible", "steering:RHD", "engine_aspiration:na",
    "seat_equipment:powered_seats",
  ] },
];
function browserSuitabilityResponse(params) {
  const fi = params.get("ui_language") === "fi";
  const categories = browserSuitability.map(([code, values, en, fin]) => ({
    code, name: fi ? fin : en, description: fi ? fin : en,
    values: values.map(([value, english, finnish], i) => ({
      id: code + ":" + value, code: value,
      name: fi ? finnish : english, description: fi ? finnish : english,
      source_descriptions: [{
        id: 9000 + i, mapping_revision_id: 10000 + i,
        source_namespace: "fixture:pre-jepc-suitability:v1",
        dataset: "browser-v1", language: "en", locator: "browser/" + code + "/" + value,
        original_text: english, provenance: "synthetic_fixture",
      }],
    })),
  }));
  const selected = params.getAll("facet");
  const grouped = new Map();
  for (const id of selected) {
    const [dimension] = id.split(":");
    if (!grouped.has(dimension)) grouped.set(dimension, new Set());
    grouped.get(dimension).add(id);
  }
  const matches = params.get("stock_only") === "1" ||
    (params.get("q") && !["BRTEST", "BRTEST1", "BRTEST2"].includes(params.get("q")))
    ? [] : browserOccurrences.filter((item) => [...grouped].every(([dimension, choices]) =>
      dimension === "seat_equipment"
        ? [...choices].every((id) => item.values.includes(id))
        : [...choices].some((id) => item.values.includes(id))));
  return {
    state: matches.length ? "applicable" : "no_match", fixture_mode: true,
    source_namespace: "fixture:pre-jepc-suitability:v1",
    selected, query: params.get("q") || "", categories, matches, excluded_occurrences: [], unavailable_occurrences: [],
    available_options: [...new Set(matches.flatMap((m) => m.values))].sort(),
  };
}

async function localServer() {
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname === "/api/vieps/tree" && new URL(request.url, "http://localhost").searchParams.has("root")) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        roots: [{ node_id: 1, label: "XK Range (browser fixture)", sort_order: 1 }],
        stock_browse_state: "unsupported",
      }));
      return;
    }
    if (pathname === "/api/vieps/suitability") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(browserSuitabilityResponse(
        new URL(request.url, "http://localhost").searchParams)));
      return;
    }
    if (pathname === "/api/vieps/part") {
      const params = new URL(request.url, "http://localhost").searchParams;
      if (params.get("q") === "BRTEST") {
        const id = params.get("candidate_id");
        const part = browserParts.find((item) => String(item.id) === id);
        const payload = !id ? {
          state: "multiple_match", query: "BRTEST",
          matches: [...browserParts, { ...browserParts[0] }],
          parts_tree: browserPaths, tree_roots: browserRoots,
        } : part ? {
          state: "resolved", part, tree_roots: browserRoots,
          parts_tree: browserPaths.filter((entry) => entry.part_id === part.id),
          occurrences: [], stock: [], images: [], diagrams: [],
          fitment: [{ range_code: "XK", range_name: "XK Range",
            variation: "Browser-confirmed fixture", applicability_state: "applicable",
            verification_status: "fixture" }],
        } : { error: "candidate not found" };
        response.writeHead(id && !part ? 404 : 200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(payload));
        return;
      }
    }
    if (pathname.startsWith("/api/")) {
      response.writeHead(503, { "Content-Type": "application/json" });
      response.end('{"error":"Other catalogue API operations are outside the layout fixture"}');
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
      rangesHeight: rect(".ranges-panel").height,
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
  if (!base) await page.locator("#tree .tree-node-row").first().waitFor();

  if (!base) {
    // #875 browse-only vocabulary; no selected PART and no fabricated fitment.
    const expectedBrowseLabels = [
      "Jaguar Accessories", "Daimler Limousine", "E-Pace", "E-Type",
      "F-Pace", "F-Type", "S-Type", "X-Type", "XE Range", "XF Range",
      "XJ Range", "XJS", "XK Range",
    ];
    const browseRows = page.locator("#ranges .browse-range-list li");
    await browseRows.first().waitFor();
    assert.deepEqual((await browseRows.allTextContents()).map((s) => s.trim()), expectedBrowseLabels,
      "the right Applicable Models index must show exactly 13 browse labels in order");
    assert.equal(await page.locator("#ranges .browse-range-list input:disabled").count(), 13,
      "all synthetic browse filter checkboxes must remain disabled");
    assert.ok(await page.locator("#rangeSelect").isDisabled(),
      "without PART context, model detail selection cannot masquerade as a working filter");
    assert.equal(await page.locator("#partCard").textContent().then((text) =>
      expectedBrowseLabels.some((label) => text.includes(label))), false,
    "fixture labels must not become selected-PART fitment");
  }

  // Desktop Concept-11 layout and image evidence.
  let g = await geometry(page);
  assert.ok(g.pageWidth <= g.viewport.width + 1, "desktop horizontal overflow");
  const desktopTree = await page.locator(".tree-panel").boundingBox();
  const desktopSearch = await page.locator(".search-block").boundingBox();
  assert.ok(desktopTree.x < desktopSearch.x, "desktop tree remains left of Find");
  // #875: verify all three workspace positions and native independent scroll
  // affordances without replacing the original #893 mobile assertions.
  const desktopAreas = await page.evaluate(() => {
    const bounds = (selector) => {
      const el = document.querySelector(selector);
      const rect = el.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        height: rect.height, overflowY: getComputedStyle(el).overflowY };
    };
    return {
      availability: bounds(".availability-block"), tree: bounds(".tree-panel"),
      treeScroll: bounds("#tree"), vin: bounds(".vin-panel"),
      location: bounds(".location-panel"), selectedPart: bounds(".visual-panel"),
      find: bounds(".search-block"), results: bounds(".results-panel"),
      resultsScroll: bounds("#searchResults"), models: bounds(".ranges-panel"),
      modelsScroll: bounds(".ranges-scroll"),
      pageScroll: document.documentElement.scrollHeight - innerHeight,
    };
  });
  assert.ok(desktopAreas.availability.bottom <= desktopAreas.tree.top + 2, "Availability must precede the tree");
  assert.ok(desktopAreas.tree.right <= desktopAreas.vin.left + 2, "tree and VIN must be separate columns");
  assert.ok(desktopAreas.vin.right <= desktopAreas.find.left + 2, "Find must occupy the right column");
  assert.ok(desktopAreas.vin.bottom <= desktopAreas.location.top + 2, "VIN and variations must precede Location");
  assert.ok(Math.abs(desktopAreas.location.top - desktopAreas.selectedPart.top) <= 2,
    "Location and selected PART must share a row");
  assert.ok(desktopAreas.location.right <= desktopAreas.selectedPart.left + 2,
    "Location must be left of selected PART");
  assert.ok(desktopAreas.find.bottom <= desktopAreas.results.top + 2 &&
    desktopAreas.results.bottom <= desktopAreas.models.top + 2,
    "Find, Search Results and Applicable Models must stack in order");
  for (const key of ["treeScroll", "resultsScroll", "modelsScroll"]) {
    assert.equal(desktopAreas[key].overflowY, "auto", key + " must scroll independently");
    assert.ok(desktopAreas[key].height > 30, key + " has no usable allocated height");
  }
  assert.ok(desktopAreas.pageScroll <= 1, "normal desktop shell must not require page scrolling");
  assert.ok(desktopAreas.location.height > 80 && desktopAreas.selectedPart.height > 80,
    "desktop must retain sizeable Location and selected PART reservations");
  if (!base) {
    // Genuine independent scrolling under forced overflow; restore fixture DOM
    // before screenshots and #893 mobile/Stock-help interaction checks.
    const independent = await page.evaluate(() => {
      const selectors = ["#tree", "#searchResults", ".ranges-scroll"];
      const nodes = selectors.map((selector) => document.querySelector(selector));
      const original = nodes.map((node) => ({ node, html: node.innerHTML, top: node.scrollTop }));
      try {
        for (const node of nodes) {
          const filler = document.createElement("div");
          filler.style.height = "1400px";
          filler.textContent = "Scroll regression fixture";
          node.appendChild(filler);
          node.scrollTop = 0;
        }
        const overflow = nodes.map((node) => node.scrollHeight > node.clientHeight + 100);
        const isolated = [];
        for (let i = 0; i < nodes.length; i++) {
          for (const node of nodes) node.scrollTop = 0;
          nodes[i].scrollTop = 120;
          isolated.push(nodes[i].scrollTop > 0 &&
            nodes.every((node, j) => j === i || node.scrollTop === 0));
        }
        return { overflow, isolated, pageScroll: document.documentElement.scrollHeight - innerHeight };
      } finally {
        for (const { node, html, top } of original) {
          node.innerHTML = html;
          node.scrollTop = top;
        }
      }
    });
    assert.ok(independent.overflow.every(Boolean), "tree/results/models must independently overflow");
    assert.ok(independent.isolated.every(Boolean), "scrolling one panel must not scroll another");
    assert.ok(independent.pageScroll <= 1, "overflowing panels must not scroll the desktop page");
  }
  await page.screenshot({ path: evidenceDir + "desktop.png", fullPage: true });
  if (!base) {
    // Required #875 visual: multiple canonical results, then synchronized selection.
    await page.locator("#partNumber").fill("BRTEST");
    await page.locator("#partSearch").press("Enter");
    const resultLinks = page.locator("#searchResults [data-result-part-id]");
    await resultLinks.first().waitFor();
    assert.equal(await resultLinks.count(), 2, "duplicate occurrence must not duplicate canonical Search Results");
    assert.equal(await page.locator("#searchResults .selected-result").count(), 0,
      "multiple candidates must have no default PART selection");
    assert.equal(await page.locator("#searchResults .bookmark-label input:disabled").count(), 2,
      "each result keeps a separate disabled bookmark");
    await resultLinks.nth(1).focus();
    assert.equal(await page.evaluate(() => document.activeElement?.dataset?.resultPartId), "102",
      "result row must expose keyboard focus on the selectable PART link");
    await page.screenshot({ path: evidenceDir + "desktop-multiple-results.png", fullPage: true });

    await resultLinks.nth(1).click();
    await page.locator("#partCard").filter({ hasText: "BRTEST2" }).waitFor();
    assert.equal(await page.locator("#searchResults .selected-result [data-result-part-id='102'][aria-current='page']").count(), 1,
      "right-hand selected state must identify the canonical PART once");
    assert.equal(await page.locator("#tree [data-part-id='102'][aria-current='page']").count(), 1,
      "Parts Tree and Search Results must share one canonical selected PART");
    assert.equal(await page.locator("#tree [aria-current='page']").count(), 1,
      "only one tree occurrence may be active");
    assert.equal(await page.locator("#partCard").textContent().then((v) => (v.match(/BRTEST2/g) || []).length), 1,
      "central detail panel must contain one selected canonical PART identity");
    assert.match(await page.locator("#ranges").textContent(), /XK Range/,
      "selected-PART Applicable Models must come from positive fixture evidence");
    await page.screenshot({ path: evidenceDir + "desktop-synchronized-selection.png", fullPage: true });

    // #895 source-qualified fixture-backed filter uses the existing three
    // columns and synchronizes BOTH results surfaces without guessing fitment.
    const coupe = page.locator('#variationOptions [data-suitability-facet="body:coupe"]');
    await coupe.waitFor();
    await coupe.check();
    await page.locator('#variationOptions [data-suitability-facet="body:coupe"]:checked').waitFor();
    await page.locator('#searchResults [data-result-part-id="101"]').waitFor();
    await page.locator('#searchResults [data-result-part-id="102"]').waitFor({ state: "detached" });
    assert.equal(await page.locator("#searchResults [data-result-part-id]").count(), 1,
      "Suitability checkbox must actually narrow the right Search Results");
    assert.equal(await page.locator('#tree [data-part-id="102"]').count(), 0,
      "Suitability must filter left Parts Tree leaves in the same way");
    assert.equal(await page.locator('#partCard').textContent().then((v) => v.includes("BRTEST2")), false,
      "out-of-filter selected PART must be cleared");
    await page.locator('#variationOptions [data-suitability-facet="seat_equipment:memory_seat"]').check();
    await page.locator('#variationOptions [data-suitability-facet="seat_equipment:powered_seats"]').check();
    await page.locator('#variationOptions [data-suitability-facet="seat_equipment:powered_seats"]:checked').waitFor();
    assert.deepEqual(await page.locator('#variationOptions input:checked').evaluateAll((nodes) =>
      nodes.map((node) => node.closest("label").querySelector("span").textContent.trim())),
    ["Coupe", "Memory Seat", "Powered Seats"], "checked options appear first alphabetically");
    const groupScroll = await page.locator("#variationOptions").evaluate((node) => ({
      viewport: node.clientWidth, content: node.scrollWidth, overflowX: getComputedStyle(node).overflowX,
    }));
    assert.equal(groupScroll.overflowX, "auto");
    assert.ok(groupScroll.content >= groupScroll.viewport);
    await page.screenshot({ path: evidenceDir + "desktop-suitability-filter.png", fullPage: true });
    await page.locator('[data-language="fi"]').click();
    await page.locator("#variationOptions").filter({ hasText: "Coupé" }).waitFor();
    await page.locator('#variationOptions [data-suitability-facet="body:coupe"]:checked').waitFor();
    assert.match(await page.locator("#variationOptions").textContent(), /Coupé/);
    assert.match(await page.locator('#variationOptions label:has([data-suitability-facet="body:coupe"])').getAttribute("title"), /Coupe \[en;/);
    await page.screenshot({ path: evidenceDir + "desktop-suitability-fi.png", fullPage: true });
    await page.locator('[data-language="en"]').click();
    await page.locator("#partNumber").fill("");
    await page.locator("#tree .tree-node-row").first().waitFor();
    assert.equal(await page.locator("#variationOptions input:checked").count(), 0,
      "clearing search clears active suitability selections");
  }
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
  assert.equal(await page.evaluate(() => document.activeElement?.id), "stockHelpButton",
    "Escape restores keyboard focus to the Stock help trigger");
  await button.press("Space");
  assert.ok(await popover.isVisible(), "Space opens help");
  await button.press("Enter");
  assert.ok(!(await popover.isVisible()), "Enter closes pinned help");

  // Tablet regression uses the same #893 browser mechanism and no separate workflow.
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto(base || local.url, { waitUntil: "load" });
  if (!base) await page.locator("#tree .tree-node-row").first().waitFor();
  g = await geometry(page);
  assert.ok(g.pageWidth <= 901 && g.bodyWidth <= 901, "tablet horizontal overflow");
  const tabletAreas = await page.evaluate(() => {
    const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
    const left = rect(".left-workspace");
    const centre = rect(".centre-workspace");
    const right = rect(".right-workspace");
    return { left: { left: left.left, right: left.right, top: left.top },
      centre: { left: centre.left, right: centre.right, top: centre.top },
      right: { left: right.left, right: right.right, top: right.top } };
  });
  assert.ok(tabletAreas.left.right <= tabletAreas.centre.left + 2,
    "tablet keeps left and centre workspaces side by side");
  assert.ok(tabletAreas.right.top >= Math.min(tabletAreas.left.top, tabletAreas.centre.top),
    "tablet right workspace remains reachable after reflow");
  await page.locator("#partNumber").focus();
  assert.equal(await page.evaluate(() => document.activeElement?.id), "partNumber",
    "Find must remain keyboard focusable on tablet");
  assert.ok(await page.locator("#vinInput").isDisabled(),
    "unsupported VIN lookup stays explicitly disabled");
  assert.equal(await page.locator("#variationsSelect").count(), 0,
    "#895 removed the obsolete disabled variation dropdown");
  const variationGroup = page.locator("#variationOptions");
  assert.equal(await variationGroup.getAttribute("role"), "group",
    "#895 upper variation controls retain a labelled accessibility group");
  assert.equal(await variationGroup.getAttribute("aria-labelledby"), "variationsHeading",
    "upper variation controls use the visible heading");
  await page.screenshot({ path: evidenceDir + "tablet-900.png", fullPage: true });

  // Mobile snapshots prove the upper controls stay put while lower panels scroll.
  for (const width of [220, 320]) {
    await page.setViewportSize({ width, height: 780 });
    await page.goto(base || local.url, { waitUntil: "load" });
    if (!base) await page.locator("#tree .tree-node-row").first().waitFor();
    g = await geometry(page);
    assert.ok(g.pageWidth <= width + 1 && g.bodyWidth <= width + 1, width + "px horizontal overflow");
    assert.ok(g.contentScrollable, width + "px lower content must be independently scrollable");
    assert.ok(g.content.height >= 50, width + "px lower content is trapped");
    assert.ok(g.locationHeight >= 170 && g.rangesHeight >= 170 && g.visualHeight >= 300,
      width + "px reserved content panels shrank");
    await page.screenshot({ path: evidenceDir + "mobile-" + width + ".png" });
    if (!base) {
      await page.locator("#partNumber").fill("BRTEST");
      await page.locator("#partSearch").press("Enter");
      await page.locator('#variationOptions[data-current-query="BRTEST"]').waitFor();
      const facet = page.locator('#variationOptions [data-suitability-facet="body:coupe"]');
      await facet.waitFor();
      if (width === 220) {
        await facet.focus();
        await facet.press("Space");
      } else {
        await facet.check();
      }
      await page.locator('#variationOptions [data-suitability-facet="body:coupe"]:checked').waitFor();
      await page.locator('#searchResults [data-result-part-id="102"]').waitFor({ state: "detached" });
      const facetScroll = await page.locator("#variationOptions").evaluate((node) => ({
        overflowX: getComputedStyle(node).overflowX,
        viewport: node.clientWidth,
        content: node.scrollWidth,
      }));
      assert.equal(facetScroll.overflowX, "auto", width + "px facet row must scroll horizontally");
      assert.ok(facetScroll.content > facetScroll.viewport,
        width + "px long source-backed descriptions must stay inside the horizontal scroller");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        width + "px facet row must not widen the page");
      await page.screenshot({ path: evidenceDir + "mobile-" + width + "-suitability.png" });
    }
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
  // The same existing #893 browser workflow also verifies the real one-page
  // Admin layout and source-qualified mapping controls without publishing fixtures.
  if (!base) {
    const auditWrites = [];
    const originalSource = {
      id: 87709, original_text: "Coupe", source_language: "en",
      source_namespace: "fixture:pre-jepc-suitability:v1",
      dataset_key: "browser", source_key: "body/group-2",
      source_group_code: "Body-2", source_model_ref: "X100",
      record_locator: "browser/body/group-2", provenance_kind: "fixture",
      status: "proposed", revision: 1, dimension_id: 87701,
      value_code: "coupe", mapping_version: "browser-v1",
      evidence_note: "Unresolved source sample",
    };
    let currentSource = { ...originalSource };
    const fulfil = (route, body) => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify(body),
    });
    await page.route("**/api/**", async (route) => {
      const request = route.request(), url = new URL(request.url()), path = url.pathname;
      if (path === "/api/stock-meta") {
        await fulfil(route, { locations: [], source_parties: [], vehicles: [] });
      } else if (path === "/api/stock") {
        await fulfil(route, { results: [] });
      } else if (path === "/api/admin/suitability" && request.method() === "GET") {
        await fulfil(route, {
          categories: [{
            id: 87701, code: "body", name_en: "Body", name_fi: "Kori",
            description_en: "Body shape", description_fi: "Korin muoto",
          }],
          values: [{
            dimension_id: 87701, value_code: "coupe",
            name_en: "Coupe", name_fi: "Coupé",
            description_en: "Coupe body", description_fi: "Coupé-kori",
          }],
          sources: [currentSource], next_offset: null,
        });
      } else if (path === "/api/admin/suitability/mappings" && request.method() === "POST") {
        const body = JSON.parse(request.postData());
        auditWrites.push(body);
        currentSource = { ...currentSource, status: body.status,
          revision: currentSource.revision + 1, mapping_version: body.mapping_version,
          evidence_note: body.evidence_note, reviewer_ref: body.reviewer_ref };
        await fulfil(route, { mapping: { revision: currentSource.revision,
          status: currentSource.status } });
      } else if (path === "/api/admin/suitability/history") {
        await fulfil(route, { source_description_id: currentSource.id, audit: [],
          revisions: [
            { revision: 1, status: "proposed", mapping_version: "browser-v1",
              evidence_note: "Unresolved source sample" },
            { revision: 2, status: currentSource.status,
              mapping_version: currentSource.mapping_version,
              evidence_note: currentSource.evidence_note },
          ] });
      } else await route.continue();
    });
    await page.setViewportSize({ width: 1240, height: 860 });
    await page.goto(local.url + "stock-admin.html", { waitUntil: "load" });
    await page.locator("#adminToken").fill("browser-admin-test");
    await page.locator("#accessForm button[type=submit]").click();
    await page.locator('#suitabilitySourceSelect option[value="87709"]').waitFor();
    assert.match(await page.locator("#suitabilitySourceDetails").textContent(),
      /Coupe.*fixture:pre-jepc-suitability:v1.*Body-2/,
      "Admin must show raw text and its distinct source namespace and group");
    await page.locator("#suitabilityMappingStatus").selectOption("conflict");
    await page.locator("#suitabilityMappingVersion").fill("browser-v2");
    await page.locator("#suitabilityEvidenceNote").fill("Group requires separate verification");
    await page.locator("#suitabilityMappingForm button[type=submit]").click();
    await page.locator("#suitabilityAdminStatus").filter({ hasText: "Catalogue change saved" }).waitFor();
    assert.equal(auditWrites.length, 1, "Admin must submit exactly one new mapping revision");
    assert.equal(auditWrites[0].source_description_id, 87709,
      "mapping must use immutable source ID, not display text");
    assert.equal(auditWrites[0].status, "conflict",
      "unverified fixture description must not become verified JEPC");
    assert.equal(currentSource.original_text, "Coupe");
    await page.locator("#suitabilityShowHistory").click();
    await page.locator("#suitabilityHistory li").last().waitFor();
    assert.equal(await page.locator("#suitabilityHistory li").count(), 2,
      "Admin must show historic and current interpretation separately");
    await page.screenshot({ path: evidenceDir + "admin-suitability-desktop.png", fullPage: true });
    await page.locator('[data-language="fi"]').click();
    assert.match(await page.locator("#suitabilityAdminHeading").textContent(), /Soveltuvuusluokat/);
    await page.setViewportSize({ width: 320, height: 780 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 321,
      "Admin must not cause horizontal overflow on 320px mobile");
    await page.screenshot({ path: evidenceDir + "admin-suitability-mobile-320.png", fullPage: true });
    console.log("PASS: one-page Admin source-qualified mappings, history, EN/FI, mobile and screenshots");
  }

  console.log("PASS: #875 desktop/tablet/mobile geometry, synchronized PART selection, independent scrolling, accessibility and screenshots");
  console.log("Evidence directory: " + evidenceDir);
  if (!base) console.log("Scope: built local UI, not a verified deployed Worker or real device soft keyboard");
} finally {
  await browser?.close();
  if (local) await new Promise((done) => local.server.close(done));
}
