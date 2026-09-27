// #895: real deployed-main browser screenshots. No mocked API, remote writes, or Admin secrets.
// Distinct from scripts/browser-evidence.mjs, which validates interactive synthetic fixtures.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const base = (process.env.VIEPS_BROWSER_URL || "https://vieps.parts-5ec.workers.dev").replace(/\/+$/, "");
const output = resolve(process.env.VIEPS_SCREENSHOT_DIR || "browser-evidence/deployed-main");
const expectedAsset = process.env.VIEPS_MAIN_ASSET;
const mainSha = process.env.VIEPS_MAIN_SHA;
const partNumber = "MJB7703AA"; // Existing published runtime fixture, not real JEPC evidence.
assert.ok(expectedAsset && mainSha, "A separate actual-main app.js and commit SHA are required");
const hash = (data) => createHash("sha256").update(data).digest("hex");
const expectedHash = hash(await readFile(expectedAsset));
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
await mkdir(output, { recursive: true });

// An outdated Worker/static asset must not be represented as the current deployed main UI.
// This check verifies the static app.js, not the entire Worker revision or D1 migrations.
let actualHash;
for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    const response = await fetch(base + "/app.js?deployed_evidence=" + Date.now(), {
      headers: { "cache-control": "no-cache" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    actualHash = hash(Buffer.from(await response.arrayBuffer()));
    if (actualHash === expectedHash) break;
    console.log("Deployed app.js differs from main, attempt " + attempt + "/12");
  } catch (error) {
    if (attempt === 12) throw new Error("Cannot fetch deployed app.js: " + error.message);
    console.log("Deployed app.js unavailable, attempt " + attempt + "/12: " + error.message);
  }
  if (attempt < 12) await sleep(15000);
}
assert.equal(actualHash, expectedHash, "Deployed app.js is not the actual main asset");

const browser = await chromium.launch({ headless: true });
const manifest = {
  target: base, main_sha: mainSha, deployed_app_sha256: actualHash,
  captured_at: new Date().toISOString(),
  provenance: "live deployed Worker / shared D1, not an API mock or Suitability fixture-mode demo",
  part_number: partNumber, views: [],
};
try {
  const api = await browser.newContext();
  const health = await api.request.get(base + "/api/health", { timeout: 20000 });
  assert.equal(health.status(), 200, "deployed Worker health");
  const healthData = await health.json();
  assert.equal(healthData.ok, true);
  assert.equal(healthData.database, "ok");
  const suitability = await api.request.get(base + "/api/vieps/suitability", { timeout: 20000 });
  assert.equal(suitability.status(), 503, "shared Worker must not advertise synthetic suitability");
  const state = await suitability.json();
  assert.equal(state.state, "unavailable");
  assert.equal(state.fixture_mode, false);
  assert.equal(state.reason, "normalized_suitability_not_published");
  manifest.suitability = { http_status: suitability.status(), ...state };
  const part = await api.request.get(base + "/api/vieps/part?q=" + partNumber, {
    timeout: 20000,
  });
  assert.equal(part.status(), 200, "the published test PART must be queryable");
  const partData = await part.json();
  assert.equal(partData.part?.part_number_normalized, partNumber);
  assert.ok(Array.isArray(partData.fitment) && partData.fitment.length,
    "the published PART must carry Applicable Models evidence");
  const expectedRanges = partData.fitment
    .filter((r) => r.applicability_state === "applicable" && r.range_code && r.range_name);
  manifest.applicable_model_evidence = expectedRanges.map((r) => ({
    range_code: r.range_code, range_name: r.range_name,
    verification_status: r.verification_status,
  }));
  await api.close();

  for (const view of [
    { name: "desktop", width: 1366, height: 900 },
    { name: "tablet", width: 900, height: 800 },
    { name: "mobile-320", width: 320, height: 780 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      deviceScaleFactor: 1,
    });
    try {
      const page = await context.newPage();
      await page.goto(base + "/?deployed_evidence=" + Date.now(), {
        waitUntil: "domcontentloaded", timeout: 35000,
      });
      await page.locator("#variationsHeading").waitFor({ state: "visible" });
      await page.locator("#partNumber").fill(partNumber);
      const suitabilityResponse = page.waitForResponse((response) => {
        if (!response.url().includes("/api/vieps/suitability?")) return false;
        return new URL(response.url()).searchParams.get("q") === partNumber;
      }, { timeout: 30000 });
      await page.locator("#partNumber").press("Enter");
      const facetResponse = await suitabilityResponse;
      assert.equal(facetResponse.status(), 503, view.name + ": no invented public fitment");
      await page.waitForFunction((pn) => {
        const card = document.querySelector("#partCard");
        const ranges = document.querySelector("#ranges");
        return card?.textContent?.includes(pn) && ranges?.textContent?.trim();
      }, partNumber, { timeout: 30000 });
      await page.waitForFunction(() => {
        const group = document.querySelector("#variationOptions");
        const status = document.querySelector("#variationsStatus");
        return group && !group.querySelector("input") && status?.textContent?.trim();
      }, null, { timeout: 15000 });
      const geometry = await page.evaluate(() => {
        const heading = document.querySelector("#variationsHeading");
        const group = document.querySelector("#variationOptions");
        const status = document.querySelector("#variationsStatus");
        const right = document.querySelector(".right-workspace");
        const ranges = document.querySelector("#ranges");
        const evidence = document.querySelector("#rangeEvidence");
        const top = document.querySelector(".vin-panel");
        return {
          page_width: document.documentElement.scrollWidth,
          body_width: document.body.scrollWidth,
          viewport_width: window.innerWidth,
          upper_suitability_present: Boolean(heading && group
            && top?.contains(heading) && top?.contains(group)),
          obsolete_dropdown_count: document.querySelectorAll("#variationsSelect").length,
          lower_duplicate_count: document.querySelectorAll(".centre-detail .variation-options, .visual-panel #variationOptions").length,
          right_applicable_models_present: Boolean(right?.contains(ranges)
            && right?.contains(evidence)),
          ranges_text: ranges?.textContent?.trim() || "",
          evidence_text: evidence?.textContent?.trim() || "",
          suitability_status: status?.textContent?.trim() || "",
          option_count: group?.querySelectorAll("input").length || 0,
        };
      });
      assert.ok(geometry.upper_suitability_present, view.name + ": upper filter misplaced");
      assert.equal(geometry.obsolete_dropdown_count, 0, view.name + ": obsolete dropdown");
      assert.equal(geometry.lower_duplicate_count, 0, view.name + ": lower duplicate filter");
      assert.ok(geometry.right_applicable_models_present,
        view.name + ": Applicable Models is not in the right workspace");
      assert.ok(geometry.ranges_text && geometry.evidence_text,
        view.name + ": missing rendered Applicable Models evidence");
      if (expectedRanges.length) {
        assert.ok(expectedRanges.some((r) => geometry.ranges_text.includes(r.range_code)),
          view.name + ": displayed Applicable Models must match the live PART API");
      }
      assert.ok(geometry.page_width <= view.width + 1
        && geometry.body_width <= view.width + 1,
        view.name + ": whole-page horizontal overflow");
      assert.equal(geometry.option_count, 0,
        view.name + ": fixture-only controls must remain unpublished on shared Worker");
      const filename = view.name + ".png";
      await page.screenshot({ path: resolve(output, filename), fullPage: true });
      const screenshot = await readFile(resolve(output, filename));
      manifest.views.push({
        name: view.name, width: view.width, height: view.height,
        filename, sha256: hash(screenshot), bytes: screenshot.length, geometry,
      });
      console.log("PASS deployed-main " + view.name + " screenshot: " + filename
        + ", PNG bytes: " + screenshot.length);
    } finally {
      await context.close();
    }
  }
  await writeFile(resolve(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log("PASS: three real deployed-main screenshots; source asset matches " + mainSha
    + ". Suitability remains intentionally unavailable without real JEPC data.");
} finally {
  await browser.close();
}
