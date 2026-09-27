import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../public/stock-admin.html", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../public/stock-admin.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/vieps-tailwind.css", import.meta.url), "utf8");

test("Stock Admin is one focused page without application navigation shell", () => {
  assert.match(html, /<h1 data-i18n="stock_admin\.heading"><\/h1>/);
  assert.doesNotMatch(html, /<nav\b/i);
  assert.doesNotMatch(html, /sidebar/i);
  assert.doesNotMatch(html, /breadcrumb/i);
});

test("Stock Admin exposes explicit canonical and unresolved identity paths", () => {
  assert.match(html, /<option value="canonical"/);
  assert.match(html, /<option value="unresolved"/);
  assert.match(html, /id="partLookupQuery"/);
  assert.match(html, /id="partId"/);
  assert.match(js, /setIdentityMode/);
  assert.match(js, /part_required/);
  assert.match(js, /unresolved_source_required/);
});

test("Stock Admin exposes approved mutable MVP stock fields", () => {
  for (const id of [
    "partNumber",
    "quantity",
    "conditionCode",
    "storageLocationId",
    "sourcePartyId",
    "donorVehicleId",
    "source",
    "sourceRef",
    "price",
    "currency",
    "available",
    "notes",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /id="deleteStock"/);
});

test("Stock Admin exposes normalized search filters and recursive location metadata path", () => {
  assert.match(html, /id="stockConditionFilter"/);
  assert.match(html, /id="stockAvailabilityFilter"/);
  assert.match(html, /id="stockLocationFilter"/);
  assert.match(js, /condition_code/);
  assert.match(js, /storage_location_id/);
  assert.match(js, /parent_id/);
  assert.match(js, /names\.unshift/);
});

test("Stock Admin keeps physical-stock photo upload outside current MVP implementation", () => {
  assert.doesNotMatch(html, /type="file"/i);
  assert.doesNotMatch(js, /getUserMedia|capture=/i);
});


test("Stock Admin initializes i18n and wires locale controls", () => {
  assert.match(html, /data-language="fi"/);
  assert.match(html, /data-language="en"/);
  assert.match(js, /i18n\?\.init\(\)/);
  assert.match(js, /querySelectorAll\?\.\("\[data-language\]"\)/);
  assert.match(js, /changeLanguage\(control\.dataset\.language\)/);
  assert.match(js, /refreshForLanguageChange/);
});

test("Stock Admin language refresh reapplies static and dynamic localized content", () => {
  assert.match(js, /i18n\?\.applyDocument\(\)/);
  assert.match(js, /render\(\)/);
  assert.match(js, /statusTranslationKey/);
  assert.match(js, /setLocalizedStatus\(statusTranslationKey, statusIsError\)/);
});


test("Stock Admin uses its own scrollable admin shell instead of the fitted Concept-11 viewport", () => {
  assert.match(html, /<html[^>]*class="stock-admin-document"/);
  assert.match(html, /<body[^>]*class="stock-admin-page"/);
  assert.match(html, /class="app-shell stock-admin-shell"/);
  assert.match(css, /\.stock-admin-document[\s\S]*overflow:\s*auto/);
  assert.match(css, /\.stock-admin-shell[\s\S]*height:\s*auto/);
  assert.match(css, /\.stock-admin-shell[\s\S]*overflow:\s*visible/);
});

test("Stock Admin multi-field forms use dedicated admin layout classes", () => {
  assert.match(html, /id="accessForm" class="admin-access-form"/);
  assert.match(html, /id="stockSearch" class="admin-stock-search"/);
  assert.match(html, /class="admin-filter-grid"/);
  assert.match(html, /class="admin-form-grid admin-stock-fields"/);
  assert.match(html, /class="admin-actions"/);
  assert.doesNotMatch(html, /id="accessForm" class="search-form"/);
  assert.doesNotMatch(html, /id="stockSearch" class="search-form"/);
});

test("Stock Admin responsive CSS keeps fields and actions usable on narrow screens", () => {
  assert.match(css, /\.admin-filter-grid[\s\S]*grid-cols-3/);
  assert.match(css, /\.admin-form-grid[\s\S]*grid-cols-2/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.admin-access-form,[\s\S]*\.admin-form-grid,[\s\S]*\.admin-canonical-identity[\s\S]*grid-cols-1/);
  assert.match(css, /\.admin-actions[\s\S]*flex-col/);
});


test("Stock Admin does not expose technical placeholder site names to operators", () => {
  assert.match(js, /isTechnicalSitePlaceholder/);
  assert.match(js, /name not recorded in xlsx/i);
  assert.match(js, /visibleSiteName\(location\.site_name\)/);
  assert.match(js, /visibleSiteName\(row\.storage_site_name\)/);
  assert.doesNotMatch(js, /RnX site - name not recorded in XLSX/);
});


test("Suitability Admin reuses one page, exposes sourced mapping and retains STOCK controls", () => {
  for (const id of ["suitabilityAdminPanel","suitabilityCategoryForm","suitabilityValueForm",
    "suitabilitySourceSearch","suitabilitySourceSelect","suitabilitySourceDetails",
    "suitabilityMappingForm","suitabilityReviewerRef","suitabilityEvidenceNote",
    "suitabilityShowHistory","suitabilityMoreSources"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.ok(js.includes('/api/admin/suitability/mappings'));
  assert.match(js, /source_namespace/);
  assert.match(js, /source_group_code/);
  assert.match(js, /loadSuitabilityAdmin/);
  assert.match(js, /renderSuitabilityAdmin/);
  assert.ok(css.includes('max-width: 100%'));
  assert.ok(css.includes('overflow-wrap: anywhere'));
  assert.match(html, /id="stockForm"/);
  assert.doesNotMatch(html, /<nav\b/i);
});

// Exercise the actual browser script using stock API response shapes.
async function renderStockLocation(locations, row) {
  const elements = new Map();
  const element = (id = "") => ({
    id, value: "", textContent: "", children: [], handlers: {},
    classList: { toggle() {} },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    append(child) { this.children.push(child); },
    replaceChildren(...children) { this.children = children; this.textContent = ""; },
  });
  const byId = (id) => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  };
  const document = {
    getElementById: byId,
    createElement: () => element(),
    querySelectorAll: () => [],
  };
  const fetch = async (path) => {
    const payload = path === "/api/stock-meta"
      ? { locations, source_parties: [], vehicles: [] }
      : path.startsWith("/api/stock?")
        ? { results: [row] }
        : null;
    assert.ok(payload, "unexpected API call: " + path);
    return { ok: true, json: async () => payload };
  };
  vm.runInNewContext(js, {
    document, fetch, URLSearchParams,
    globalThis: { viepsI18n: { init() {}, t: (key) => key } },
  });
  await byId("accessForm").handlers.submit({ preventDefault() {} });
  const result = byId("stockList").children[0]?.textContent;
  const option = byId("storageLocationId").children
    .find((item) => String(item.value) === String(row.storage_location_id));
  return { result, selector: option?.textContent };
}

test("Stock Admin compact result includes R2A without showing the #856 placeholder", async () => {
  const placeholder = "RnX site - name not recorded in XLSX";
  const { result, selector } = await renderStockLocation([
    { id: 71, name: "R2A", parent_id: null, site_name: placeholder, location_type: "shelf" },
    { id: 72, name: "B14", parent_id: 71, site_name: placeholder, location_type: "box" },
  ], {
    part_number: "HJA3403AB", quantity: 1, condition_code: null,
    storage_location_id: "72", storage_location_name: "B14", storage_site_name: placeholder,
  });
  assert.match(result, /HJA3403AB.*R2A \/ B14/);
  assert.doesNotMatch(result, /name not recorded in XLSX/);
  assert.equal(selector, "R2A / B14 (box)");
});

test("Stock Admin displays nested rack, shelf and box in order", async () => {
  const locations = [
    { id: 1, name: "Rack 4", parent_id: null, site_name: "Depot", location_type: "rack" },
    { id: 2, name: "S2", parent_id: 1, site_name: "Depot", location_type: "shelf" },
    { id: 3, name: "B9", parent_id: 2, site_name: "Depot", location_type: "box" },
  ];
  const { result, selector } = await renderStockLocation(locations, {
    part_number: "P1", quantity: 1, storage_location_id: 3,
    storage_location_name: "B9", storage_site_name: "Depot",
  });
  assert.match(result, /Depot \/ Rack 4 \/ S2 \/ B9$/);
  assert.equal(selector, "Depot / Rack 4 / S2 / B9 (box)");
});

test("Stock Admin retains root-only location labels", async () => {
  const { result, selector } = await renderStockLocation([
    { id: 4, name: "Rack 1", parent_id: null, site_name: "Depot", location_type: "rack" },
  ], {
    part_number: "P2", quantity: 2, storage_location_id: 4,
    storage_location_name: "Rack 1", storage_site_name: "Depot",
  });
  assert.match(result, /Depot \/ Rack 1$/);
  assert.equal(selector, "Depot / Rack 1 (rack)");
});

test("Stock Admin falls back to API location when metadata is missing", async () => {
  const { result } = await renderStockLocation([], {
    part_number: "P3", quantity: 1, storage_location_id: 999,
    storage_location_name: "B14",
    storage_site_name: "RnX site - name not recorded in XLSX",
  });
  assert.match(result, /B14$/);
  assert.doesNotMatch(result, /name not recorded in XLSX/);
});
