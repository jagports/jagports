import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const runtimeCode = readFileSync(new URL("../public/i18n-runtime.js", import.meta.url), "utf8");
const en = JSON.parse(readFileSync(new URL("../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json", import.meta.url), "utf8"));
const fi = JSON.parse(readFileSync(new URL("../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json", import.meta.url), "utf8"));

function runtime(resources = { en, fi }) {
  const document = {
    documentElement: { lang: "en" },
    getElementById() { return null; },
    querySelectorAll() { return []; },
  };
  const context = { document, Intl, VIEPS_I18N_RESOURCES: resources };
  vm.runInNewContext(runtimeCode, context);
  return { document, i18n: context.viepsI18n };
}

test("VIEPS i18n defaults and falls back to English", () => {
  const { document, i18n } = runtime();
  assert.equal(i18n.init(), "en");
  assert.equal(document.documentElement.lang, "en");
  assert.equal(i18n.t("common.search"), "Search");
  assert.equal(i18n.changeLanguage("fr-FR"), "en");
  assert.equal(i18n.t("common.availability"), "Availability");
});

test("Finnish locale updates document metadata and shared UI resources", () => {
  const { document, i18n } = runtime();
  i18n.init({ language: "fi" });
  assert.equal(document.documentElement.lang, "fi");
  assert.equal(i18n.t("common.search"), "Haku");
  assert.equal(i18n.t("common.availability"), "Saatavuus");
});

test("i18next v4 plural families are selected with CLDR plural rules", () => {
  const { i18n } = runtime();
  i18n.init({ language: "en" });
  assert.equal(i18n.t("part.epc_occurrence", { count: 1 }), "1 EPC occurrence");
  assert.equal(i18n.t("part.epc_occurrence", { count: 2 }), "2 EPC occurrences");
  i18n.changeLanguage("fi");
  assert.equal(i18n.t("part.epc_occurrence", { count: 1 }), "1 EPC-esiintymä");
  assert.equal(i18n.t("part.epc_occurrence", { count: 2 }), "2 EPC-esiintymää");
});

test("missing selected-locale values fall back predictably to English", () => {
  const incompleteFi = structuredClone(fi);
  delete incompleteFi.common.search;
  const { i18n } = runtime({ en, fi: incompleteFi });
  i18n.init({ language: "fi" });
  assert.equal(i18n.t("common.search"), "Search");
});

test("currency and number formatting use the active locale", () => {
  const { i18n } = runtime();
  i18n.init({ language: "en" });
  const englishCurrency = i18n.formatCurrency(1234.5, "EUR");
  const englishNumber = i18n.formatNumber(1234.5);
  i18n.changeLanguage("fi");
  const finnishCurrency = i18n.formatCurrency(1234.5, "EUR");
  const finnishNumber = i18n.formatNumber(1234.5);
  assert.notEqual(finnishCurrency, englishCurrency);
  assert.notEqual(finnishNumber, englishNumber);
  assert.match(finnishCurrency, /€/u);
});

test("runtime has no network or Weblate dependency", () => {
  assert.doesNotMatch(runtimeCode, /fetch\(|weblate|https?:\/\//iu);
});
