import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

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
