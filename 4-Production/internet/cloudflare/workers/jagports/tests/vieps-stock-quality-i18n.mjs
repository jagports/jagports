import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const appSource = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const i18nSource = readFileSync(new URL("../public/i18n-runtime.js", import.meta.url), "utf8");
const en = JSON.parse(readFileSync(new URL("../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json", import.meta.url), "utf8"));
const fi = JSON.parse(readFileSync(new URL("../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json", import.meta.url), "utf8"));

function loadStockRenderer(language = "en") {
  const context = {
    document: {
      documentElement: { lang: language },
      querySelectorAll() { return []; },
    },
    Intl,
    VIEPS_I18N_RESOURCES: { en, fi },
    console,
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(i18nSource, context);
  context.viepsI18n.init({ language });
  vm.runInContext(`${appSource}\n;globalThis.testFormatStockQuality = formatStockQuality; globalThis.testRenderStockRows = renderStockRows;`, context);
  return context;
}

test("normalized A-E stock quality codes resolve to English presentation without using legacy condition text", () => {
  const context = loadStockRenderer("en");
  const labels = {
    A: "New / Unused / Original Package",
    B: "Used / Good Working / Known History",
    C: "Used / Usable / No warranty",
    D: "Repairs / Needs Conditioning / Spares only",
    E: "Broken / Reference / Knowledge Gains",
  };

  for (const [code, label] of Object.entries(labels)) {
    const item = { condition: "legacy free text", condition_code: code };
    assert.equal(context.testFormatStockQuality(item), `${code} — ${label}`);
    assert.equal(item.condition_code, code);
  }

  const html = context.testRenderStockRows([{
    available: 1,
    condition: "legacy free text",
    condition_code: "B",
    currency: "EUR",
    location: "Fixture Shelf",
    price: 14.5,
    quantity: 1,
    source: "fixture",
    status: "available",
  }]);
  assert.match(html, /B — Used \/ Good Working \/ Known History/);
  assert.doesNotMatch(html, /legacy free text/);
});

test("stock quality presentation switches to Finnish while preserving normalized code identity", () => {
  const context = loadStockRenderer("en");
  const item = { condition_code: "D" };

  assert.equal(context.testFormatStockQuality(item), "D — Repairs / Needs Conditioning / Spares only");
  context.viepsI18n.changeLanguage("fi");
  assert.equal(context.testFormatStockQuality(item), "D — Korjattava / kunnostettava / varaosiksi");
  assert.equal(item.condition_code, "D");
});

test("NULL stock quality renders the explicit localized unclassified state", () => {
  const context = loadStockRenderer("en");
  const item = { available: 1, condition_code: null };

  assert.equal(context.testFormatStockQuality(item), "Condition not classified");
  context.viepsI18n.changeLanguage("fi");
  assert.equal(context.testFormatStockQuality(item), "Kunto luokittelematta");
  assert.equal(item.condition_code, null);
});

test("unexpected non-normalized code is not translated into an invented quality class", () => {
  const context = loadStockRenderer("en");
  assert.equal(context.testFormatStockQuality({ condition_code: "Z" }), "Z");
});
